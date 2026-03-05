import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

export function getDatabase(url: string): Database {
    const client = postgres(url);
    return drizzle(client, { schema });
}
