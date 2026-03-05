import { createHash } from 'node:crypto';

/**
 * Hash a token using SHA-256 — for API key verification.
 * Each microservice has its own copy because services don't share code at runtime.
 */
export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
