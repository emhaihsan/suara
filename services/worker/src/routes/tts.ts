import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, or, desc } from 'drizzle-orm';
import { getDatabase, voices, ttsJobs, audioFiles } from '@suara/db';
import { publishJob } from '../lib/queue.js';
import { getPresignedUrl } from '../lib/storage.js';

// ─── Schemas ──────────────────────────────────────────────────

const createJobSchema = z.object({
    voiceId: z.string().uuid(),
    text: z.string().min(1, 'Text is required'),
    outputFormat: z.enum(['wav', 'mp3']).default('wav'),
});

// ─── Helpers ──────────────────────────────────────────────────

function getDb() {
    return getDatabase(process.env.DATABASE_URL!);
}

// ─── Routes ───────────────────────────────────────────────────

export default async function ttsRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook('onRequest', app.authenticate);

    // ── POST / — Submit TTS job ───────────────────────────────
    app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const result = createJobSchema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.flatten().fieldErrors },
            });
        }

        const { voiceId, text, outputFormat } = result.data;
        const db = getDb();

        // Verify voice exists AND is accessible (public OR owned by user)
        const voice = await db.query.voices.findFirst({
            where: or(
                and(eq(voices.id, voiceId), eq(voices.isPublic, true)),
                and(eq(voices.id, voiceId), eq(voices.userId, request.user.sub)),
            ),
        });

        if (!voice) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Voice not found or not accessible' } });
        }

        // Create job record with status "pending"
        const [job] = await db
            .insert(ttsJobs)
            .values({
                userId: request.user.sub,
                voiceId,
                type: 'tts',
                status: 'pending',
                inputText: text,
                metadata: { outputFormat },
            })
            .returning({
                id: ttsJobs.id,
                status: ttsJobs.status,
                type: ttsJobs.type,
                inputText: ttsJobs.inputText,
                createdAt: ttsJobs.createdAt,
            });

        // Publish to RabbitMQ
        await publishJob({ jobId: job.id, voiceId, text, outputFormat });

        // Return 202 Accepted — user doesn't have to wait
        return reply.status(202).send({ success: true, data: { job } });
    });

    // ── GET /:id — Check job status ───────────────────────────
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const db = getDb();

        const job = await db.query.ttsJobs.findFirst({
            where: and(eq(ttsJobs.id, id), eq(ttsJobs.userId, request.user.sub)),
        });

        if (!job) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } });
        }

        // If completed and has output file, include download URL
        let downloadUrl: string | undefined;
        if (job.status === 'completed' && job.outputFileId) {
            const audioFile = await db.query.audioFiles.findFirst({
                where: eq(audioFiles.id, job.outputFileId),
            });

            if (audioFile) {
                downloadUrl = await getPresignedUrl(audioFile.storagePath);
            }
        }

        return reply.status(200).send({
            success: true,
            data: { job, downloadUrl },
        });
    });

    // ── GET / — List user's jobs ──────────────────────────────
    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const query = request.query as { page?: string; limit?: string };
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
        const offset = (page - 1) * limit;

        const db = getDb();

        const jobs = await db
            .select({
                id: ttsJobs.id,
                status: ttsJobs.status,
                type: ttsJobs.type,
                inputText: ttsJobs.inputText,
                createdAt: ttsJobs.createdAt,
                updatedAt: ttsJobs.updatedAt,
            })
            .from(ttsJobs)
            .where(eq(ttsJobs.userId, request.user.sub))
            .orderBy(desc(ttsJobs.createdAt))
            .limit(limit)
            .offset(offset);

        return reply.status(200).send({ success: true, data: { jobs } });
    });
}
