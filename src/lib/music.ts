/**
 * Guitar-friendly, dependency-free music theory helpers.
 * Transposition changes the displayed chord names, not audio pitch.
 */

export const SHARP_NOTES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export const FLAT_NOTES = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
] as const;

const NOTE_NUMBERS: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3,
  E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8,
  Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

export const SCALE_TYPES: Record<string, number[]> = {
  "Major": [0, 2, 4, 5, 7, 9, 11],
  "Natural minor": [0, 2, 3, 5, 7, 8, 10],
  "Major pentatonic": [0, 2, 4, 7, 9],
  "Minor pentatonic": [0, 3, 5, 7, 10],
  "Blues": [0, 3, 5, 6, 7, 10],
  "Dorian": [0, 2, 3, 5, 7, 9, 10],
  "Mixolydian": [0, 2, 4, 5, 7, 9, 10],
};

export const STANDARD_TUNING = [
  { name: "e", note: "E", octave: 4 },
  { name: "B", note: "B", octave: 3 },
  { name: "G", note: "G", octave: 3 },
  { name: "D", note: "D", octave: 3 },
  { name: "A", note: "A", octave: 2 },
  { name: "E", note: "E", octave: 2 },
] as const;

export function numberForNote(note: string): number | null {
  return NOTE_NUMBERS[note] ?? null;
}

export function noteFromNumber(number: number, flats = false): string {
  const index = ((number % 12) + 12) % 12;
  return (flats ? FLAT_NOTES : SHARP_NOTES)[index];
}

export function transposeNote(note: string, semitones: number): string {
  const value = numberForNote(note);
  if (value === null) return note;
  // Preserve flat spelling when the original note is flat.
  return noteFromNumber(value + semitones, note.includes("b"));
}

/** Supports ordinary names such as Am7, F#m, Bbmaj7 and D/F#. */
export function transposeChord(chord: string, semitones: number): string {
  const match = chord.trim().match(/^([A-G](?:#|b)?)([^/]*)?(?:\/([A-G](?:#|b)?))?$/);
  if (!match) return chord;
  const root = transposeNote(match[1], semitones);
  const modifier = match[2] ?? "";
  const bass = match[3] ? `/${transposeNote(match[3], semitones)}` : "";
  return `${root}${modifier}${bass}`;
}

export function getScaleNotes(root: string, type: string): string[] {
  const first = numberForNote(root);
  const intervals = SCALE_TYPES[type];
  if (first === null || !intervals) return [];
  return intervals.map((interval) => noteFromNumber(first + interval, root.includes("b")));
}

export function scaleHasNote(root: string, type: string, note: string): boolean {
  const pitch = numberForNote(note);
  const first = numberForNote(root);
  if (pitch === null || first === null) return false;
  return (SCALE_TYPES[type] ?? []).some((interval) => (first + interval) % 12 === pitch);
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

export type ChordEvent = { id: string; time: number; chord: string };

export function activeChordIndex(chords: ChordEvent[], seconds: number): number {
  for (let i = chords.length - 1; i >= 0; i--) {
    if (seconds >= chords[i].time) return i;
  }
  return -1;
}

export const DEMO_CHORDS: ChordEvent[] = [
  { id: "demo-0", time: 0, chord: "G" },
  { id: "demo-1", time: 4, chord: "D" },
  { id: "demo-2", time: 8, chord: "Em" },
  { id: "demo-3", time: 12, chord: "C" },
  { id: "demo-4", time: 16, chord: "G" },
  { id: "demo-5", time: 20, chord: "D" },
  { id: "demo-6", time: 24, chord: "Em" },
  { id: "demo-7", time: 28, chord: "C" },
];

/** Return playable E- or A-shaped barre fingering for ordinary major/minor chords. */
export type Fingering = { frets: (number | null)[]; title: string; note: string };
const OPEN: Record<string, (number | null)[]> = {
  C: [null, 3, 2, 0, 1, 0], D: [null, null, 0, 2, 3, 2],
  E: [0, 2, 2, 1, 0, 0], F: [1, 3, 3, 2, 1, 1],
  G: [3, 2, 0, 0, 0, 3], A: [null, 0, 2, 2, 2, 0],
  B: [null, 2, 4, 4, 4, 2],
  Am: [null, 0, 2, 2, 1, 0], Bm: [null, 2, 4, 4, 3, 2],
  Cm: [null, 3, 5, 5, 4, 3], Dm: [null, null, 0, 2, 3, 1],
  Em: [0, 2, 2, 0, 0, 0], Fm: [1, 3, 3, 1, 1, 1],
  Gm: [3, 5, 5, 3, 3, 3],
};

export function getFingering(chord: string): Fingering | null {
  const match = chord.match(/^([A-G](?:#|b)?)(m?)$/);
  if (!match) return null;
  const root = match[1];
  const minor = match[2] === "m";
  if (OPEN[chord]) return { frets: OPEN[chord], title: chord, note: "Common guitar voicing" };

  const pitch = numberForNote(root);
  if (pitch === null) return null;
  // E-shape and A-shape barre chords, choosing the lower practical fret.
  const eFret = ((pitch - 4) % 12 + 12) % 12;
  const aFret = ((pitch - 9) % 12 + 12) % 12;
  const useA = aFret < eFret;
  const fret = useA ? aFret : eFret;
  const frets = useA
    ? [null, fret, fret + 2, fret + 2, fret + (minor ? 1 : 2), fret]
    : [fret, fret + 2, fret + 2, fret + (minor ? 0 : 1), fret, fret];
  return {
    frets,
    title: chord,
    note: `${useA ? "A" : "E"}-shape barre chord${fret > 0 ? ` at fret ${fret}` : ""}`,
  };
}
