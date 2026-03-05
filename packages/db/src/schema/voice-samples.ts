import { pgTable, uuid, varchar, integer, real, text, timestamp } from 'drizzle-orm/pg-core';
import { voices } from './voices';

export const voiceSamples = pgTable('voice_samples', {
    id: uuid('id').defaultRandom().primaryKey(),
    voiceId: uuid('voice_id')
        .references(() => voices.id, { onDelete: 'cascade' })
        .notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    duration: real('duration'),
    storagePath: text('storage_path').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
