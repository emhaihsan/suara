import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { generateRefreshToken, hashToken } from '../lib/crypto.js';
import { getDatabase, users, refreshTokens } from '@suara/db';

// ─── Schemas ──────────────────────────────────────────────────

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const refreshSchema = z.object({
    refreshToken: z.string().min(1),
});

// ─── Helpers ──────────────────────────────────────────────────

function getDb() {
    return getDatabase(process.env.DATABASE_URL!);
}

async function createRefreshToken(db: ReturnType<typeof getDatabase>, userId: string) {
    const raw = generateRefreshToken();
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(refreshTokens).values({
        userId,
        tokenHash,
        expiresAt,
    });

    return raw;
}

// ─── Routes ───────────────────────────────────────────────────

export default async function authRoutes(app: FastifyInstance) {
    // ── POST /register ────────────────────────────────────────
    app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
        const result = registerSchema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.flatten().fieldErrors },
            });
        }

        const { email, password, name } = result.data;
        const db = getDb();

        // Check if user already exists
        const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
        if (existing) {
            return reply.status(409).send({
                success: false,
                error: { code: 'CONFLICT', message: 'Email is already registered' },
            });
        }

        // Hash password with Argon2
        const passwordHash = await argon2.hash(password);

        // Insert user
        const [user] = await db
            .insert(users)
            .values({ email, name, passwordHash })
            .returning({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt });

        // Issue tokens
        const accessToken = app.jwt.sign({ sub: user.id, email: user.email });
        const refreshToken = await createRefreshToken(db, user.id);

        return reply.status(201).send({
            success: true,
            data: { user, accessToken, refreshToken },
        });
    });

    // ── POST /login ───────────────────────────────────────────
    app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
        const result = loginSchema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.flatten().fieldErrors },
            });
        }

        const { email, password } = result.data;
        const db = getDb();

        // Find user
        const user = await db.query.users.findFirst({ where: eq(users.email, email) });
        if (!user) {
            return reply.status(401).send({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
            });
        }

        // Verify password
        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) {
            return reply.status(401).send({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
            });
        }

        // Issue tokens
        const accessToken = app.jwt.sign({ sub: user.id, email: user.email });
        const refreshToken = await createRefreshToken(db, user.id);

        return reply.status(200).send({
            success: true,
            data: {
                user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
                accessToken,
                refreshToken,
            },
        });
    });

    // ── POST /refresh ─────────────────────────────────────────
    app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
        const result = refreshSchema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
            });
        }

        const { refreshToken: rawToken } = result.data;
        const db = getDb();
        const tokenHash = hashToken(rawToken);

        // Find the refresh token
        const token = await db.query.refreshTokens.findFirst({
            where: eq(refreshTokens.tokenHash, tokenHash),
        });

        if (!token || token.expiresAt < new Date()) {
            return reply.status(401).send({
                success: false,
                error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' },
            });
        }

        // Delete old token (single-use / rotation)
        await db.delete(refreshTokens).where(eq(refreshTokens.id, token.id));

        // Look up user
        const user = await db.query.users.findFirst({
            where: eq(users.id, token.userId),
            columns: { id: true, email: true },
        });

        if (!user) {
            return reply.status(404).send({
                success: false,
                error: { code: 'NOT_FOUND', message: 'User not found' },
            });
        }

        // Issue new tokens (rotation)
        const accessToken = app.jwt.sign({ sub: user.id, email: user.email });
        const newRefreshToken = await createRefreshToken(db, user.id);

        return reply.status(200).send({
            success: true,
            data: { accessToken, refreshToken: newRefreshToken },
        });
    });

    // ── GET /me (protected) ───────────────────────────────────
    app.get('/me', { onRequest: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const db = getDb();

        const user = await db.query.users.findFirst({
            where: eq(users.id, request.user.sub),
            columns: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
        });

        if (!user) {
            return reply.status(404).send({
                success: false,
                error: { code: 'NOT_FOUND', message: 'User not found' },
            });
        }

        return reply.status(200).send({ success: true, data: { user } });
    });
}
