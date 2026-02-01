import React from 'react';
import { ScrapMetadata } from '../../types';
import { useMusicStore } from '../../music/MusicStore';

interface MusicCdObjectProps {
  data: ScrapMetadata;
}

const MusicCdObject: React.FC<MusicCdObjectProps> = ({ data }) => {
  // 전역 음악 상태 사용
  const music = useMusicStore();

  const getVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  const videoId = getVideoId(data.url);

  // 이 CD가 현재 재생 중인지 확인
  const isThisTrackPlaying = !!videoId && 
    music.provider === 'youtube' && 
    music.videoId === videoId && 
    music.isPlaying;

  // CD 클릭 핸들러
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoId) return;
    
    if (music.videoId !== videoId) {
      // 다른 곡이면 변경 후 재생
      music.setTrack(videoId);
      music.play();
    } else {
      // 같은 곡이면 토글
      music.toggle();
    }
  };

  if (!videoId) return <div className="p-4 bg-red-100 rounded">Invalid YouTube URL</div>;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
       {/* CD Visual */}
       <div 
          onClick={handleClick}
          className={`
            w-48 h-48 rounded-full shadow-2xl relative cursor-pointer group 
            transition-transform duration-500 ease-out
            ${isThisTrackPlaying ? 'scale-110' : 'hover:scale-105'}
          `}
       >
          {/* Album Art Container with Spin Animation */}
          <div 
            className={`w-full h-full rounded-full overflow-hidden relative shadow-md ${isThisTrackPlaying ? 'animate-spin-slow' : 'paused-animation'}`}
            style={{ 
                animationDuration: '4s',
                backgroundColor: 'var(--cd-disc-color, #1e293b)'
            }}
          >
             <img 
                src={data.imageUrl} 
                alt="album art" 
                className="w-full h-full object-cover"
                onError={(e) => {
                    const target = e.currentTarget;
                    if (videoId) {
                        target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    }
                }}
             />
             
             {/* Glossy Plastic Overlay */}
             <div className="gloss-overlay rounded-full opacity-50"></div>
             
             {/* Inner hole */}
             <div className="absolute inset-[40%] rounded-full" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}></div>
          </div>

          {/* Center Hole / Label */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center z-10"
            style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
          >
              <div className="w-3 h-3 bg-white/80 rounded-full shadow-sm"></div>
          </div>

          {/* Pause/Play Overlay (only on hover) */}
          <div className={`absolute inset-0 rounded-full bg-black/20 flex items-center justify-center transition-opacity z-20 ${isThisTrackPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {isThisTrackPlaying ? (
                   <svg className="w-12 h-12 text-white fill-current drop-shadow-md" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                   <svg className="w-12 h-12 text-white fill-current drop-shadow-md ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
          </div>
       </div>

       {/* Handwritten Title Tag */}
       <div className={`
          absolute -bottom-10 left-1/2 -translate-x-1/2 
          bg-[#fffdf5] text-pencil border border-slate-300
          px-4 py-1.5 rounded-sm shadow-md rotate-[-2deg]
          font-handwriting text-xl tracking-tight whitespace-nowrap 
          transition-opacity z-10
          ${isThisTrackPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
       `}>
          🎵 {data.title.substring(0, 20)}...
       </div>
    </div>
  );
};

export default MusicCdObject;
