import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { getDatabase, voices, voiceSamples } from '@suara/db';
import { uploadFile, deleteFile, getPresignedUrl } from '../lib/storage.js';

// ─── Constants ────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
    'audio/mpeg',     // MP3
    'audio/wav',      // WAV
    'audio/ogg',      // OGG
    'audio/flac',     // FLAC
    'audio/x-m4a',    // M4A
    'audio/webm',     // WebM
];

// ─── Helpers ──────────────────────────────────────────────────

function getDb() {
    return getDatabase(process.env.DATABASE_URL!);
}

async function verifyOwnership(voiceId: string, userId: string) {
    const db = getDb();
    return db.query.voices.findFirst({
        where: and(eq(voices.id, voiceId), eq(voices.userId, userId)),
    });
}

// ─── Routes ───────────────────────────────────────────────────

export default async function sampleRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook('onRequest', app.authenticate);

    // ── POST /voices/:voiceId/samples — Upload voice sample ───
    app.post('/', async (request: FastifyRequest<{ Params: { voiceId: string } }>, reply: FastifyReply) => {
        const { voiceId } = request.params;

        // 1. Verify voice ownership
        const voice = await verifyOwnership(voiceId, request.user.sub);
        if (!voice) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Voice not found' } });
        }

        // 2. Get the uploaded file
        const file = await request.file();
        if (!file) {
            return reply.status(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'No file uploaded' } });
        }

        // 3. Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return reply.status(400).send({
                success: false,
                error: { code: 'BAD_REQUEST', message: `File type not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}` },
            });
        }

        // 4. Read file into buffer
        const buffer = await file.toBuffer();

        // 5. Upload to MinIO
        const storagePath = `voices/${voiceId}/${randomUUID()}/${file.filename}`;
        await uploadFile(storagePath, buffer, file.mimetype);

        // 6. Save metadata to database
        const db = getDb();
        const [sample] = await db
            .insert(voiceSamples)
            .values({
                voiceId,
                fileName: file.filename,
                mimeType: file.mimetype,
                sizeBytes: buffer.length,
                storagePath,
            })
            .returning();

        return reply.status(201).send({ success: true, data: { sample } });
    });

    // ── GET /voices/:voiceId/samples — List samples ──────────
    app.get('/', async (request: FastifyRequest<{ Params: { voiceId: string } }>, reply: FastifyReply) => {
        const { voiceId } = request.params;

        const voice = await verifyOwnership(voiceId, request.user.sub);
        if (!voice) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Voice not found' } });
        }

        const db = getDb();
        const samples = await db.query.voiceSamples.findMany({
            where: eq(voiceSamples.voiceId, voiceId),
        });

        return reply.status(200).send({ success: true, data: { samples } });
    });

    // ── GET /voices/:voiceId/samples/:sampleId — Get sample + download URL ─
    app.get('/:sampleId', async (request: FastifyRequest<{ Params: { voiceId: string; sampleId: string } }>, reply: FastifyReply) => {
        const { voiceId, sampleId } = request.params;

        const voice = await verifyOwnership(voiceId, request.user.sub);
        if (!voice) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Voice not found' } });
        }

        const db = getDb();
        const sample = await db.query.voiceSamples.findFirst({
            where: and(eq(voiceSamples.id, sampleId), eq(voiceSamples.voiceId, voiceId)),
        });

        if (!sample) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Sample not found' } });
        }

        // Generate presigned download URL (valid 1 hour)
        const downloadUrl = await getPresignedUrl(sample.storagePath);

        return reply.status(200).send({ success: true, data: { sample, downloadUrl } });
    });

    // ── DELETE /voices/:voiceId/samples/:sampleId — Delete sample ─
    app.delete('/:sampleId', async (request: FastifyRequest<{ Params: { voiceId: string; sampleId: string } }>, reply: FastifyReply) => {
        const { voiceId, sampleId } = request.params;

        const voice = await verifyOwnership(voiceId, request.user.sub);
        if (!voice) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Voice not found' } });
        }

        const db = getDb();
        const sample = await db.query.voiceSamples.findFirst({
            where: and(eq(voiceSamples.id, sampleId), eq(voiceSamples.voiceId, voiceId)),
        });

        if (!sample) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Sample not found' } });
        }

        // Delete from MinIO first, then database
        await deleteFile(sample.storagePath);
        await db.delete(voiceSamples).where(eq(voiceSamples.id, sampleId));

        return reply.status(200).send({ success: true, data: { message: 'Sample deleted', id: sampleId } });
    });
}
