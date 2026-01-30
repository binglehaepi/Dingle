import React, { useState } from 'react';
import { ScrapMetadata } from '../../types';

interface ToploaderObjectProps {
  data: ScrapMetadata;
}

const STICKER_ASSETS = ['🧸', '🎀', '✨', '💖', '🐰', '🍒', '🦋', '🍀', '👑'];

const ToploaderObject: React.FC<ToploaderObjectProps> = ({ data }) => {
  const [stickers, setStickers] = useState(data.toploaderConfig?.stickers || []);

  const addSticker = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newSticker = {
      id: crypto.randomUUID(),
      x: Math.random() * 60 + 20, // 20% to 80%
      y: Math.random() * 60 + 20,
      emoji: STICKER_ASSETS[Math.floor(Math.random() * STICKER_ASSETS.length)],
      rotation: Math.random() * 45 - 22.5
    };
    setStickers([...stickers, newSticker]);
  };

  return (
    <div className="relative group w-[260px]">
      {/* Toploader Frame (Hard Plastic Look) */}
      <div className="bg-white/40 backdrop-blur-sm p-4 rounded-xl shadow-xl border-4 border-white/60 relative overflow-hidden">
        
        {/* 1. LAYER BOTTOM: Photo */}
        <div className="w-full aspect-[3/4] bg-slate-200 rounded-lg overflow-hidden shadow-inner relative z-0">
          {data.imageUrl ? (
            <img src={data.imageUrl} alt="photocard" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">No Photo</div>
          )}
        </div>

        {/* 2. LAYER MIDDLE: Plastic Texture Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none rounded-xl">
            {/* Glossy Reflection (Diagonal) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-60"></div>
            
            {/* Hard Plastic Edge Highlight */}
            <div className="absolute inset-0 border-[1px] border-white/80 rounded-xl"></div>
            
            {/* Scratches / Dust Texture */}
            <div className="texture-overlay opacity-20 mix-blend-screen"></div>

            {/* Holographic Sheen (Subtle rainbow) */}
            <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 mix-blend-color-dodge"></div>
        </div>

        {/* 3. LAYER TOP: Stickers */}
        <div className="absolute inset-0 z-20 overflow-hidden rounded-xl pointer-events-none">
          {stickers.map(sticker => (
            <div 
              key={sticker.id}
              className="absolute text-4xl drop-shadow-md filter"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`
              }}
            >
              {sticker.emoji}
            </div>
          ))}
        </div>

        {/* Chain Hole (Top Center) */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-200/80 rounded-full border-2 border-white shadow-sm z-30 flex items-center justify-center">
             <div className="w-2 h-2 bg-slate-800/20 rounded-full"></div>
        </div>
        
        {/* Ball Chain Visual */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[2px] h-16 bg-gradient-to-b from-slate-300 to-slate-400 z-0"></div>
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-24 h-12 border-t-[2px] border-slate-300 rounded-t-full z-0"></div>

      </div>

      {/* Controls */}
      <div className="absolute -right-12 top-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={addSticker}
          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-xl hover:scale-110 transition-transform"
          title="Add Sticker"
        >
          ✨
        </button>
      </div>

      <div className="text-center mt-2">
        <span className="bg-white/80 backdrop-blur px-2 py-1 rounded text-xs font-handwriting text-slate-500">{data.title}</span>
      </div>
    </div>
  );
};

export default ToploaderObject;