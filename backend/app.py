import os
import tempfile
from pathlib import Path
from threading import BoundedSemaphore

import librosa
import numpy as np
import soundfile as sf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

MAX_BYTES = 25 * 1024 * 1024
MAX_SECONDS = 600
SLOTS = BoundedSemaphore(int(os.getenv("ANALYSIS_CONCURRENCY", "1")))
app = FastAPI(title="Fretwise analysis")
origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])
NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def analyze(path: str) -> dict:
    # Inspect the decoded format and duration before allocating the waveform.
    info = sf.info(path)
    if info.format not in {"WAV", "WAVEX", "FLAC", "MP3"}:
        raise ValueError("Unsupported audio format.")
    if not 0 < info.duration <= MAX_SECONDS or info.channels > 2 or info.samplerate > 192000:
        raise ValueError("Audio must be at most 10 minutes, mono or stereo, and 192 kHz or less.")
    audio, sr = librosa.load(path, sr=22050, mono=True, res_type="kaiser_fast")
    if len(audio) < sr or np.max(np.abs(audio)) < 1e-5:
        raise ValueError("Audio must contain at least one second of audible sound.")
    hop = 512
    harmonic = librosa.effects.harmonic(audio)
    chroma = librosa.feature.chroma_stft(y=harmonic, sr=sr, hop_length=hop)
    profile = chroma.mean(axis=1)
    scores = [(float(np.dot(profile, np.roll(template, root))), root, mode)
              for root in range(12) for mode, template in (("major", MAJOR), ("minor", MINOR))]
    _, root, mode = max(scores)
    tempo = float(np.asarray(librosa.feature.tempo(y=audio, sr=sr, hop_length=hop)).flat[0])
    if not np.isfinite(tempo) or tempo <= 0:
        tempo = None
    # Template matching only recognizes major/minor triads, not extensions or inversions.
    templates = []
    for i in range(12):
        for suffix, third in (("", 4), ("m", 3)):
            t = np.zeros(12)
            t[[i, (i + third) % 12, (i + 7) % 12]] = 1
            templates.append((f"{NOTES[i]}{suffix}", t / np.linalg.norm(t)))
    # Average 1-second windows to reduce frame-to-frame flicker.
    frames = max(1, round(sr / hop))
    events = []
    for start in range(0, chroma.shape[1], frames):
        segment = chroma[:, start:start + frames].mean(axis=1)
        if np.linalg.norm(segment) < 1e-6:
            continue
        label = max(templates, key=lambda item: float(np.dot(segment, item[1])))[0]
        if not events or events[-1]["chord"] != label:
            events.append({"id": f"detected-{start}", "time": round(start * hop / sr, 2), "chord": label})
    return {"durationSeconds": round(info.duration, 2), "key": f"{NOTES[root]} {mode}",
            "likelyScale": f"{NOTES[root]} {'major' if mode == 'major' else 'natural minor'}",
            "bpm": round(tempo, 1) if tempo else None, "chords": events,
            "limitations": ["Estimates can be wrong, especially with vocals, percussion, modulations, complex harmony or noisy recordings. Review and correct by ear.",
                            "Chords are limited to major and minor triads, estimated in roughly one-second windows; extensions, inversions and exact boundaries are not detected.",
                            "Tempo can be half or double the perceived beat; key and scale are global estimates, not a transcription of every note."]}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze_upload(file: UploadFile = File(...)):
    if Path(file.filename or "").suffix.lower() not in {".mp3", ".wav", ".flac"}:
        raise HTTPException(415, "Choose an MP3, WAV or FLAC file.")
    if not SLOTS.acquire(blocking=False):
        raise HTTPException(503, "Analysis is busy. Please try again shortly.")
    try:
        with tempfile.TemporaryDirectory(prefix="fretwise-") as directory:
            path = Path(directory) / "upload"
            size = 0
            with path.open("wb") as target:
                while chunk := await file.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_BYTES:
                        raise HTTPException(413, "File exceeds the 25 MB limit.")
                    target.write(chunk)
            if size == 0:
                raise HTTPException(400, "The file is empty.")
            try:
                return await run_in_threadpool(analyze, str(path))
            except (ValueError, RuntimeError, sf.LibsndfileError):
                raise HTTPException(422, "Could not analyze this audio. Check the format, duration (up to 10 minutes), and audio content.")
    finally:
        await file.close()
        SLOTS.release()
