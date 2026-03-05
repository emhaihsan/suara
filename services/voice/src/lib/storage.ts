import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * S3/MinIO client — the ONLY file in the app that knows about object storage.
 * Everything else calls uploadFile, deleteFile, getPresignedUrl.
 */
const s3 = new S3Client({
    endpoint: `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true, // Critical for MinIO — AWS uses virtual-hosted URLs, MinIO uses path-style
});

const BUCKET = process.env.MINIO_BUCKET || 'suara-voices';

/**
 * Upload a file buffer to MinIO.
 */
export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<void> {
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
}

/**
 * Delete a file from MinIO.
 * Call this BEFORE deleting the database record.
 */
export async function deleteFile(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Generate a temporary pre-signed download URL (valid for 1 hour).
 * Clients download directly from MinIO without needing authentication.
 */
export async function getPresignedUrl(key: string): Promise<string> {
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
}
