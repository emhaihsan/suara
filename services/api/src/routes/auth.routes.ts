import { FastifyInstance } from 'fastify';

export const authRoutes = async (app: FastifyInstance) => {
    app.post('/login', async () => {
        return { token: 'dummy-token' };
    });

    app.post('/register', async () => {
        return { message: 'User registered' };
    });
};
