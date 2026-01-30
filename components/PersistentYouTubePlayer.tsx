import React, { useEffect, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useMusicStore } from '../music/MusicStore';

/**
 * Persistent hidden YouTube player
 * - Single iframe instance
 * - Controlled via global MusicStore
 * - Hidden from UI (audio only)
 */
const PersistentYouTubePlayer: React.FC = () => {
  const music = useMusicStore();
  const playerRef = useRef<any>(null);
  const lastVideoIdRef = useRef<string | null>(null);

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    try {
      event.target.setVolume(music.volume);
    } catch {
      // ignore
    }
  };

  // When track changes, cue/load it
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;

    const next = music.provider === 'youtube' ? music.videoId : null;
    if (!next) {
      try {
        p.stopVideo?.();
      } catch {
        // ignore
      }
      lastVideoIdRef.current = null;
      return;
    }

    if (lastVideoIdRef.current === next) return;
    lastVideoIdRef.current = next;

    try {
      // cue first (no autoplay), then follow isPlaying effect
      if (p.cueVideoById) p.cueVideoById(next);
      else if (p.loadVideoById) p.loadVideoById(next);
    } catch {
      // ignore
    }
  }, [music.provider, music.videoId]);

  // Play/pause changes
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    const hasTrack = music.provider === 'youtube' && !!music.videoId;
    if (!hasTrack) return;

    try {
      if (music.isPlaying) p.playVideo?.();
      else p.pauseVideo?.();
    } catch {
      // ignore
    }
  }, [music.isPlaying, music.provider, music.videoId]);

  // Volume changes
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      p.setVolume?.(music.volume);
    } catch {
      // ignore
    }
  }, [music.volume]);

  // Render only once we have a track (keeps single iframe)
  if (music.provider !== 'youtube' || !music.videoId) return null;

  return (
    <div
      data-ui="persistent-youtube-player"
      style={{
        position: 'fixed',
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
        left: -9999,
        top: -9999,
      }}
    >
      <YouTube
        videoId={music.videoId}
        opts={{
          height: '1',
          width: '1',
          playerVars: {
            autoplay: 0,
            controls: 0,
            playsinline: 1,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
          },
        }}
        onReady={onReady}
      />
    </div>
  );
};

export default PersistentYouTubePlayer;






