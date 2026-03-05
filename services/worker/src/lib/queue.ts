import amqplib from 'amqplib';

const TTS_QUEUE = 'tts_jobs';

let connection: Awaited<ReturnType<typeof amqplib.connect>> | null = null;
let channel: Awaited<ReturnType<Awaited<ReturnType<typeof amqplib.connect>>['createChannel']>> | null = null;

/**
 * Get or create a RabbitMQ channel.
 * - Queue is durable (survives RabbitMQ restarts)
 * - Prefetch 1 (process one job at a time)
 */
async function getChannel() {
    if (channel) return channel;

    const url = process.env.RABBITMQ_URL || 'amqp://suara:suarapass@localhost:5672';
    connection = await amqplib.connect(url);
    channel = await connection.createChannel();

    // Assert queue: durable = survives restarts, messages persistent = written to disk
    await channel.assertQueue(TTS_QUEUE, { durable: true });

    // Process one job at a time — if busy, new messages wait in queue
    await channel.prefetch(1);

    return channel;
}

/**
 * Publish a job message to the TTS queue.
 */
export async function publishJob(message: Record<string, unknown>): Promise<void> {
    const ch = await getChannel();
    ch.sendToQueue(TTS_QUEUE, Buffer.from(JSON.stringify(message)), { persistent: true });
}

/**
 * Start consuming jobs from the queue.
 * Handler receives parsed message data.
 */
export async function consumeJobs(handler: (msg: Record<string, unknown>) => Promise<void>): Promise<void> {
    const ch = await getChannel();

    await ch.consume(TTS_QUEUE, async (msg) => {
        if (!msg) return;

        try {
            const data = JSON.parse(msg.content.toString());
            await handler(data);
            ch.ack(msg);
        } catch (err) {
            // Nack without requeue — failed jobs are discarded from queue
            // (error is already saved in database by processor)
            ch.nack(msg, false, false);
            console.error('Job processing failed:', err);
        }
    });

    console.log(`🐇 Queue consuming from "${TTS_QUEUE}"`);
}

/**
 * Gracefully close the queue connection.
 */
export async function closeQueue(): Promise<void> {
    if (channel) await channel.close();
    if (connection) await connection.close();
}
