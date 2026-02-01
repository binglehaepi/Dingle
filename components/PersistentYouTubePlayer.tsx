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
  const initialVideoIdRef = useRef<string | null>(null);

  const onReady: YouTubeProps['onReady'] = (event) => {
    console.log('🎬 [YouTube Player] onReady 호출됨');
    playerRef.current = event.target;
    try {
      event.target.setVolume(music.volume);
      console.log('🎬 [YouTube Player] 볼륨 설정:', music.volume);
    } catch (err) {
      console.error('🎬 [YouTube Player] 볼륨 설정 실패:', err);
    }
    
    // ⭐ onReady 시점에 이미 isPlaying=true면 즉시 재생
    if (music.isPlaying && music.provider === 'youtube' && music.videoId) {
      console.log('🎬 [YouTube Player] onReady 시점에 재생 요청됨, 즉시 재생');
      try {
        event.target.playVideo?.();
      } catch (err) {
        console.error('🎬 [YouTube Player] onReady에서 재생 실패:', err);
      }
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
    console.log('🎬 [YouTube Player] Track 변경 감지:', { provider: music.provider, videoId: music.videoId, isPlaying: music.isPlaying });
    const p = playerRef.current;
    if (!p) {
      console.log('🎬 [YouTube Player] playerRef 없음');
      return;
    }

    const next = music.provider === 'youtube' ? music.videoId : null;
    if (!next) {
      console.log('🎬 [YouTube Player] next videoId 없음, 정지');
      try {
        p.stopVideo?.();
      } catch (err) {
        console.error('🎬 [YouTube Player] stopVideo 실패:', err);
      }
      lastVideoIdRef.current = null;
      return;
    }

    if (lastVideoIdRef.current === next) {
      console.log('🎬 [YouTube Player] 동일한 videoId, 스킵');
      return;
    }
    lastVideoIdRef.current = next;

    console.log('🎬 [YouTube Player] 새로운 videoId 로드:', next, '재생 상태:', music.isPlaying);
    try {
      // ⭐ isPlaying이 true면 loadVideoById로 자동 재생
      if (music.isPlaying) {
        console.log('🎬 [YouTube Player] loadVideoById 호출 (자동 재생)');
        if (p.loadVideoById) {
          p.loadVideoById(next);
        } else if (p.cueVideoById) {
          p.cueVideoById(next);
          // cueVideoById 후 명시적으로 재생
          setTimeout(() => {
            try {
              p.playVideo?.();
              console.log('🎬 [YouTube Player] cueVideoById 후 playVideo 호출');
            } catch (err) {
              console.error('🎬 [YouTube Player] playVideo 실패:', err);
            }
          }, 100);
        }
      } else {
        // ⭐ isPlaying이 false면 cueVideoById로 로드만
        console.log('🎬 [YouTube Player] cueVideoById 호출 (로드만)');
        if (p.cueVideoById) {
          p.cueVideoById(next);
        } else if (p.loadVideoById) {
          p.loadVideoById(next);
        }
      }
      console.log('🎬 [YouTube Player] 비디오 로드 성공');
    } catch (err) {
      console.error('🎬 [YouTube Player] 비디오 로드 실패:', err);
    }
  }, [music.provider, music.videoId, music.isPlaying]);

  // Play/pause changes
  useEffect(() => {
    console.log('🎬 [YouTube Player] Play/Pause 변경:', music.isPlaying);
    const p = playerRef.current;
    if (!p) {
      console.log('🎬 [YouTube Player] playerRef 없음');
      return;
    }
    const hasTrack = music.provider === 'youtube' && !!music.videoId;
    if (!hasTrack) {
      console.log('🎬 [YouTube Player] 트랙 없음');
      return;
    }

    try {
      if (music.isPlaying) {
        console.log('🎬 [YouTube Player] playVideo 호출');
        p.playVideo?.();
      }
      else {
        console.log('🎬 [YouTube Player] pauseVideo 호출');
        p.pauseVideo?.();
      }
    } catch (err) {
      console.error('🎬 [YouTube Player] play/pause 실패:', err);
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
  if (music.provider !== 'youtube' || !music.videoId) {
    console.log('🎬 [YouTube Player] 렌더링하지 않음:', { provider: music.provider, videoId: music.videoId });
    return null;
  }
  
  // ⭐ 첫 번째 videoId를 저장 (iframe 재생성 방지)
  if (!initialVideoIdRef.current) {
    initialVideoIdRef.current = music.videoId;
  }
  
  console.log('🎬 [YouTube Player] 렌더링 중:', { initialVideoId: initialVideoIdRef.current, currentVideoId: music.videoId });

  return (
    <div
      data-ui="persistent-youtube-player"
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '200px',
        height: '200px',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      <YouTube
        videoId={initialVideoIdRef.current}
        opts={{
          host: 'https://www.youtube.com',
          height: '200',
          width: '200',
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






