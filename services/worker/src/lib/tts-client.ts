/**
 * TTS Service Client
 * Calls the Python FastAPI TTS service with retry logic.
 * The synthesis endpoint returns raw audio bytes with metadata in response headers.
 */

// ─── Types ────────────────────────────────────────────────────

export interface SynthesisInput {
    text: string;
    voiceId: string;
    language: string;
    outputFormat: string;
    speed?: number;
}

export interface SynthesisResult {
    audioBuffer: Buffer;
    durationMs: number;
    sampleRate: number;
    engine: string;
    voiceId: string;
    contentType: string;
}

// ─── Error ────────────────────────────────────────────────────

export class TTSServiceError extends Error {
    statusCode: number;
    retriable: boolean;

    constructor(message: string, statusCode: number, retriable: boolean) {
        super(message);
        this.name = 'TTSServiceError';
        this.statusCode = statusCode;
        this.retriable = retriable;
    }
}

// ─── Config ───────────────────────────────────────────────────

const BASE_URL = process.env.TTS_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = Number(process.env.TTS_TIMEOUT_MS) || 60000;
const MAX_RETRIES = Number(process.env.TTS_MAX_RETRIES) || 2;

// ─── Helpers ──────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseHeaderNumber(headers: Headers, name: string): number | null {
    const value = headers.get(name);
    if (!value) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
}

function parseErrorMessage(text: string): string {
    try {
        const json = JSON.parse(text);
        return json.detail || json.message || text;
    } catch {
        return text;
    }
}

// ─── Client ───────────────────────────────────────────────────

/**
 * Call the TTS service to synthesize text to audio.
 * Retries up to MAX_RETRIES times with exponential backoff on retriable errors.
 */
export async function synthesizeToSpeech(input: SynthesisInput): Promise<SynthesisResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(`${BASE_URL}/v1/synthesis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: input.text,
                    voice_id: input.voiceId,
                    language: input.language,
                    output_format: input.outputFormat,
                    speed: input.speed ?? 1.0,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                const message = parseErrorMessage(errorText);
                const retriable = response.status >= 500;
                throw new TTSServiceError(message, response.status, retriable);
            }

            const buffer = Buffer.from(await response.arrayBuffer());

            return {
                audioBuffer: buffer,
                durationMs: parseHeaderNumber(response.headers, 'x-duration-ms') ?? 0,
                sampleRate: parseHeaderNumber(response.headers, 'x-sample-rate') ?? 24000,
                engine: response.headers.get('x-engine') ?? 'kokoro',
                voiceId: response.headers.get('x-voice-id') ?? input.voiceId,
                contentType: response.headers.get('content-type') ?? 'audio/wav',
            };
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                lastError = new TTSServiceError('TTS service timeout', 408, true);
            } else if (err instanceof TTSServiceError) {
                if (!err.retriable || attempt >= MAX_RETRIES) {
                    throw err;
                }
                lastError = err;
            } else {
                lastError = err instanceof Error ? err : new Error(String(err));
            }
        } finally {
            clearTimeout(timeout);
        }

        // Exponential backoff before retry
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`⏳ TTS retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms...`);
        await sleep(delay);
    }

    throw lastError || new Error('TTS synthesis failed after retries');
}
