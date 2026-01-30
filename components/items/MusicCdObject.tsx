import React, { useState, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { ScrapMetadata } from '../../types';

interface MusicCdObjectProps {
  data: ScrapMetadata;
}

const MusicCdObject: React.FC<MusicCdObjectProps> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);

  const getVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const videoId = getVideoId(data.url);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    // 1: Playing, 2: Paused, 0: Ended
    if (event.data === 1) {
        setIsPlaying(true);
    } else if (event.data === 2 || event.data === 0) {
        setIsPlaying(false);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!playerRef.current) return;
      
      // If player exists, toggle state
      if (isPlaying) {
          playerRef.current.pauseVideo();
      } else {
          playerRef.current.playVideo();
      }
  };

  if (!videoId) return <div className="p-4 bg-red-100 rounded">Invalid YouTube URL</div>;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
       {/* 1. Tiny Hidden YouTube Player (Behind the CD) */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 overflow-hidden opacity-0 pointer-events-none -z-10">
           <YouTube 
                videoId={videoId} 
                opts={{ 
                    height: '1', 
                    width: '1', 
                    playerVars: { 
                        autoplay: 0, 
                        controls: 0,
                        playsinline: 1 
                    } 
                }}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
           />
       </div>

       {/* 2. The CD Visual (이중 테두리 제거: border-2 제거) */}
       <div 
          onClick={togglePlay}
          className={`
            w-48 h-48 rounded-full shadow-2xl relative cursor-pointer group 
            transition-transform duration-500 ease-out
            ${isPlaying ? 'scale-110' : 'hover:scale-105'}
          `}
       >
          {/* Album Art Container with Spin Animation (border 제거) */}
          <div 
            className={`w-full h-full rounded-full overflow-hidden relative shadow-md ${isPlaying ? 'animate-spin-slow' : 'paused-animation'}`}
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
             
             {/* CLEAN LOOK: Glossy Plastic Overlay (border 제거) */}
             <div className="gloss-overlay rounded-full opacity-50"></div>
             
             {/* Inner hole: inset box-shadow로 변경 (border 제거) */}
             <div className="absolute inset-[40%] rounded-full" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}></div>
          </div>

          {/* Center Hole / Label (border 제거, box-shadow 사용) */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center z-10"
            style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
          >
              <div className="w-3 h-3 bg-white/80 rounded-full shadow-sm"></div>
          </div>

          {/* Pause/Play Overlay (only on hover) */}
          <div className={`absolute inset-0 rounded-full bg-black/20 flex items-center justify-center transition-opacity z-20 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {isPlaying ? (
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
          ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
       `}>
          🎵 {data.title.substring(0, 20)}...
       </div>
    </div>
  );
};

export default MusicCdObject;