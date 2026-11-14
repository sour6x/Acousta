"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";
import type { AudioPlayerHandle } from "@/components/AudioPlayer";
import { ChordDiagram } from "@/components/ChordDiagram";
import { Fretboard } from "@/components/Fretboard";
import { Footer, Navigation } from "@/components/Navigation";
import { UploadZone } from "@/components/UploadZone";
import { Icon } from "@/components/Icon";
import { useAudioSession } from "@/context/AudioSession";
import { activeChordIndex, DEMO_CHORDS, formatTime, SHARP_NOTES, transposeChord, transposeNote } from "@/lib/music";
import type { ChordEvent } from "@/lib/music";
import { analyzeAudio } from "@/lib/api";
import type { SongAnalysis } from "@/lib/api";

const newId = () => `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const CHORD_PATTERN = /^[A-G](?:#|b)?(?:m|maj|dim|aug|sus|add)?[0-9#b+()a-zA-Z]*(?:\/[A-G](?:#|b)?)?$/;

export default function StudioPage() {
  const { uploaded } = useAudioSession();
  return <StudioSession key={uploaded?.url ?? "demo"}/>;
}

function StudioSession() {
  const { uploaded, clearFile } = useAudioSession();
  const uploadedUrl = uploaded?.url;
  const demo = !uploaded;
  const audioSrc = uploadedUrl ?? "/demo.wav";
  const player = useRef<AudioPlayerHandle>(null);

  const [chords, setChords] = useState<ChordEvent[]>(() => uploadedUrl ? [] : DEMO_CHORDS.map(event => ({ ...event })));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [semitones, setSemitones] = useState(0);
  const [capo, setCapo] = useState(0);
  const [editing, setEditing] = useState(false);
  const [newChord, setNewChord] = useState(uploadedUrl ? "C" : "G");
  const [addError, setAddError] = useState<string | null>(null);
  const [manualRoot, setManualRoot] = useState("C");
  const [analysis, setAnalysis] = useState<SongAnalysis | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [analysisError, setAnalysisError] = useState("");
  const analysisController = useRef<AbortController | null>(null);

  useEffect(() => () => analysisController.current?.abort(), []);

  async function runAnalysis() {
    if (!uploaded) return;
    const controller = new AbortController();
    analysisController.current?.abort(); analysisController.current = controller;
    setAnalysisStatus("loading"); setAnalysisError("");
    try {
      const result = await analyzeAudio(uploaded.file, controller.signal);
      if (controller.signal.aborted) return;
      setAnalysis(result); setChords(result.chords); setAnalysisStatus("done");
    } catch (error) {
      if (controller.signal.aborted) return;
      setAnalysisError(error instanceof Error ? error.message : "Analysis failed."); setAnalysisStatus("error");
    }
  }

  const sortedChords = useMemo(() => [...chords].sort((a, b) => a.time - b.time), [chords]);
  const activeIndex = activeChordIndex(sortedChords, currentTime);
  const activeEvent = activeIndex >= 0 ? sortedChords[activeIndex] : null;
  const soundingChord = activeEvent ? transposeChord(activeEvent.chord, semitones) : "—";
  const guitarShape = activeEvent ? transposeChord(soundingChord, -capo) : "—";
  const keyParts = analysis?.key?.split(" ");
  const currentKey = demo ? `${transposeNote("G", semitones)} major` : keyParts ? `${transposeNote(keyParts[0], semitones)} ${keyParts[1]} (estimate)` : "Not analyzed";
  const scaleRoot = demo ? transposeNote("G", semitones) : keyParts ? transposeNote(keyParts[0], semitones) : manualRoot;

  const onTimeChange = useCallback((seconds: number) => setCurrentTime(seconds), []);
  const onDurationChange = useCallback((seconds: number) => setDuration(seconds), []);

  function addChord() {
    const label = newChord.trim();
    if (!CHORD_PATTERN.test(label)) {
      setAddError("Enter a chord such as G, Am, C#m, Bb or D7.");
      return;
    }
    setChords(events => [...events, { id: newId(), time: Math.round(currentTime * 10) / 10, chord: label }]);
    setAddError(null);
  }

  function editChord(id: string, update: Partial<Pick<ChordEvent, "chord" | "time">>) {
    setChords(events => events.map(event => event.id === id ? { ...event, ...update } : event));
  }

  function handleSeek(seconds: number) {
    player.current?.seekTo(seconds);
    setCurrentTime(seconds);
  }

  return (
    <div className="site-shell">
      <Navigation studio />
      <main className="studio-main container">
        <div className="studio-heading">
          <div><div className="eyebrow eyebrow-small"><span className="eyebrow-line"/> YOUR PRACTICE WORKSPACE</div><h1>The studio<span>.</span></h1><p>Listen closely. Find the chords. Make the song your own.</p></div>
          <div className="studio-heading-status"><span className="status-dot"/> {demo ? "PRACTICE DEMO" : "LOCAL AUDIO"}</div>
        </div>

        <div className="studio-layout">
          <div className="studio-primary">
            <section className="panel song-panel">
              <div className="song-header">
                <span className="song-art"><Icon name="music" size={31}/></span>
                <div className="song-title-area"><span className="small-label">{demo ? "ORIGINAL DEMO TRACK" : "YOUR AUDIO FILE"}</span><h2>{demo ? "The Open Road" : uploaded.name}</h2><p>{demo ? "Original instrumental practice loop · 32 seconds" : `${(uploaded.size / (1024 * 1024)).toFixed(1)} MB · Uploaded in this browser session`}</p></div>
                <span className="song-track-tag">{demo ? "SAMPLE" : "LOCAL"}</span>
              </div>
              <AudioPlayer key={audioSrc} ref={player} src={audioSrc} onTimeChange={onTimeChange} onDurationChange={onDurationChange}/>
              <div className="song-footnote"><Icon name="info" size={15}/><span>{demo ? "Demo chords are matched to our original practice loop." : "Playback is local. Analysis sends this audio to the configured service and replaces the current chord list."}</span></div>
              {!demo && <div className="analysis-controls"><button type="button" className="button button-accent button-small" disabled={analysisStatus === "loading"} onClick={runAnalysis}>{analysisStatus === "loading" ? "Analyzing…" : analysisStatus === "done" ? "Analyze again" : "Analyze song"}</button><span role="status">{analysisStatus === "loading" ? "Uploading and analyzing audio; this may take a while." : analysisStatus === "done" ? "Estimates ready. Review and correct the chords below." : "Analyze for estimated key, tempo and chords."}</span>{analysisError && <p className="inline-error" role="alert">{analysisError}</p>}{analysis && <ul>{analysis.limitations.map(item => <li key={item}>{item}</li>)}</ul>}</div>}
            </section>

            <section className="panel timeline-panel">
              <div className="panel-header">
                <div><div className="eyebrow eyebrow-small"><Icon name="music" size={15}/> CHORD PROGRESSION</div><h2>Follow the chords</h2><p>Chord changes appear in sequence. Click a chord to jump to that moment.</p></div>
                <button className={`button button-muted button-small ${editing ? "button-selected" : ""}`} type="button" onClick={() => setEditing(value => !value)}><Icon name="edit" size={15}/>{editing ? "Done editing" : "Edit chords"}</button>
              </div>
              {sortedChords.length > 0 ? (
                <>
                  <div className="timeline-strip" role="group" aria-label="Chord changes">
                    {sortedChords.map((item, index) => {
                      const active = index === activeIndex;
                      return (
                        <button className={`timeline-chord ${active ? "timeline-chord-active" : ""}`} key={item.id} type="button" onClick={() => handleSeek(item.time)} aria-pressed={active}>
                          <span className="timeline-number">{String(index + 1).padStart(2, "0")}</span>
                          <strong>{transposeChord(item.chord, semitones)}</strong>
                          <span className="timeline-time">{formatTime(item.time)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="timeline-hint"><Icon name="clock" size={15}/><span>Current position: <strong>{formatTime(currentTime)}</strong></span><span>{sortedChords.length} chord changes</span></div>
                </>
              ) : <div className="empty-chords"><Icon name="music" size={25}/><strong>No chords added yet</strong><p>Play your song, pause where a chord begins, then use “Edit chords” to mark it.</p><button className="button button-muted button-small" onClick={() => setEditing(true)} type="button"><Icon name="plus" size={15}/> Add your first chord</button></div>}

              {editing && (
                <div className="edit-panel">
                  <div className="edit-panel-header"><strong>Manual chord editor</strong><span>Enter original chord names before transposition.</span></div>
                  <div className="add-chord-row">
                    <label>Chord
                      <input value={newChord} onChange={(event) => setNewChord(event.target.value)} placeholder="e.g. Am" maxLength={18}/>
                    </label>
                    <label>At playback position
                      <input value={formatTime(currentTime)} readOnly aria-label="Current playback position"/>
                    </label>
                    <button type="button" className="button button-accent" onClick={addChord}><Icon name="plus" size={17}/> Add chord</button>
                  </div>
                  {addError && <p className="inline-error" role="alert">{addError}</p>}
                  {sortedChords.length > 0 && (
                    <div className="edit-rows">
                      {sortedChords.map(event => (
                        <div className="edit-row" key={event.id}>
                          <label>Chord<input aria-label="Chord name" aria-invalid={!CHORD_PATTERN.test(event.chord)} value={event.chord} maxLength={18} onChange={(e: ChangeEvent<HTMLInputElement>) => editChord(event.id, { chord: e.target.value })}/>{!CHORD_PATTERN.test(event.chord) && <span className="inline-error">Enter a valid chord, such as Am or D7.</span>}</label>
                          <label>Time (seconds)<input aria-label="Chord timestamp in seconds" type="number" min="0" max={duration || undefined} step="0.1" value={event.time} onChange={(e) => editChord(event.id, { time: Math.min(duration || Infinity, Math.max(0, Number(e.target.value) || 0)) })}/></label>
                          <button type="button" className="delete-button" onClick={() => setChords(events => events.filter(item => item.id !== event.id))} aria-label={`Delete ${event.chord} chord at ${formatTime(event.time)}`}><Icon name="trash" size={17}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="editor-note">Changes are temporary and reset when you load a different song or refresh the page.</p>
                </div>
              )}
            </section>

            <section className="panel tools-panel">
              <div className="panel-header"><div><div className="eyebrow eyebrow-small"><Icon name="sliders" size={15}/> GUITAR SETTINGS</div><h2>Make it playable</h2><p>Change chord names and calculate the shapes for your capo position.</p></div></div>
              <div className="settings-grid">
                <div className="setting-block"><div className="setting-top"><h3>Transpose</h3><span>SEMITONES</span></div><p>Shift the displayed chords into a different key.</p><div className="stepper"><button type="button" disabled={semitones <= -11} onClick={() => setSemitones(v => Math.max(-11, v-1))} aria-label="Transpose down one semitone">−</button><strong>{semitones > 0 ? "+" : ""}{semitones}</strong><button type="button" disabled={semitones >= 11} onClick={() => setSemitones(v => Math.min(11, v+1))} aria-label="Transpose up one semitone">+</button></div><button className="text-button" type="button" onClick={() => setSemitones(0)} disabled={semitones === 0}>Reset to original key</button></div>
                <div className="setting-block"><div className="setting-top"><h3>Capo position</h3><span>FRET 0–12</span></div><p>Find guitar chord shapes that produce the chosen chords.</p><label className="field-label" htmlFor="capo">Capo fret</label><select id="capo" className="setting-select" value={capo} onChange={(e) => setCapo(Number(e.target.value))}>{Array.from({length:13},(_,i)=><option key={i} value={i}>{i===0?"No capo":"Fret "+i}</option>)}</select><p className="setting-footnote">Capo changes the shape, not the chord&apos;s concert pitch.</p></div>
              </div>
              <div className="music-disclaimer"><Icon name="info" size={15}/><span>Transposition updates the displayed chord names and shapes. It does not change the actual audio pitch.</span></div>
            </section>
            <Fretboard key={scaleRoot} initialRoot={scaleRoot}/>
          </div>

          <aside className="studio-sidebar">
            <section className="panel now-panel">
              <div className="sidebar-heading"><div className="eyebrow eyebrow-small">NOW PLAYING</div><h2>Current chord</h2></div>
              <div className="now-chord"><span>SOUNDING CHORD</span><strong>{soundingChord}</strong></div>
              <div className="now-shape"><div><span>GUITAR SHAPE</span><strong>{guitarShape}</strong></div><div><span>CAPO</span><strong>{capo === 0 ? "None" : `${capo}fr`}</strong></div></div>
              <div className="diagram-card"><h3>How to play it</h3>{guitarShape === "—" ? <p className="no-diagram">Add or select a chord on the timeline to see its diagram.</p> : <ChordDiagram chord={guitarShape}/>}</div>
            </section>
            <section className="panel details-panel"><div className="sidebar-heading"><div className="eyebrow eyebrow-small">SONG DETAILS</div><h2>At a glance</h2></div><div className="details-row"><span>Key</span><strong>{currentKey}</strong></div><div className="details-row"><span>Scale</span><strong>{demo ? `${transposeNote("G", semitones)} major` : keyParts ? `${transposeNote(keyParts[0], semitones)} ${keyParts[1] === "minor" ? "natural minor" : "major"} (estimate)` : "Not analyzed"}</strong></div><div className="details-row"><span>Tempo</span><strong>{demo ? "120 BPM" : analysis?.bpm ? `${analysis.bpm} BPM (estimate)` : "Not analyzed"}</strong></div><div className="details-row"><span>Time signature</span><strong>{demo ? "4/4" : "Not detected"}</strong></div><div className="details-row"><span>Duration</span><strong>{duration > 0 ? formatTime(duration) : "Loading…"}</strong></div>{!demo && !analysis && <div className="manual-scale"><label htmlFor="manual-key">Fretboard root (manual)</label><select value={manualRoot} id="manual-key" onChange={(e) => setManualRoot(e.target.value)}>{SHARP_NOTES.map(note => <option key={note}>{note}</option>)}</select></div>}</section>
            <section className="panel change-panel"><div className="sidebar-heading"><div className="eyebrow eyebrow-small">YOUR SESSION</div><h2>Switch songs</h2></div><UploadZone compact/>{!demo && <button className="button button-outline button-full" type="button" onClick={() => { player.current?.pause(); clearFile(); }}>Return to practice demo <Icon name="arrow" size={16}/></button>}{demo && <p className="switch-note">Load a song to play it locally and optionally analyze it.</p>}</section>
          </aside>
        </div>
      </main>
      <Footer/>
    </div>
  );
}
