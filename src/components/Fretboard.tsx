"use client";

import { useMemo, useState } from "react";
import { getScaleNotes, noteFromNumber, numberForNote, scaleHasNote, SCALE_TYPES, SHARP_NOTES, STANDARD_TUNING } from "@/lib/music";
import { Icon } from "./Icon";

export function Fretboard({ initialRoot = "G" }: { initialRoot?: string }) {
  const [root, setRoot] = useState(initialRoot);
  const [scale, setScale] = useState("Major");
  const [selected, setSelected] = useState<string | null>(null);
  const notes = useMemo(() => getScaleNotes(root, scale), [root, scale]);
  const rootPitch = numberForNote(root);

  return (
    <section className="panel fretboard-panel" id="fretboard">
      <div className="panel-header">
        <div>
          <div className="eyebrow eyebrow-small"><Icon name="grid" size={15}/> FRETBOARD EXPLORER</div>
          <h2>Find your notes</h2>
          <p>Choose a scale. Highlighted notes show where to play across the guitar neck.</p>
        </div>
      </div>
      <div className="fretboard-controls">
        <label>Root note
          <select value={root} onChange={(e) => { setRoot(e.target.value); setSelected(null); }}>
            {SHARP_NOTES.map((note) => <option key={note}>{note}</option>)}
          </select>
        </label>
        <label>Scale
          <select value={scale} onChange={(e) => { setScale(e.target.value); setSelected(null); }}>
            {Object.keys(SCALE_TYPES).map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <div className="notes-summary"><span>Scale notes</span><strong>{notes.join(" · ")}</strong></div>
      </div>
      <div className="fretboard-scroll" aria-label={`${root} ${scale} guitar fretboard, standard tuning`}>
        <div className="fretboard-grid">
          <div className="fret-corner">TUNE</div>
          {Array.from({ length: 13 }, (_, fret) => <div key={fret} className="fret-heading">{fret === 0 ? "OPEN" : fret}</div>)}
          {STANDARD_TUNING.map((string, stringIndex) => {
            const openNote = numberForNote(string.note) ?? 0;
            return [
              <div key={`label-${stringIndex}`} className="string-label">{string.name}</div>,
              ...Array.from({ length: 13 }, (_, fret) => {
                const pitch = (openNote + fret) % 12;
                const note = noteFromNumber(pitch);
                const isRoot = pitch === rootPitch;
                const inScale = scaleHasNote(root, scale, note);
                return (
                  <button type="button" key={`${stringIndex}-${fret}`}
                    className={`fret-cell ${fret === 0 ? "fret-open" : ""}`}
                    aria-label={`${string.name} string, fret ${fret}, note ${note}${inScale ? ", in scale" : ""}`}
                    onClick={() => setSelected(`${note} · ${string.name} string · fret ${fret}`)}>
                    <span className={`fret-dot ${isRoot ? "fret-dot-root" : inScale ? "fret-dot-scale" : "fret-dot-off"}`}>{inScale ? note : ""}</span>
                  </button>
                );
              }),
            ];
          })}
        </div>
      </div>
      <div className="fretboard-foot">
        <div className="fretboard-legend"><span><i className="legend-root"/> Root note</span><span><i className="legend-scale"/> Scale note</span><span><i className="legend-empty"/> Other notes</span></div>
        <span className="fretboard-selected">{selected ?? "Tap a fret to inspect its note"}</span>
      </div>
    </section>
  );
}
