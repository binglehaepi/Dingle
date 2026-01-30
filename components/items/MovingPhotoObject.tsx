import React, { useState, useRef } from 'react';
import { ScrapMetadata } from '../../types';

interface MovingPhotoObjectProps {
  data: ScrapMetadata;
}

const MovingPhotoObject: React.FC<MovingPhotoObjectProps> = ({ data }) => {
  const [isEditing, setIsEditing] = useState(data.isEditable);
  const [localData, setLocalData] = useState(data);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (data.videoUrl && videoRef.current) {
        videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (data.videoUrl && videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0; // Reset to start
    }
  };

  const toggleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
  };

  const handleBlur = () => {
      setIsEditing(false);
  };

  return (
    <div 
        className="w-64 bg-paper p-3 pb-8 shadow-xl transform rotate-1 transition-all group relative border-texture-rough border-[3px]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
    >
       {/* Polaroid-style visual */}
       <div className="w-full aspect-square bg-slate-900 mb-4 overflow-hidden relative">
          
          {/* Media Content */}
          {data.videoUrl ? (
             <video 
                ref={videoRef}
                src={data.videoUrl}
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
                // Not using autoPlay to respect the 'Hover to Play' design, 
                // but user can change this behavior easily.
             />
          ) : (
             <img 
                src={localData.imageUrl} 
                alt="moving scrap" 
                className="w-full h-full object-cover" 
                loading="lazy"
             />
          )}

          {/* "LIVE" Indicator Badge */}
          <div className="absolute top-2 right-2 bg-[var(--ui-danger-bg)] text-[var(--ui-danger-text)] opacity-80 text-[9px] font-bold px-1.5 py-0.5 rounded-sm backdrop-blur-sm shadow-sm animate-pulse">
              LIVE
          </div>

          {/* Internal shadow and gloss */}
          <div className="absolute inset-0 shadow-inner pointer-events-none border border-black/10"></div>
          <div className="gloss-overlay opacity-30"></div>
       </div>

       <div className="px-1 text-center min-h-[40px] flex flex-col justify-center gap-1 relative z-10">
         {isEditing ? (
             <>
                <input 
                    className="w-full text-center font-bold font-handwriting text-xl border-b border-slate-300 focus:outline-none focus:border-purple-500 bg-transparent text-pencil"
                    value={localData.title}
                    onChange={e => setLocalData({...localData, title: e.target.value})}
                    placeholder="Title..."
                    autoFocus
                    onBlur={handleBlur}
                />
             </>
         ) : (
             <div onClick={toggleEdit} className="cursor-text group-hover:bg-yellow-50/50 p-1 rounded transition-colors">
                 <h3 className="font-handwriting font-bold text-2xl text-pencil leading-none rotate-[-1deg]">{localData.title || "Untitled"}</h3>
                 <p className="font-handwriting text-xs text-slate-500 mt-1">{localData.subtitle || (data.videoUrl ? "Video Loop" : "GIF")}</p>
             </div>
         )}
       </div>

       {/* Washi Tape Visual */}
       <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-purple-200/80 rotate-[-1deg] shadow-sm backdrop-blur-sm tape-edge opacity-90"></div>
    </div>
  );
};

export default MovingPhotoObject;