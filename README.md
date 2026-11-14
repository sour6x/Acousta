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

The standalone service accepts MP3, WAV and FLAC, up to 25 MiB and 10 minutes, mono or stereo, maximum 192 kHz. The Vercel configuration limits analysis uploads to 4 MiB in the browser to stay below Vercel's 4.5 MB request limit; larger files can still be played and edited locally. It checks the decoded audio, not just the filename. Invalid, silent, excessively long or unsupported files are rejected. Browser playback support varies, especially for FLAC.

## Analysis and practice

The backend uses librosa chroma features and key profiles for a global major/minor key estimate, beat tracking for tempo, and one-second chroma-template matching for major/minor triad changes. Natural minor is a likely scale inferred from a minor key, not a measurement of the notes used. These are heuristic estimates, not a trained AI or Chordino/Essentia model. Vocals, drums, overlapping instruments, modulations, nonstandard tuning and complex harmony can cause errors. Chord inversions, seventh chords, extensions and precise boundaries are not identified; tempo may be half or double the perceived beat. Correct labels and timestamps using **Edit chords**. The diagram library supports major/minor shapes and explicitly reports unsupported chord types. Time signature is not detected.

Playback controls include waveform seeking, speed and A/B looping. Selecting a chord seeks to its timestamp, and highlighting follows playback. Transposition changes displayed names, not audio pitch; capo calculates a relative shape for the chosen sounding chord. The fretboard is an independent scale explorer, initially rooted at the estimated key. Scale selection is manual. Manual edits and analysis results are not persistent.

## Configuration and deployment

The proposed `vercel.json` defines a Next.js `app` and FastAPI `backend`. Configure the Vercel project's framework as **Services** and use this folder as the project root. The browser sends `/api/*` directly to the backend on the same domain, while other paths go to the frontend. This is a browser-to-service call: neither service calls the other, so there is no service binding. Leave `NEXT_PUBLIC_ANALYSIS_API_URL` unset for this deployment. Run `vercel dev` to exercise both services locally, then test `/api/health` and a real upload. This configuration has not been deployed or verified with Vercel; its build, cold-start time, memory usage and dependency bundle size still require validation. Audio analysis may exceed function time or memory limits on some plans. Vercel Services availability and project settings must be checked in your account.

For standalone development or separate hosting, set `NEXT_PUBLIC_ANALYSIS_API_URL` to the backend's public origin (no `/api` suffix) when building the frontend. This public value must not contain secrets. The included Dockerfile is an alternative for a long-running Python host. Configure `CORS_ORIGINS` as a comma-separated list of exact frontend origins, and `ANALYSIS_CONCURRENCY` to a small positive integer appropriate to the host. The image binds to the provider's `PORT`, defaulting to 8000. The concurrency limit is per process, not a global cap across Vercel instances. No deployment or credentials are included.

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
