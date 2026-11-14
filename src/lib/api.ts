import type { ChordEvent } from "./music";
export type SongAnalysis = { durationSeconds: number; key: string | null; likelyScale: string | null; bpm: number | null; chords: ChordEvent[]; limitations: string[] };
export async function analyzeAudio(file: File, signal: AbortSignal): Promise<SongAnalysis> {
  const base = process.env.NEXT_PUBLIC_ANALYSIS_API_URL;
  if (!base) throw new Error("Analysis service is not configured. You can still play and edit chords manually.");
  const data = new FormData(); data.append("file", file);
  let response: Response;
  try { response = await fetch(`${base.replace(/\/$/, "")}/api/analyze`, { method: "POST", body: data, signal }); }
  catch (error) { if (signal.aborted) throw error; throw new Error("Could not reach the analysis service. Check your connection and service configuration."); }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.detail === "string" ? body.detail : `Analysis failed (${response.status}).`);
  }
  return response.json();
}
