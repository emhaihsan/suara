import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, ilike, or, count, sql } from 'drizzle-orm';
import { getDatabase, voices } from '@suara/db';

// ─── Helpers ──────────────────────────────────────────────────

function getDb() {
    return getDatabase(process.env.DATABASE_URL!);
}

// ─── Routes ───────────────────────────────────────────────────

export default async function libraryRoutes(app: FastifyInstance) {
    // No authentication required — public endpoints

    // ── GET / — Browse public voice library ───────────────────
    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const query = request.query as {
            search?: string;
            language?: string;
            gender?: string;
            category?: string;
            page?: string;
            limit?: string;
        };

        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        const offset = (page - 1) * limit;

        const db = getDb();

        // Build filter conditions
        const conditions: ReturnType<typeof eq>[] = [eq(voices.isPublic, true)];

        if (query.search) {
            conditions.push(
                or(
                    ilike(voices.name, `%${query.search}%`),
                    ilike(voices.description, `%${query.search}%`),
                )!,
            );
        }

        if (query.language) {
            conditions.push(eq(voices.language, query.language));
        }

        if (query.gender && ['male', 'female', 'neutral'].includes(query.gender)) {
            conditions.push(eq(voices.gender, query.gender as 'male' | 'female' | 'neutral'));
        }

        if (query.category && ['premade', 'cloned', 'custom'].includes(query.category)) {
            conditions.push(eq(voices.category, query.category as 'premade' | 'cloned' | 'custom'));
        }

        const where = and(...conditions);

        // Run count + data queries in parallel for performance
        const [items, [totalResult]] = await Promise.all([
            db
                .select({
                    id: voices.id,
                    name: voices.name,
                    description: voices.description,
                    category: voices.category,
                    language: voices.language,
                    gender: voices.gender,
                    accent: voices.accent,
                    preview: voices.preview,
                    metadata: voices.metadata,
                    createdAt: voices.createdAt,
                })
                .from(voices)
                .where(where)
                .limit(limit)
                .offset(offset),
            db
                .select({ total: count() })
                .from(voices)
                .where(where),
        ]);

        const total = totalResult?.total ?? 0;

        return reply.status(200).send({
            success: true,
            data: {
                voices: items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    });

    // ── GET /:id — Get single public voice ────────────────────
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const db = getDb();

        const voice = await db.query.voices.findFirst({
            where: and(eq(voices.id, id), eq(voices.isPublic, true)),
            columns: {
                id: true,
                name: true,
                description: true,
                category: true,
                language: true,
                gender: true,
                accent: true,
                preview: true,
                metadata: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!voice) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Voice not found' } });
        }

        return reply.status(200).send({ success: true, data: { voice } });
    });
}
