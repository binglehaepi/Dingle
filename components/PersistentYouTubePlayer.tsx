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

  const onError: YouTubeProps['onError'] = (event) => {
    console.error('YouTube Player Error:', event.data);
    
    // 오류 코드별 메시지
    const errorMessages: Record<number, string> = {
      2: '잘못된 동영상 ID입니다.',
      5: 'HTML5 플레이어 오류가 발생했습니다.',
      100: '동영상을 찾을 수 없습니다.',
      101: '동영상 소유자가 재생을 허용하지 않습니다.',
      150: '동영상 소유자가 재생을 허용하지 않습니다.',
    };
    
    const message = errorMessages[event.data] || 
      '음악 재생 실패\n\n브라우저에서 YouTube가 열려있다면 닫아주세요.\n(YouTube는 동시 재생을 제한합니다)';
    
    music.setError(message);
    
    // 5초 후 메시지 자동 제거
    setTimeout(() => {
      music.setError(null);
    }, 5000);
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
          host: 'https://www.youtube.com',
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
            origin: window.location.origin,
          },
        }}
        onReady={onReady}
        onError={onError}
      />
    </div>
  );
};

export default PersistentYouTubePlayer;






