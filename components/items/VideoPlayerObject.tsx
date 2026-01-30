import React, { useState } from 'react';
import YouTube from 'react-youtube';
import { ScrapMetadata } from '../../types';

interface VideoPlayerObjectProps {
  data: ScrapMetadata;
}

const VideoPlayerObject: React.FC<VideoPlayerObjectProps> = ({ data }) => {
  const [isPlayerActive, setIsPlayerActive] = useState(false);

  const getVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const videoId = getVideoId(data.url);
  const start = data.youtubeConfig?.startTime || 0;

  if (!videoId) return <div className="p-4 bg-red-100 font-handwriting">Invalid</div>;

  return (
    <div className="w-[320px] bg-white shadow-xl relative group rounded-sm overflow-hidden">
      {/* 깔끔한 썸네일 스타일 - 설명 제거 */}
      
      {/* Video Container */}
      <div className="relative w-full aspect-video bg-black overflow-hidden">
        {!isPlayerActive ? (
             /* Thumbnail Facade */
             <div 
                className="absolute inset-0 cursor-pointer group/play"
                onClick={(e) => { e.stopPropagation(); setIsPlayerActive(true); }}
             >
                 <img 
                    src={data.imageUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                    alt={data.title} 
                    className="w-full h-full object-cover opacity-90 group-hover/play:opacity-100 transition-opacity"
                    onError={(e) => {
                        e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    }}
                 />
                 <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/play:bg-black/10 transition-colors">
                     <div className="w-14 h-14 bg-[var(--ui-danger-bg)] rounded-full flex items-center justify-center shadow-xl group-hover/play:scale-110 transition-transform group-hover/play:bg-[var(--ui-danger-hover)]">
                          <svg className="w-7 h-7 text-[var(--ui-danger-text)] fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                     </div>
                 </div>
             </div>
        ) : (
            /* Actual Player */
            <YouTube 
                videoId={videoId}
                opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: {
                        start: start,
                        autoplay: 1, // Auto-play when facade is clicked
                        modestbranding: 1,
                        origin: window.location.origin 
                    }
                }}
                className="w-full h-full"
                iframeClassName="w-full h-full"
            />
        )}
        
      </div>

      {/* 제목만 작게 표시 (선택사항) */}
      {data.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-handwriting text-white text-sm line-clamp-1">{data.title}</h3>
        </div>
      )}
    </div>
  );
};

export default VideoPlayerObject;