import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwtPlugin from './plugins/jwt.js';
import ttsRoutes from './routes/tts.js';
import { consumeJobs, closeQueue } from './lib/queue.js';
import { processJob } from './lib/processor.js';

const PORT = Number(process.env.WORKER_SERVICE_PORT) || 3004;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
    const app = Fastify({ logger: { level: 'info' } });

    // Plugins
    await app.register(cors, {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
    });
    await app.register(jwtPlugin);

    // Health check
    app.get('/health', async () => ({ status: 'ok', service: 'worker' }));

    // Routes
    await app.register(ttsRoutes, { prefix: '/tts' });

    // Start HTTP server
    await app.listen({ port: PORT, host: HOST });

    // Start RabbitMQ consumer (after HTTP server is up)
    await consumeJobs(processJob);

    // Graceful shutdown
    const shutdown = async () => {
        console.log('🛑 Shutting down worker...');
        await closeQueue();
        await app.close();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main().catch((err) => {
    console.error('Worker service failed to start:', err);
    process.exit(1);
});
