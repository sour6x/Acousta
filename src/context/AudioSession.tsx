"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type UploadedAudio = {
  name: string;
  size: number;
  url: string;
  file: File;
};

type AudioSessionValue = {
  uploaded: UploadedAudio | null;
  chooseFile: (file: File) => string | null;
  clearFile: () => void;
};

const AudioSessionContext = createContext<AudioSessionValue | null>(null);
const extensions = /\.(mp3|wav|flac)$/i;

export function AudioSessionProvider({ children }: { children: ReactNode }) {
  const [uploaded, setUploaded] = useState<UploadedAudio | null>(null);
  const currentUrl = useRef<string | null>(null);

  // Object URLs are local browser pointers, not uploads to a server.
  useEffect(() => {
    return () => {
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    };
  }, []);

  const chooseFile = useCallback((file: File): string | null => {
    if (!extensions.test(file.name)) {
      return "Choose an MP3, WAV or FLAC audio file.";
    }
    if (file.size === 0 || file.size > 25 * 1024 * 1024) {
      return "Choose a nonempty audio file no larger than 25 MB.";
    }
    const url = URL.createObjectURL(file);
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = url;
    setUploaded({ name: file.name, size: file.size, url, file });
    return null;
  }, []);

  const clearFile = useCallback(() => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = null;
    setUploaded(null);
  }, []);

  return (
    <AudioSessionContext.Provider value={{ uploaded, chooseFile, clearFile }}>
      {children}
    </AudioSessionContext.Provider>
  );
}

export function useAudioSession() {
  const value = useContext(AudioSessionContext);
  if (!value) throw new Error("useAudioSession requires AudioSessionProvider");
  return value;
}
