import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type MusicProviderKind = 'youtube' | 'none';

export type MusicState = {
  provider: MusicProviderKind;
  videoId: string | null;
  isPlaying: boolean;
  volume: number; // 0~100
  errorMessage: string | null;
};

type MusicActions = {
  setTrack: (videoId: string | null) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (volume: number) => void;
  setError: (message: string | null) => void;
};

export type MusicStore = MusicState & MusicActions;

const MusicContext = createContext<MusicStore | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<MusicProviderKind>('none');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, _setVolume] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // keep stable actions
  const setTrack = useCallback((nextVideoId: string | null) => {
    setProvider(nextVideoId ? 'youtube' : 'none');
    setVideoId(nextVideoId);
    if (!nextVideoId) setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    setErrorMessage(null); // 새로운 재생 시도 시 오류 초기화
    setIsPlaying(true);
  }, []);
  
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((p) => !p), []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    _setVolume(clamped);
  }, []);

  const setError = useCallback((message: string | null) => {
    setErrorMessage(message);
  }, []);

  const store = useMemo<MusicStore>(() => {
    return { provider, videoId, isPlaying, volume, errorMessage, setTrack, play, pause, toggle, setVolume, setError };
  }, [provider, videoId, isPlaying, volume, errorMessage, setTrack, play, pause, toggle, setVolume, setError]);

  return <MusicContext.Provider value={store}>{children}</MusicContext.Provider>;
}

export function useMusicStore(): MusicStore {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusicStore must be used within <MusicProvider>');
  return ctx;
}






