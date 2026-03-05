import 'reflect-metadata';
import dotenv from 'dotenv';
import { buildApp } from './app';
import { AppDataSource } from './config/database';
import { RabbitMQService } from './services/rabbitmq.service';
import { initMinio } from './services/minio.service';

dotenv.config();

const start = async () => {
    try {
        // Initialize Database
        await AppDataSource.initialize();
        console.log('Data Source has been initialized!');

        // Initialize RabbitMQ
        await RabbitMQService.init();

        // Initialize MinIO
        await initMinio();

        const app = await buildApp();
        const port = Number(process.env.PORT) || 3001;

        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on port ${port}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
