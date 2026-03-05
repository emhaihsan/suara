import { pgTable, uuid, varchar, integer, real, text, timestamp } from 'drizzle-orm/pg-core';
import { ttsJobs } from './tts-jobs';

export const audioFiles = pgTable('audio_files', {
    id: uuid('id').defaultRandom().primaryKey(),
    jobId: uuid('job_id')
        .references(() => ttsJobs.id, { onDelete: 'cascade' })
        .notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).default('audio/wav').notNull(),
    sizeBytes: integer('size_bytes'),
    duration: real('duration'),
    storagePath: text('storage_path').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
