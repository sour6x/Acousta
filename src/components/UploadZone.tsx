"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAudioSession } from "@/context/AudioSession";
import { Icon } from "./Icon";

export function UploadZone({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { chooseFile } = useAudioSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(file?: File) {
    if (!file) return;
    const issue = chooseFile(file);
    if (issue) {
      setError(issue);
      return;
    }
    setError(null);
    router.push("/studio");
  }

  return (
    <div className={`upload-zone ${dragging ? "upload-zone-active" : ""} ${compact ? "upload-zone-compact" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault(); setDragging(false);
        submit(event.dataTransfer.files[0]);
      }}>
      <span className="upload-icon"><Icon name="upload" size={26} /></span>
      <h3>{compact ? "Load a different song" : "Drop your song here"}</h3>
      <p>MP3, WAV or FLAC · Up to 25 MB · Analysis sends audio to the service</p>
      <input ref={inputRef} type="file" accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
        className="visually-hidden" aria-label="Choose an audio file"
        onChange={(event) => { submit(event.target.files?.[0]); event.target.value = ""; }}/>
      <button className="button button-accent upload-action" type="button" onClick={() => inputRef.current?.click()}>
        <Icon name="upload" size={16} /> Choose audio file
      </button>
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
  );
}
