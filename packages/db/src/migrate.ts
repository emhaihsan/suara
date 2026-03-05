import { config } from 'dotenv';
import { resolve } from 'path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

config({ path: resolve(__dirname, '../../.env') });

async function runMigrations() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error('DATABASE_URL is required');
    }

    console.log('Running migrations...');

    const client = postgres(url, { max: 1 });
    const db = drizzle(client);

    await migrate(db, { migrationsFolder: resolve(__dirname, '../drizzle') });

    console.log('Migrations completed!');
    await client.end();
    process.exit(0);
}

runMigrations().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
