import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { getDatabase, apiKeys } from '@suara/db';
import { generateApiKey, hashToken } from '../lib/crypto.js';

// ─── Schemas ──────────────────────────────────────────────────

const createApiKeySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    expiresAt: z.string().datetime().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────

function getDb() {
    return getDatabase(process.env.DATABASE_URL!);
}

// ─── Routes ───────────────────────────────────────────────────

export default async function apiKeyRoutes(app: FastifyInstance) {
    // All routes in this plugin require authentication (JWT or API key)
    app.addHook('onRequest', app.authenticate);

    // ── POST /api-keys — Create new API key ───────────────────
    app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const result = createApiKeySchema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.flatten().fieldErrors },
            });
        }

        const { name, expiresAt } = result.data;
        const db = getDb();

        // Generate key with xi_ prefix
        const { key, prefix } = generateApiKey();
        const keyHash = hashToken(key);

        // Insert into database
        const [created] = await db
            .insert(apiKeys)
            .values({
                userId: request.user.sub,
                name,
                prefix,
                keyHash,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            })
            .returning({
                id: apiKeys.id,
                name: apiKeys.name,
                prefix: apiKeys.prefix,
                expiresAt: apiKeys.expiresAt,
                createdAt: apiKeys.createdAt,
            });

        // Return the full key ONLY ONCE — cannot be retrieved later
        return reply.status(201).send({
            success: true,
            data: { ...created, key },
        });
    });

    // ── GET /api-keys — List user's API keys ──────────────────
    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const db = getDb();

        const keys = await db
            .select({
                id: apiKeys.id,
                name: apiKeys.name,
                prefix: apiKeys.prefix,
                lastUsed: apiKeys.lastUsed,
                expiresAt: apiKeys.expiresAt,
                createdAt: apiKeys.createdAt,
            })
            .from(apiKeys)
            .where(eq(apiKeys.userId, request.user.sub));

        return reply.status(200).send({ success: true, data: { keys } });
    });

    // ── DELETE /api-keys/:id — Revoke an API key ──────────────
    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const db = getDb();

        // Users can only delete their own API keys
        const deleted = await db
            .delete(apiKeys)
            .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, request.user.sub)))
            .returning({ id: apiKeys.id });

        if (deleted.length === 0) {
            return reply.status(404).send({
                success: false,
                error: { code: 'NOT_FOUND', message: 'API key not found' },
            });
        }

        return reply.status(200).send({ success: true, data: { message: 'API key revoked', id } });
    });
}
