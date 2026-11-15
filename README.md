# Acousta

Acousta is a guitar practice website for exploring a song's estimated chords, key and tempo. Choose an audio file on the home page, open it in the studio, and use the player and guitar tools to practice. The analysis is heuristic and its results should be checked by ear.

**Use Acousta online:** [https://acousta-mu.vercel.app](https://acousta-mu.vercel.app/) — no local setup is needed.

## What it is built with

| Part | Technology | Purpose |
| --- | --- | --- |
| Frontend | Next.js, React and TypeScript | Pages, navigation, interactive studio and browser session state |
| Styling | Tailwind CSS, PostCSS and custom CSS | Responsive layout and the black, silver and walnut visual design |
| Audio player | WaveSurfer.js and browser audio APIs | Waveform, playback, seeking, speed and practice looping |
| Music tools | TypeScript | Chord transposition, capo shapes, chord diagrams and fretboard scales |
| Backend | Python, FastAPI, Uvicorn and python-multipart | Audio upload and analysis API |
| Audio analysis | librosa and NumPy | Pitch-class features, chord templates, key profiles and tempo estimation |
| Audio decoding and resampling | SoundFile / libsndfile and soxr | Read supported audio files and convert sample rates |
| Hosting | Vercel Services | Deploy the Next.js app and FastAPI backend under one domain |
| Testing and tooling | pytest, HTTPX, ESLint and TypeScript | Backend checks, frontend linting and type checking |
| Alternative backend hosting | Docker | Run the FastAPI service separately in a container |

The project does **not** currently use a trained AI model, Chordino, Essentia or an external analysis API. `package.json` and `backend/requirements.txt` list the dependencies and versions.

## How it works

The browser plays the chosen file locally. When the user selects **Analyze song**, it uploads the file to the Python service. The service decodes the audio, estimates its key and tempo, and compares pitch features with major and minor chord templates to produce timestamped chord changes. The studio follows those timestamps during playback and allows manual correction.

The service uses temporary files and deletes them after the request. The selected file, analysis results and manual edits are held in the browser session and disappear when the page is refreshed or a different song is loaded.

```text
Browser: Next.js studio and WaveSurfer player
   └── POST /api/analyze with audio
         └── FastAPI: SoundFile + soxr + librosa + NumPy
               └── estimated key, tempo and timestamped chords
```

## Project structure

```text
src/app/                 Home and studio pages
src/components/          Upload, player, fretboard and chord UI
src/context/             Browser audio session state
src/lib/                 Music helpers and analysis API client
backend/app.py           FastAPI routes and analysis
backend/tests/           Backend API and audio tests
backend/requirements.txt Python dependencies
backend/Dockerfile       Optional standalone backend container
vercel.json              Vercel service and routing configuration
```

## Run the project on your computer (optional)

These steps are for developers who want to run their own local copy. To use the live site, visit [acousta-mu.vercel.app](https://acousta-mu.vercel.app/) instead.

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

3. Once both local servers are running, open your local copy at `http://localhost:3000`, choose a file, and select **Analyze song**. This address works only on the computer running the development server; it is not the public website. The backend must be running for analysis. The demo and manual editor work without it. Loading an audio file alone does not send it to the service; clicking Analyze does. Analysis replaces the current chord list. Reanalysis also replaces manual edits.

The standalone service accepts MP3, WAV and FLAC, up to 25 MiB and 10 minutes, mono or stereo, maximum 192 kHz. The Vercel configuration limits analysis uploads to 4 MiB in the browser to stay below Vercel's 4.5 MB request limit; larger files can still be played and edited locally. It checks the decoded audio, not just the filename. Invalid, silent, excessively long or unsupported files are rejected. Browser playback support varies, especially for FLAC.

## Analysis and practice

The backend uses librosa chroma features and key profiles for a global major/minor key estimate, beat tracking for tempo, and one-second chroma-template matching for major/minor triad changes. Natural minor is a likely scale inferred from a minor key, not a measurement of the notes used. These are heuristic estimates, not a trained AI or Chordino/Essentia model. Vocals, drums, overlapping instruments, modulations, nonstandard tuning and complex harmony can cause errors. Chord inversions, seventh chords, extensions and precise boundaries are not identified; tempo may be half or double the perceived beat. Correct labels and timestamps using **Edit chords**. The diagram library supports major/minor shapes and explicitly reports unsupported chord types. Time signature is not detected.

Playback controls include waveform seeking, speed and A/B looping. Selecting a chord seeks to its timestamp, and highlighting follows playback. Transposition changes displayed names, not audio pitch; capo calculates a relative shape for the chosen sounding chord. The fretboard is an independent scale explorer, initially rooted at the estimated key. Scale selection is manual. Manual edits and analysis results are not persistent.

## Configuration and deployment

`vercel.json` defines a Next.js `app` and FastAPI `backend`. Configure the Vercel project's framework as **Services** and use this folder as the project root. The browser sends `/api/*` directly to the backend on the same domain, while other paths go to the frontend. This is a browser-to-service call: neither service calls the other, so there is no service binding. Leave `NEXT_PUBLIC_ANALYSIS_API_URL` unset for this deployment. Run `vercel dev` to exercise both services locally, then test `/api/health` and a real upload. The current site has been deployed on Vercel and a synthetic MP3 upload has been tested; that does not verify all files or workloads. Audio analysis may exceed function time or memory limits on some plans. Vercel Services availability and project settings must be checked in your account.

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

For an end-to-end smoke test, start both services, upload a short licensed WAV, press Analyze, confirm results and limitations, seek/play through changes, edit a chord, and check transposition and capo. Repeat with supported MP3 and FLAC files and test a rejected file. The automated synthetic audio tests check the response contract, simple triads, and resampling; they are not a benchmark of recognition accuracy.
