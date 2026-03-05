import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import jwtPlugin from './plugins/jwt.js';
import voiceRoutes from './routes/voices.js';
import libraryRoutes from './routes/library.js';
import sampleRoutes from './routes/samples.js';

const PORT = Number(process.env.VOICE_SERVICE_PORT) || 3003;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
    const app = Fastify({ logger: { level: 'info' } });

    // Plugins
    await app.register(cors, {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
    });
    await app.register(multipart, {
        limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    });
    await app.register(jwtPlugin);

    // Health check
    app.get('/health', async () => ({ status: 'ok', service: 'voice' }));

    // Routes
    await app.register(voiceRoutes, { prefix: '/voices' });
    await app.register(libraryRoutes, { prefix: '/library' });
    await app.register(sampleRoutes, { prefix: '/voices/:voiceId/samples' });

    // Start
    await app.listen({ port: PORT, host: HOST });
}

main().catch((err) => {
    console.error('Voice service failed to start:', err);
    process.exit(1);
});
