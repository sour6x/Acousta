"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type WaveSurfer from "wavesurfer.js";
import { Icon } from "./Icon";
import { formatTime } from "@/lib/music";

export type AudioPlayerHandle = {
  seekTo: (seconds: number) => void;
  pause: () => void;
};

type Props = {
  src: string;
  onTimeChange: (seconds: number) => void;
  onDurationChange: (seconds: number) => void;
};

const SPEEDS = [0.75, 1, 1.25, 1.5];

export const AudioPlayer = forwardRef<AudioPlayerHandle, Props>(function AudioPlayer(
  { src, onTimeChange, onDurationChange }, ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<WaveSurfer | null>(null);
  const onTimeRef = useRef(onTimeChange);
  const onDurationRef = useRef(onDurationChange);
  const loopRef = useRef<{ start: number | null; end: number | null }>({ start: null, end: null });

  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // These refs prevent a full waveform reinitialization on every time update.
  useEffect(() => { onTimeRef.current = onTimeChange; }, [onTimeChange]);
  useEffect(() => { onDurationRef.current = onDurationChange; }, [onDurationChange]);
  useEffect(() => { loopRef.current = { start: loopStart, end: loopEnd }; }, [loopStart, loopEnd]);

  useImperativeHandle(ref, () => ({
    seekTo(seconds) {
      const ws = playerRef.current;
      if (ws) ws.setTime(Math.max(0, Math.min(seconds, ws.getDuration())));
    },
    pause() { playerRef.current?.pause(); },
  }), []);

  useEffect(() => {
    let cancelled = false;
    let instance: WaveSurfer | null = null;
    setPlaying(false); setReady(false); setTime(0); setDuration(0);
    setLoopStart(null); setLoopEnd(null); setError(null); setSpeed(1);
    onTimeRef.current(0); onDurationRef.current(0);

    async function initialize() {
      try {
        const WaveSurferModule = await import("wavesurfer.js");
        if (cancelled || !containerRef.current) return;
        instance = WaveSurferModule.default.create({
          container: containerRef.current,
          url: src,
          height: 88,
          waveColor: "#5c5752",
          progressColor: "#b98d69",
          cursorColor: "#efe6dc",
          cursorWidth: 2,
          barWidth: 3,
          barGap: 3,
          barRadius: 3,
          normalize: true,
          dragToSeek: true,
        });
        const ws = instance;
        playerRef.current = ws;
        ws.on("ready", (seconds) => {
          if (cancelled) return;
          setReady(true); setDuration(seconds); onDurationRef.current(seconds);
        });
        ws.on("timeupdate", (seconds) => {
          if (cancelled) return;
          const { start, end } = loopRef.current;
          if (start !== null && end !== null && seconds >= end && ws.isPlaying()) {
            ws.setTime(start);
            return;
          }
          setTime(seconds); onTimeRef.current(seconds);
        });
        ws.on("play", () => { if (!cancelled) setPlaying(true); });
        ws.on("pause", () => { if (!cancelled) setPlaying(false); });
        ws.on("finish", () => { if (!cancelled) setPlaying(false); });
        ws.on("error", () => {
          if (!cancelled) setError("This audio could not be played. Check that your browser supports its format.");
        });
      } catch {
        if (!cancelled) setError("The waveform player could not load. Try refreshing the page.");
      }
    }
    initialize();
    return () => {
      cancelled = true;
      if (instance) instance.destroy();
      if (playerRef.current === instance) playerRef.current = null;
    };
  }, [src]);

  function toggle() {
    const ws = playerRef.current;
    if (!ws || !ready) return;
    ws.playPause().catch(() => setError("Playback was blocked. Try pressing play again."));
  }

  function skip(amount: number) {
    const ws = playerRef.current;
    if (!ws) return;
    ws.setTime(Math.max(0, Math.min(duration, ws.getCurrentTime() + amount)));
  }

  function changeSpeed(next: number) {
    setSpeed(next);
    playerRef.current?.setPlaybackRate(next);
  }

  function markStart() {
    setLoopStart(time);
    if (loopEnd !== null && time >= loopEnd) setLoopEnd(null);
  }

  function markEnd() {
    if (loopStart === null || time <= loopStart) return;
    setLoopEnd(time);
  }

  return (
    <div className="audio-widget">
      <div className="waveform-surface">
        <div className="waveform-head"><Icon name="wave" size={17}/><span>Audio waveform</span><span className="waveform-help">Click or drag to seek</span></div>
        <div ref={containerRef} className="waveform" aria-label="Interactive audio waveform" />
        {!ready && !error && <span className="waveform-loading">Preparing waveform…</span>}
      </div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="player-row">
        <div className="transport">
          <button type="button" className="icon-control" onClick={() => skip(-10)} disabled={!ready} title="Back 10 seconds" aria-label="Back 10 seconds"><Icon name="skip-back" size={17}/></button>
          <button type="button" className="play-control" onClick={toggle} disabled={!ready} aria-label={playing ? "Pause audio" : "Play audio"}><Icon name={playing ? "pause" : "play"} size={20} /></button>
          <button type="button" className="icon-control" onClick={() => skip(10)} disabled={!ready} title="Forward 10 seconds" aria-label="Forward 10 seconds"><Icon name="skip-forward" size={17}/></button>
          <span className="play-time">{formatTime(time)} <span>/</span> {formatTime(duration)}</span>
        </div>
        <div className="player-extras">
          <label className="select-label">Speed
            <select value={speed} onChange={(event) => changeSpeed(Number(event.target.value))} aria-label="Playback speed" className="small-select">
              {SPEEDS.map((value) => <option key={value} value={value}>{value}×</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="loop-row">
        <div className="loop-title"><Icon name="repeat" size={16}/> <strong>Practice loop</strong> <span>Mark a section and repeat it.</span></div>
        <div className="loop-actions">
          <button className="button button-muted button-small" type="button" disabled={!ready} onClick={markStart}>Set start (A){loopStart !== null ? ` · ${formatTime(loopStart)}` : ""}</button>
          <button className="button button-muted button-small" type="button" disabled={!ready || loopStart === null || time <= loopStart} onClick={markEnd}>Set end (B){loopEnd !== null ? ` · ${formatTime(loopEnd)}` : ""}</button>
          <button className="text-button" type="button" disabled={loopStart === null && loopEnd === null} onClick={() => { setLoopStart(null); setLoopEnd(null); }}>Clear loop</button>
        </div>
      </div>
      {loopStart !== null && loopEnd !== null && <div className="loop-active"><Icon name="check" size={15}/> Looping {formatTime(loopStart)}–{formatTime(loopEnd)} during playback</div>}
    </div>
  );
});
