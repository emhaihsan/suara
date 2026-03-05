import { randomBytes, createHash } from 'node:crypto';

/**
 * Generate a refresh token — 64 character hex string (32 bytes of randomness).
 */
export function generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
}

/**
 * Generate an API key with `xi_` prefix (like 11Labs).
 * Returns the full key and a short prefix for display.
 */
export function generateApiKey(): { key: string; prefix: string } {
    const raw = randomBytes(31).toString('hex'); // 62 hex characters
    const key = `xi_${raw}`;
    const prefix = key.slice(0, 8); // short prefix for display
    return { key, prefix };
}

/**
 * Hash a token using SHA-256.
 * We use SHA-256 instead of Argon2 because refresh tokens are already
 * random high-entropy strings — they don't need the slow, memory-hard
 * hashing that protects weak user passwords.
 */
export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
