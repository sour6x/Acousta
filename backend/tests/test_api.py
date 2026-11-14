import io
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import app

client = TestClient(app)


def wav(seconds=3, silent=False, format="WAV", sr=22050):
    t = np.arange(sr * seconds) / sr
    audio = np.zeros_like(t) if silent else sum(np.sin(2 * np.pi * f * t) for f in (261.63, 329.63, 392.00)) / 4
    output = io.BytesIO()
    sf.write(output, audio, sr, format=format)
    return output.getvalue()


def test_health_and_invalid_uploads():
    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.post("/api/analyze", files={"file": ("bad.txt", b"x")}).status_code == 415
    assert client.post("/api/analyze", files={"file": ("bad.wav", b"")}).status_code == 400
    assert client.post("/api/analyze", files={"file": ("bad.wav", b"not audio")}).status_code == 422
    assert client.post("/api/analyze", files={"file": ("quiet.wav", wav(silent=True))}).status_code == 422


@pytest.mark.parametrize(("extension", "format"), [("wav", "WAV"), ("flac", "FLAC"), ("mp3", "MP3")])
def test_analyze_synthetic_chord(extension, format):
    response = client.post("/api/analyze", files={"file": (f"chord.{extension}", wav(format=format), "application/octet-stream")})
    assert response.status_code == 200, response.text
    result = response.json()
    assert 2.9 < result["durationSeconds"] < 3.1
    assert result["chords"] and result["chords"][0]["chord"] == "C"
    assert result["chords"][0]["time"] == 0
    assert result["limitations"]


@pytest.mark.parametrize("sample_rate", [44100, 48000])
def test_resampling_mp3(sample_rate):
    response = client.post("/api/analyze", files={"file": ("resampled.mp3", wav(format="MP3", sr=sample_rate), "audio/mpeg")})
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["chords"] and result["chords"][0]["chord"] == "C"
