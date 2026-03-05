import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDatabase, ttsJobs, audioFiles } from '@suara/db';
import { uploadFile } from './storage.js';

// ─── Types ────────────────────────────────────────────────────

export interface JobMessage {
    jobId: string;
    voiceId: string;
    text: string;
    outputFormat: string;
}

// ─── Mock TTS ─────────────────────────────────────────────────

/**
 * Generate a minimal valid WAV file (1 second of silence).
 * This is a placeholder — will be replaced with actual TTS engine later.
 */
function generateSilentWav(): Buffer {
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const numSamples = sampleRate; // 1 second
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    // Remaining bytes are 0 (silence)

    return buffer;
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
 * 2. Generate audio (mock for now)
 * 3. Upload to MinIO
 * 4. Create audio_files record
 * 5. Mark job as "completed"
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
        // Step 2: Generate audio (mock — 1 second silent WAV)
        const audioBuffer = generateSilentWav();

        // Step 3: Determine output format
        const mimeType = outputFormat === 'wav' ? 'audio/wav' : 'audio/mpeg';
        const extension = outputFormat === 'wav' ? 'wav' : 'mp3';
        const fileName = `tts_${jobId.slice(0, 8)}.${extension}`;
        const storagePath = `tts/${voiceId}/${randomUUID()}/${fileName}`;

        // Step 4: Upload to MinIO
        await uploadFile(storagePath, audioBuffer, mimeType);

        // Step 5: Create audio file record
        const [audioFile] = await db
            .insert(audioFiles)
            .values({
                jobId,
                fileName,
                mimeType,
                sizeBytes: audioBuffer.length,
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

        console.log(`✅ Job ${jobId} completed`);
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
