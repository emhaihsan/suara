FROM python:3.11-slim

# System dependencies: ffmpeg (for MP3 conversion), espeak-ng (for TTS)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    espeak-ng \
    ffmpeg \
    libsndfile1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Models are downloaded on first run and cached via volume mount
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/app/models

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
