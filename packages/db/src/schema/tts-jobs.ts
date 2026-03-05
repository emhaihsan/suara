import { pgTable, pgEnum, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { voices } from './voices';

export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed']);
export const jobTypeEnum = pgEnum('job_type', ['tts', 'clone']);

export const ttsJobs = pgTable('tts_jobs', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),
    voiceId: uuid('voice_id')
        .references(() => voices.id, { onDelete: 'set null' }),
    type: jobTypeEnum('type').default('tts').notNull(),
    status: jobStatusEnum('status').default('pending').notNull(),
    inputText: text('input_text').notNull(),
    outputFileId: uuid('output_file_id'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
