import amqp, { Channel, Connection } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

export class RabbitMQService {
    private static connection: Connection;
    private static channel: Channel;
    private static readonly QUEUE_NAME = 'voice_generation_jobs';

    static async init() {
        try {
            this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(this.QUEUE_NAME, { durable: true });
            console.log('RabbitMQ initialized and queue asserted');
        } catch (error) {
            console.error('Failed to initialize RabbitMQ:', error);
            throw error;
        }
    }

    static async publishJob(jobData: any) {
        if (!this.channel) await this.init();

        this.channel.sendToQueue(
            this.QUEUE_NAME,
            Buffer.from(JSON.stringify(jobData)),
            { persistent: true }
        );
    }
}
