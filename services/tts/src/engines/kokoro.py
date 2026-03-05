"""
Kokoro TTS Engine
Lazy-loads the Kokoro pipeline on first request, provides voice listing and audio generation.
"""
from __future__ import annotations

import io
import logging
import struct
import time
from dataclasses import dataclass

import numpy as np

from src.config import settings

logger = logging.getLogger(__name__)

# ─── Language Codes ────────────────────────────────────────────
LANGUAGE_CODES = {
    "en-us": "a",   # American English
    "en-gb": "b",   # British English
    "es": "e",      # Spanish
    "fr": "f",      # French
    "hi": "h",      # Hindi
    "it": "i",      # Italian
    "ja": "j",      # Japanese
    "ko": "k",      # Korean
    "pt": "p",      # Portuguese
    "zh": "z",      # Chinese
}

# ─── 24 Built-in Kokoro Voices ────────────────────────────────
VOICES: dict[str, dict] = {
    # American Female (af_)
    "af_alloy":   {"name": "Alloy",   "gender": "female", "language": "en-us", "accent": "American"},
    "af_aoede":   {"name": "Aoede",   "gender": "female", "language": "en-us", "accent": "American"},
    "af_bella":   {"name": "Bella",   "gender": "female", "language": "en-us", "accent": "American"},
    "af_heart":   {"name": "Heart",   "gender": "female", "language": "en-us", "accent": "American"},
    "af_jessica": {"name": "Jessica", "gender": "female", "language": "en-us", "accent": "American"},
    "af_kore":    {"name": "Kore",    "gender": "female", "language": "en-us", "accent": "American"},
    "af_nicole":  {"name": "Nicole",  "gender": "female", "language": "en-us", "accent": "American"},
    "af_nova":    {"name": "Nova",    "gender": "female", "language": "en-us", "accent": "American"},
    "af_river":   {"name": "River",   "gender": "female", "language": "en-us", "accent": "American"},
    "af_sarah":   {"name": "Sarah",   "gender": "female", "language": "en-us", "accent": "American"},
    "af_sky":     {"name": "Sky",     "gender": "female", "language": "en-us", "accent": "American"},
    # American Male (am_)
    "am_adam":    {"name": "Adam",    "gender": "male",   "language": "en-us", "accent": "American"},
    "am_echo":    {"name": "Echo",    "gender": "male",   "language": "en-us", "accent": "American"},
    "am_eric":    {"name": "Eric",    "gender": "male",   "language": "en-us", "accent": "American"},
    "am_liam":    {"name": "Liam",    "gender": "male",   "language": "en-us", "accent": "American"},
    "am_michael": {"name": "Michael", "gender": "male",   "language": "en-us", "accent": "American"},
    "am_onyx":    {"name": "Onyx",    "gender": "male",   "language": "en-us", "accent": "American"},
    # British Female (bf_)
    "bf_alice":   {"name": "Alice",   "gender": "female", "language": "en-gb", "accent": "British"},
    "bf_emma":    {"name": "Emma",    "gender": "female", "language": "en-gb", "accent": "British"},
    "bf_lily":    {"name": "Lily",    "gender": "female", "language": "en-gb", "accent": "British"},
    # British Male (bm_)
    "bm_daniel":  {"name": "Daniel",  "gender": "male",   "language": "en-gb", "accent": "British"},
    "bm_fable":   {"name": "Fable",   "gender": "male",   "language": "en-gb", "accent": "British"},
    "bm_george":  {"name": "George",  "gender": "male",   "language": "en-gb", "accent": "British"},
    "bm_lewis":   {"name": "Lewis",   "gender": "male",   "language": "en-gb", "accent": "British"},
}

# ─── Singleton Pipeline ───────────────────────────────────────
_pipeline = None


@dataclass
class SynthesisResult:
    """Result from the TTS synthesis operation."""
    audio_bytes: bytes
    duration_ms: float
    sample_rate: int
    voice_id: str
    content_type: str


def get_pipeline(language_code: str = "a"):
    """Lazy-load the Kokoro pipeline. Downloads model on first use (~80MB), then cached."""
    global _pipeline

    if _pipeline is not None:
        return _pipeline

    logger.info(f"Loading Kokoro pipeline (language={language_code})...")
    start = time.monotonic()

    from kokoro import KPipeline
    _pipeline = KPipeline(lang_code=language_code)

    elapsed = time.monotonic() - start
    logger.info(f"Pipeline loaded in {elapsed:.2f}s")

    return _pipeline


def get_voices() -> list[dict]:
    """Return list of available voices with metadata."""
    result = []
    for voice_id, metadata in VOICES.items():
        result.append({"voice_id": voice_id, **metadata})
    return result


def np_to_wav(audio: np.ndarray, sample_rate: int) -> bytes:
    """Convert float32 numpy array to WAV bytes."""
    # Ensure float32 range [-1.0, 1.0] → int16
    audio_int16 = (audio * 32767).astype(np.int16)
    pcm_data = audio_int16.tobytes()
    data_size = len(pcm_data)

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_size,
        b"WAVE",
        b"fmt ",
        16,          # chunk size
        1,           # PCM format
        1,           # mono
        sample_rate,
        sample_rate * 2,  # byte rate
        2,           # block align
        16,          # bits per sample
        b"data",
        data_size,
    )

    return header + pcm_data


def wav_to_mp3(wav_bytes: bytes) -> bytes:
    """Convert WAV bytes to MP3 using pydub + ffmpeg."""
    from pydub import AudioSegment
    wav_io = io.BytesIO(wav_bytes)
    audio = AudioSegment.from_wav(wav_io)
    mp3_io = io.BytesIO()
    audio.export(mp3_io, format="mp3")
    return mp3_io.getvalue()


def synthesize(
    text: str,
    voice_id: str | None = None,
    language: str | None = None,
    output_format: str = "wav",
    speed: float = 1.0,
) -> SynthesisResult:
    """Synthesize text to speech using Kokoro."""
    voice_id = voice_id or settings.default_voice
    language_code = LANGUAGE_CODES.get(language or "", settings.default_language)

    pipeline = get_pipeline(language_code)

    logger.info(f"Synthesizing: voice={voice_id}, lang={language_code}, format={output_format}, text='{text[:50]}...'")
    start = time.monotonic()

    # Generate audio
    segments = list(pipeline(text, voice=voice_id, speed=speed))
    if not segments:
        raise ValueError(f"Kokoro produced no output for voice={voice_id}")

    # Concatenate all audio segments
    audio = np.concatenate([seg.audio for seg in segments])

    elapsed = time.monotonic() - start
    sample_rate = settings.sample_rate
    duration_ms = (len(audio) / sample_rate) * 1000

    logger.info(f"Synthesis completed: {elapsed:.2f}s, duration={duration_ms:.0f}ms, speed={speed}")

    # Convert to WAV
    wav_bytes = np_to_wav(audio, sample_rate)

    # Convert to MP3 if requested
    if output_format == "mp3":
        audio_bytes = wav_to_mp3(wav_bytes)
        content_type = "audio/mpeg"
    else:
        audio_bytes = wav_bytes
        content_type = "audio/wav"

    return SynthesisResult(
        audio_bytes=audio_bytes,
        duration_ms=duration_ms,
        sample_rate=sample_rate,
        voice_id=voice_id,
        content_type=content_type,
    )
