import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { getDatabase, voices } from '@suara/db';

// ─── Schemas ──────────────────────────────────────────────────

const createVoiceSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    category: z.enum(['cloned', 'custom']), // no 'premade' — those are seeded by us
    language: z.string().default('en-us'),
    gender: z.enum(['male', 'female', 'neutral']).default('neutral'),
    description: z.string().optional(),
    accent: z.string().optional(),
    isPublic: z.boolean().default(true),
    metadata: z.any().optional(),
});

const updateVoiceSchema = z.object({
    name: z.string().min(1).optional(),
    language: z.string().optional(),
    gender: z.enum(['male', 'female', 'neutral']).optional(),
    description: z.string().optional(),
    accent: z.string().optional(),
    isPublic: z.boolean().optional(),
    metadata: z.any().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────

function getDb() {
    return getDatabase(process.env.DATABASE_URL!);
}

// ─── Routes ───────────────────────────────────────────────────

export default async function voiceRoutes(app: FastifyInstance) {
    // All routes protected — supports JWT + API key
    app.addHook('onRequest', app.authenticate);

    // ── POST / — Create new voice ─────────────────────────────
    app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const result = createVoiceSchema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.flatten().fieldErrors },
            });
        }

        const db = getDb();

        const [voice] = await db
            .insert(voices)
            .values({ ...result.data, userId: request.user.sub })
            .returning();

        return reply.status(201).send({ success: true, data: { voice } });
    });

    // ── GET / — List user's own voices ────────────────────────
    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const db = getDb();

        const userVoices = await db.query.voices.findMany({
            where: eq(voices.userId, request.user.sub),
            orderBy: [desc(voices.createdAt)],
        });

        return reply.status(200).send({ success: true, data: { voices: userVoices } });
    });

    // ── GET /:id — Get single voice (owner only) ─────────────
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const db = getDb();

        const voice = await db.query.voices.findFirst({
            where: and(eq(voices.id, id), eq(voices.userId, request.user.sub)),
        });

        if (!voice) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Voice not found' } });
        }

        return reply.status(200).send({ success: true, data: { voice } });
    });

    // ── PATCH /:id — Update voice (owner only) ────────────────
    app.patch('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const result = updateVoiceSchema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.flatten().fieldErrors },
            });
        }

        const db = getDb();

        // Verify ownership
        const existing = await db.query.voices.findFirst({
            where: and(eq(voices.id, id), eq(voices.userId, request.user.sub)),
        });

        if (!existing) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Voice not found' } });
        }

        const [updated] = await db
            .update(voices)
            .set({ ...result.data, updatedAt: new Date() })
            .where(eq(voices.id, id))
            .returning();

        return reply.status(200).send({ success: true, data: { voice: updated } });
    });

    // ── DELETE /:id — Delete voice (owner only) ───────────────
    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const db = getDb();

        const deleted = await db
            .delete(voices)
            .where(and(eq(voices.id, id), eq(voices.userId, request.user.sub)))
            .returning({ id: voices.id });

        if (deleted.length === 0) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Voice not found' } });
        }

        return reply.status(200).send({ success: true, data: { message: 'Voice deleted', id } });
    });
}
