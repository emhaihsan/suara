import { FastifyInstance } from 'fastify';
import { AppDataSource } from '../config/database';
import { VoiceJob } from '../entities/VoiceJob.entity';
import { RabbitMQService } from '../services/rabbitmq.service';

export const voiceRoutes = async (app: FastifyInstance) => {
    app.get('/', async () => {
        return { message: 'Voice API root' };
    });

    app.post('/generate', async (request, reply) => {
        const { text, voiceId, userId } = request.body as any;

        if (!text || !voiceId || !userId) {
            return reply.code(400).send({ error: 'Missing required fields' });
        }

        const voiceJobRepository = AppDataSource.getRepository(VoiceJob);

        // Create job in DB
        const job = voiceJobRepository.create({
            text,
            voiceId,
            userId,
            status: 'PENDING',
        });

        await voiceJobRepository.save(job);

        // Publish to RabbitMQ
        await RabbitMQService.publishJob({
            jobId: job.id,
            text,
            voiceId,
        });

        return { message: 'Job queued', jobId: job.id };
    });

    app.get('/status/:jobId', async (request, reply) => {
        const { jobId } = request.params as any;
        const voiceJobRepository = AppDataSource.getRepository(VoiceJob);
        const job = await voiceJobRepository.findOneBy({ id: jobId });

        if (!job) {
            return reply.code(404).send({ error: 'Job not found' });
        }

        return job;
    });
};
