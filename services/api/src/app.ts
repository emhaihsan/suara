import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { voiceRoutes } from './routes/voice.routes';
import { authRoutes } from './routes/auth.routes';

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = fastify({
    logger: true,
  });

  // Register plugins
  await app.register(cors, {
    origin: '*', // Adjust for production
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'OK', service: 'suara-api' };
  });

  // Register routes
  await app.register(voiceRoutes, { prefix: '/api/v1/voice' });
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  return app;
};
