import fp from 'fastify-plugin';
import fjwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { getDatabase, users, apiKeys } from '@suara/db';
import { hashToken } from '../lib/crypto.js';

// Extend Fastify types for JWT
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { sub: string; email: string };
        user: { sub: string; email: string };
    }
}

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

function getDb() {
    return getDatabase(process.env.DATABASE_URL!);
}

async function jwtPlugin(app: FastifyInstance) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }

    await app.register(fjwt, {
        secret,
        sign: { expiresIn: '15m' },
    });

    app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader) {
                return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' } });
            }

            const token = authHeader.replace('Bearer ', '');

            // Dual auth: if token starts with "xi_", use API key path
            if (token.startsWith('xi_')) {
                await authenticateApiKey(token, request, reply);
                return;
            }

            // Otherwise verify as JWT
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
        }
    });

    async function authenticateApiKey(key: string, request: FastifyRequest, reply: FastifyReply) {
        const db = getDb();
        const keyHash = hashToken(key);

        // Find API key by hash
        const apiKey = await db.query.apiKeys.findFirst({
            where: eq(apiKeys.keyHash, keyHash),
        });

        if (!apiKey) {
            return reply.status(401).send({ success: false, error: { code: 'INVALID_API_KEY', message: 'Invalid API key' } });
        }

        // Check expiry (null = never expires)
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
            return reply.status(401).send({ success: false, error: { code: 'EXPIRED_API_KEY', message: 'API key has expired' } });
        }

        // Look up user
        const user = await db.query.users.findFirst({
            where: eq(users.id, apiKey.userId),
            columns: { id: true, email: true },
        });

        if (!user) {
            throw new Error('User not found for API key');
        }

        // Update last used (fire and forget — don't slow down request)
        db.update(apiKeys)
            .set({ lastUsed: new Date() })
            .where(eq(apiKeys.id, apiKey.id))
            .then(() => { });

        // Set user on request — same shape as JWT payload
        request.user = { sub: user.id, email: user.email };
    }
}

export default fp(jwtPlugin, { name: 'jwt-plugin' });
