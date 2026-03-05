import { createHash } from 'node:crypto';

/**
 * Hash a token using SHA-256 — for API key verification.
 */
export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
