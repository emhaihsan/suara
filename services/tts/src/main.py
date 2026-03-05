"""
FastAPI application — wraps the Kokoro TTS engine behind a simple HTTP API.
The worker service calls this to generate audio.
"""
import logging

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from src.config import settings
from src.engines.kokoro import synthesize, get_voices

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Suara TTS Service",
    version="1.0.0",
    description="Text-to-Speech synthesis powered by Kokoro",
)


class SynthesisRequest(BaseModel):
    text: str
    voice_id: str | None = None
    language: str | None = None
    output_format: str = "wav"
    speed: float = 1.0


@app.get("/health")
async def health():
    return {"status": "ok", "service": "tts", "engine": "kokoro"}


@app.get("/v1/voices")
async def list_voices():
    """List all available Kokoro voices."""
    return get_voices()


@app.post("/v1/synthesis")
async def synthesis(request: SynthesisRequest):
    """
    Text-to-speech using Kokoro.
    Returns raw audio bytes with metadata in response headers.
    """
    try:
        result = synthesize(
            text=request.text,
            voice_id=request.voice_id,
            language=request.language,
            output_format=request.output_format,
            speed=request.speed,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Synthesis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="TTS synthesis failed")

    return Response(
        content=result.audio_bytes,
        media_type=result.content_type,
        headers={
            "X-Duration-Ms": str(result.duration_ms),
            "X-Engine": "kokoro",
            "X-Voice-Id": result.voice_id,
            "X-Sample-Rate": str(result.sample_rate),
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)
