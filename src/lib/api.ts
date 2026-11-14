import type { ChordEvent } from "./music";
export type SongAnalysis = { durationSeconds: number; key: string | null; likelyScale: string | null; bpm: number | null; chords: ChordEvent[]; limitations: string[] };
export async function analyzeAudio(file: File, signal: AbortSignal): Promise<SongAnalysis> {
  // The browser uses the shared Vercel domain; a separate local backend can override it.
  const base = process.env.NEXT_PUBLIC_ANALYSIS_API_URL ?? "";
  if (!base && file.size > 4 * 1024 * 1024) throw new Error("On Vercel, analysis supports files up to 4 MiB because of the request size limit. You can still play and edit this file locally.");
  const data = new FormData(); data.append("file", file);
  let response: Response;
  try { response = await fetch(`${base.replace(/\/$/, "")}/api/analyze`, { method: "POST", body: data, signal }); }
  catch (error) { if (signal.aborted) throw error; throw new Error("Could not reach the analysis service. Check your connection and service configuration."); }
  if (!response.ok) {
    if (response.status === 413) throw new Error("The audio exceeds the upload limit of the hosting service. Try a smaller file.");
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.detail === "string" ? body.detail : `Analysis failed (${response.status}).`);
  }
  return response.json();
}
