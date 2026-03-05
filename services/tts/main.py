import pika
import json
import os
import threading
from fastapi import FastAPI
from processor import TTSProcessor
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
processor = None

def start_worker():
    global processor
    processor = TTSProcessor()
    
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=os.getenv('RABBITMQ_HOST', 'localhost')))
    channel = connection.channel()
    channel.queue_declare(queue='voice_generation_jobs', durable=True)

    def callback(ch, method, properties, body):
        data = json.loads(body)
        job_id = data['jobId']
        text = data['text']
        voice_id = data['voiceId']
        
        print(f"Processing job {job_id}...")
        try:
            audio_url = processor.process(job_id, text, voice_id)
            print(f"Job {job_id} complete: {audio_url}")
            # In a real app, we'd notify the API service back via another queue or webhook
        except Exception as e:
            print(f"Job {job_id} failed: {e}")
            
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='voice_generation_jobs', on_message_callback=callback)

    print('Worker started and waiting for jobs...')
    channel.start_consuming()

@app.on_event("startup")
def startup_event():
    # Start the RabbitMQ worker in a separate thread
    thread = threading.Thread(target=start_worker, daemon=True)
    thread.start()

@app.get("/health")
def health():
    return {"status": "OK", "service": "suara-tts"}
