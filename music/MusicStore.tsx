import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type MusicProviderKind = 'youtube' | 'none';

export type MusicState = {
  provider: MusicProviderKind;
  videoId: string | null;
  isPlaying: boolean;
  volume: number; // 0~100
};

type MusicActions = {
  setTrack: (videoId: string | null) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (volume: number) => void;
};

export type MusicStore = MusicState & MusicActions;

const MusicContext = createContext<MusicStore | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<MusicProviderKind>('none');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, _setVolume] = useState(60);

  // keep stable actions
  const setTrack = useCallback((nextVideoId: string | null) => {
    setProvider(nextVideoId ? 'youtube' : 'none');
    setVideoId(nextVideoId);
    if (!nextVideoId) setIsPlaying(false);
  }, []);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((p) => !p), []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    _setVolume(clamped);
  }, []);

  const store = useMemo<MusicStore>(() => {
    return { provider, videoId, isPlaying, volume, setTrack, play, pause, toggle, setVolume };
  }, [provider, videoId, isPlaying, volume, setTrack, play, pause, toggle, setVolume]);

  return <MusicContext.Provider value={store}>{children}</MusicContext.Provider>;
}

export function useMusicStore(): MusicStore {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusicStore must be used within <MusicProvider>');
  return ctx;
}






