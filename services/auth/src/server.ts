import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwtPlugin from './plugins/jwt.js';
import authRoutes from './routes/auth.js';
import apiKeyRoutes from './routes/api-keys.js';

const PORT = Number(process.env.AUTH_SERVICE_PORT) || 3002;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
    const app = Fastify({ logger: { level: 'info' } });

    // Plugins
    await app.register(cors, {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
    });
    await app.register(jwtPlugin);

    // Health check
    app.get('/health', async () => ({ status: 'ok', service: 'auth' }));

    // Routes
    await app.register(authRoutes, { prefix: '/auth' });
    await app.register(apiKeyRoutes, { prefix: '/api-keys' });

    // Start
    await app.listen({ port: PORT, host: HOST });
}

main().catch((err) => {
    console.error('Auth service failed to start:', err);
    process.exit(1);
});
