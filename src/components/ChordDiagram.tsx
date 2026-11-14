"use client";

import { getFingering } from "@/lib/music";

/** A standard guitar diagram: low E is on the left, high e on the right. */
export function ChordDiagram({ chord }: { chord: string }) {
  const fingering = getFingering(chord);
  if (!fingering) {
    return (
      <div className="diagram-unsupported">
        <p className="diagram-chord">{chord}</p>
        <p>Major and minor diagrams are available. Try selecting a simple major or minor chord.</p>
      </div>
    );
  }
  const played = fingering.frets.filter((v): v is number => v !== null && v > 0);
  const min = played.length ? Math.min(...played) : 1;
  const startFret = min > 3 ? min : 1;
  const x = (index: number) => 31 + index * 30;
  const y = (fret: number) => 45 + (fret - startFret + 0.5) * 28;
  return (
    <div className="diagram-wrap">
      <div className="diagram-title-row">
        <strong className="diagram-chord">{chord}</strong>
        <span className="diagram-note">{fingering.note}</span>
      </div>
      <svg className="chord-svg" viewBox="0 0 220 212" role="img" aria-label={`Guitar fingering for ${chord}`}>
        {startFret > 1 && <text x="4" y="64" fill="#aaa39c" fontSize="12">{startFret}fr</text>}
        {Array.from({length: 6}, (_, index) => <line key={`s${index}`} x1={x(index)} x2={x(index)} y1="45" y2="185" stroke="#8d8277" strokeWidth={index === 0 || index === 5 ? 2 : 1.4}/>) }
        {Array.from({length: 6}, (_, index) => <line key={`f${index}`} x1="31" x2="181" y1={45 + index * 28} y2={45 + index * 28} stroke={index === 0 && startFret === 1 ? "#ebe4db" : "#84786c"} strokeWidth={index === 0 && startFret === 1 ? 5 : 1.5}/>) }
        {fingering.frets.map((fret, index) => {
          if (fret === null) return <text key={index} x={x(index)} y="28" textAnchor="middle" fill="#a7a098" fontSize="17">×</text>;
          if (fret === 0) return <circle key={index} cx={x(index)} cy="22" r="7.5" stroke="#d5c9bd" strokeWidth="2" fill="none"/>;
          return <circle key={index} cx={x(index)} cy={y(fret)} r="11" fill="#ae805b" stroke="#f0dfcf" strokeWidth="1.1"/>;
        })}
        <text x="106" y="204" textAnchor="middle" fill="#817a73" fontSize="10">E · A · D · G · B · e</text>
      </svg>
      <p className="diagram-caption">× = don&apos;t play · ○ = open string</p>
    </div>
  );
}
