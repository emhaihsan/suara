# Suara: AI Text-to-Speech Platform

Suara (Suara means "Voice" in Indonesian) is a text-to-speech platform similar to Eleven Labs, where users can generate human-like voices using AI models. The platform is designed to be fast, cost-effecient, and scalable, using a microservices architecture.

## Key Features
- **Self-Hosted AI Models**: Suara uses self-hosted AI models, specifically the **Kokoro** TTS model, which is an open-weight model with 82 million parameters.
- **High Performance**: Despite its lightweight architecture, Kokoro delivers quality comparable to larger models while being significantly faster and more cost-efficient.
- **Microservices Architecture**: The system is built as a set of decoupled services for flexibility and scalability.
- **Async Job Processing**: High-latency tasks like voice generation are handled asynchronously using job queues.

## Technology Stack
- **Frontend**: Next.js, Shadcn UI, Framer Motion.
- **Backend Services**: Node.js (Fastify) and Python (FastAPI).
- **Database**: PostgreSQL with TypeORM.
- **Async Queue**: RabbitMQ.
- **Cloud Storage**: MinIO (S3 compatible).
- **API Gateway**: Traefik.
- **AI Model**: Kokoro TTS (82M parameters).
