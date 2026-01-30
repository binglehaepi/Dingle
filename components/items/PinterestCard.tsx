import React, { useState } from 'react';
import { PinterestEmbed } from 'react-social-media-embed';
import { ScrapMetadata } from '../../types';

interface PinterestCardProps {
  data: ScrapMetadata;
}

const PinterestCard: React.FC<PinterestCardProps> = ({ data }) => {
  const [useWidget, setUseWidget] = useState(false);

  // Strategy A: Custom Polaroid/Moodboard UI
  if (!useWidget) {
    return (
      <div className="w-[280px] bg-white p-3 pb-8 shadow-xl relative group transition-transform hover:scale-[1.01] border-texture-rough border-4">
        {/* Decoration: Washi Tape */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-red-100/80 rotate-1 shadow-sm backdrop-blur-sm z-20"></div>

        {/* Image Area */}
        <div className="w-full aspect-[2/3] bg-slate-100 mb-4 overflow-hidden relative rounded-sm border border-slate-100">
          <img src={data.imageUrl} alt={data.title} className="w-full h-full object-cover" />
          {/* Grain overlay for mood */}
          <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none mix-blend-overlay"></div>
        </div>

        {/* Text Area */}
        <div className="text-center px-1">
          <h3 className="font-serif font-bold text-slate-800 leading-tight mb-1">{data.title}</h3>
          <p className="font-handwriting text-slate-500 text-sm">{data.subtitle}</p>
        </div>

        {/* Toggle Button (Hidden unless hovered) */}
        <button 
          onClick={(e) => { e.stopPropagation(); setUseWidget(true); }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1.5 rounded-full shadow border border-gray-100 text-xs font-bold text-red-600 z-30"
          title="Switch to Live Widget"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
        </button>
      </div>
    );
  }

  // Strategy B: Official Widget (Fallback)
  return (
    <div className="w-[280px] bg-white rounded-[32px] overflow-hidden shadow-2xl relative group">
      {/* Drag Overlay for Widget Mode */}
      <div className="absolute inset-0 z-10 bg-transparent cursor-grab active:cursor-grabbing border-4 border-transparent hover:border-red-100/50 rounded-[32px] transition-colors pointer-events-none"></div>
      
      {/* Close/Revert Button */}
      <button 
          onClick={(e) => { e.stopPropagation(); setUseWidget(false); }}
          className="absolute top-4 right-4 z-50 bg-white/90 p-1 rounded-full shadow-md text-slate-400 hover:text-red-500 transition-colors"
          title="Back to Polaroid"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
      </button>

      {/* Embed */}
      <div className="bg-white min-h-[400px]">
        <PinterestEmbed url={data.url} width={280} />
      </div>
    </div>
  );
};

export default PinterestCard;