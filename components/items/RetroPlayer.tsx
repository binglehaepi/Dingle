import React, { useState } from 'react';
import { ScrapMetadata } from '../../types';

interface RetroPlayerProps {
  data: ScrapMetadata;
}

const RetroPlayer: React.FC<RetroPlayerProps> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="w-80 h-48 bg-orange-100 rounded-3xl shadow-xl border-4 border-orange-300 flex flex-col relative overflow-hidden">
        {/* Tape Window */}
        <div className="mx-6 mt-6 mb-2 bg-slate-800 rounded-lg h-24 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 flex gap-12 items-center justify-center opacity-80">
                <div className={`w-12 h-12 rounded-full border-4 border-white border-dashed ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}></div>
                <div className={`w-12 h-12 rounded-full border-4 border-white border-dashed ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}></div>
            </div>
            {/* Tape Label */}
            <div className="absolute bottom-2 bg-white/90 px-3 py-1 rounded text-[10px] font-mono tracking-tighter text-black w-3/4 text-center truncate">
                {data.title} - MIX
            </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 items-center p-2">
            <button 
                onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                className="w-10 h-10 rounded-full bg-orange-400 hover:bg-orange-500 shadow-inner flex items-center justify-center text-white transition-colors"
            >
                {isPlaying ? (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
            </button>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-orange-800 truncate w-32">{data.title}</span>
                <span className="text-[10px] text-orange-600 truncate w-32">{data.subtitle}</span>
            </div>
        </div>

        {/* Texture */}
        <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none"></div>
    </div>
  );
};

export default RetroPlayer;
