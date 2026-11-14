# Fretwise

A Next.js guitar practice studio with a separate FastAPI audio analysis service. Playback and the waveform use the browser; analysis is an explicit action that sends the selected audio to the configured service. The service processes it in a temporary directory and deletes that directory after the request. Session edits are held in memory and disappear on refresh or song change.

## Local setup

Requirements: Node.js 20.9+ and npm, Python 3.11, and a modern browser with support for the chosen audio format. MP3 decoding depends on the libsndfile build; the pinned `soundfile` package normally provides a compatible library on supported platforms.

1. In `backend`, create and activate a Python virtual environment, then install dependencies:

   ```sh
   python -m venv .venv
   # Windows: .venv\Scripts\activate
   # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app:app --reload --port 8000
   ```

2. At the project root, copy `.env.example` to `.env.local`, then run:

   ```sh
   npm install
   npm run dev
   ```

3. Open http://localhost:3000, choose a file, and select **Analyze song**. The backend must be running. The demo and manual editor work without it. Loading an audio file alone does not send it to the service; clicking Analyze does. Analysis replaces the current chord list. Reanalysis also replaces manual edits.

The service accepts MP3, WAV and FLAC, up to 25 MiB and 10 minutes, mono or stereo, maximum 192 kHz. It checks the decoded audio, not just the filename. Invalid, silent, excessively long or unsupported files are rejected. Browser playback support varies, especially for FLAC.

## Analysis and practice

The backend uses librosa chroma features and key profiles for a global major/minor key estimate, beat tracking for tempo, and one-second chroma-template matching for major/minor triad changes. Natural minor is a likely scale inferred from a minor key, not a measurement of the notes used. These are heuristic estimates, not a trained AI or Chordino/Essentia model. Vocals, drums, overlapping instruments, modulations, nonstandard tuning and complex harmony can cause errors. Chord inversions, seventh chords, extensions and precise boundaries are not identified; tempo may be half or double the perceived beat. Correct labels and timestamps using **Edit chords**. The diagram library supports major/minor shapes and explicitly reports unsupported chord types. Time signature is not detected.

Playback controls include waveform seeking, speed and A/B looping. Selecting a chord seeks to its timestamp, and highlighting follows playback. Transposition changes displayed names, not audio pitch; capo calculates a relative shape for the chosen sounding chord. The fretboard is an independent scale explorer, initially rooted at the estimated key. Scale selection is manual. Manual edits and analysis results are not persistent.

## Configuration and deployment

Deploy the frontend on Vercel with this folder as the root and the standard Next.js build command. Set `NEXT_PUBLIC_ANALYSIS_API_URL` to the backend's public HTTPS origin (no `/api` suffix), then rebuild/redeploy the frontend. This variable is public and must not contain secrets. The backend must be hosted separately on a service that supports a long-running Docker container, such as Render or Fly.io; point it at `backend/Dockerfile`. Configure `CORS_ORIGINS` as a comma-separated list of exact allowed frontend origins, for example `https://example.vercel.app`, and set `ANALYSIS_CONCURRENCY` to a small positive integer appropriate to the host's memory. The image binds to the provider's `PORT`, defaulting to 8000. Check `/health` and perform a real upload through the deployed frontend after setting the origins and HTTPS URL. No account, deployment, hosting, or external API credentials are included.

For public operation, configure HTTPS, request-body limits at the proxy (25 MiB plus multipart overhead), rate limiting, request timeouts, resource limits and abuse controls with the host. Multipart parsing occurs before the application reads the file, so the application limit alone is not a complete denial-of-service defense. Concurrent analysis is bounded per process, not across replicas. Do not log audio or sensitive filenames. A production privacy policy, data retention practices, and rights to uploaded recordings are the operator's responsibility.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
cd backend
pip install -r requirements.txt -r tests/requirements.txt
python -m pytest tests
```

For an end-to-end smoke test, start both services, upload a short licensed WAV, press Analyze, confirm results and limitations, seek/play through changes, edit a chord, and check transposition and capo. Repeat with supported MP3 and FLAC files and test a rejected file. The automated synthetic audio test checks the response contract and a simple triad, not general recognition accuracy. No deployment or recognition accuracy benchmark is implied by these instructions.
