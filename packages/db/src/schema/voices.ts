import {
    pgTable,
    pgEnum,
    uuid,
    varchar,
    text,
    boolean,
    jsonb,
    timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const voiceCategoryEnum = pgEnum('voice_category', ['premade', 'cloned', 'custom']);
export const voiceGenderEnum = pgEnum('voice_gender', ['male', 'female', 'neutral']);

export const voices = pgTable('voices', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: voiceCategoryEnum('category').default('premade').notNull(),
    language: varchar('language', { length: 10 }).default('en-us').notNull(),
    gender: voiceGenderEnum('gender').default('neutral').notNull(),
    accent: varchar('accent', { length: 100 }),
    preview: text('preview'),
    isPublic: boolean('is_public').default(true).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
