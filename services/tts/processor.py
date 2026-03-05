import soundfile as sf
import os
from minio import Minio
from model_loader import ModelLoader

class TTSProcessor:
    def __init__(self):
        self.model = ModelLoader.load()
        self.minio_client = Minio(
            os.getenv("MINIO_ENDPOINT", "localhost:9000"),
            access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
            secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
            secure=False
        )
        self.bucket_name = "suara-voices"

    def process(self, job_id, text, voice_id):
        # Generate audio
        samples, sample_rate = self.model.create(text, voice=voice_id, speed=1.0, lang="en-us")
        
        file_path = f"{job_id}.wav"
        sf.write(file_path, samples, sample_rate)
        
        # Upload to MinIO
        self.minio_client.fput_object(self.bucket_name, f"{job_id}.wav", file_path)
        
        # Cleanup local file
        os.remove(file_path)
        
        return f"http://{os.getenv('MINIO_ENDPOINT', 'localhost:9000')}/{self.bucket_name}/{job_id}.wav"
