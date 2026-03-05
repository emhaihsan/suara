import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDatabase, ttsJobs, audioFiles, voices } from '@suara/db';
import { uploadFile } from './storage.js';
import { synthesizeToSpeech } from './tts-client.js';

// ─── Types ────────────────────────────────────────────────────

export interface JobMessage {
    jobId: string;
    voiceId: string;
    text: string;
    outputFormat: string;
}

// ─── Processor ────────────────────────────────────────────────

function getDb() {
    return getDatabase(process.env.DATABASE_URL!);
}

/**
 * Process a TTS job from the queue.
 *
 * Lifecycle: pending → processing → completed (or failed)
 *
 * 1. Mark job as "processing"
 * 2. Look up voice metadata to get Kokoro voice ID
 * 3. Call TTS service (Python FastAPI + Kokoro)
 * 4. Upload audio to MinIO
 * 5. Create audio_files record
 * 6. Mark job as "completed"
 *
 * If error → mark as "failed"
 */
export async function processJob(message: Record<string, unknown>): Promise<void> {
    const { jobId, voiceId, text, outputFormat } = message as unknown as JobMessage;
    const db = getDb();

    console.log(`🔄 Processing job ${jobId}...`);

    // Step 1: Mark as processing
    await db
        .update(ttsJobs)
        .set({ status: 'processing', updatedAt: new Date() })
        .where(eq(ttsJobs.id, jobId));

    try {
        // Step 2: Look up voice to get Kokoro voice ID from metadata
        const voice = await db.query.voices.findFirst({
            where: eq(voices.id, voiceId),
        });
        const kokoroVoiceId = (voice?.name as string) || 'af_heart';

        // Step 3: Call TTS service
        const result = await synthesizeToSpeech({
            text,
            voiceId: kokoroVoiceId,
            language: voice?.language || 'en-us',
            outputFormat,
        });

        // Step 4: Upload to MinIO
        const mimeType = result.contentType;
        const extension = outputFormat === 'wav' ? 'wav' : 'mp3';
        const fileName = `tts_${jobId.slice(0, 8)}.${extension}`;
        const storagePath = `tts/${voiceId}/${randomUUID()}/${fileName}`;

        await uploadFile(storagePath, result.audioBuffer, mimeType);

        // Step 5: Create audio file record
        const [audioFile] = await db
            .insert(audioFiles)
            .values({
                jobId,
                fileName,
                mimeType,
                sizeBytes: result.audioBuffer.length,
                duration: result.durationMs,
                storagePath,
            })
            .returning();

        // Step 6: Mark as completed
        await db
            .update(ttsJobs)
            .set({
                status: 'completed',
                outputFileId: audioFile.id,
                updatedAt: new Date(),
            })
            .where(eq(ttsJobs.id, jobId));

        console.log(`✅ Job ${jobId} completed (${result.durationMs.toFixed(0)}ms audio)`);
    } catch (err) {
        // Mark as failed
        await db
            .update(ttsJobs)
            .set({
                status: 'failed',
                metadata: { error: err instanceof Error ? err.message : 'Unknown error' },
                updatedAt: new Date(),
            })
            .where(eq(ttsJobs.id, jobId));

        console.error(`❌ Job ${jobId} failed:`, err);
        throw err;
    }
}
