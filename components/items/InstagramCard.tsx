import React, { useState } from 'react';
import { InstagramEmbed } from 'react-social-media-embed';
import { ScrapMetadata } from '../../types';

interface InstagramCardProps {
  data: ScrapMetadata;
}

const InstagramCard: React.FC<InstagramCardProps> = ({ data }) => {
  const [isInteractive, setIsInteractive] = useState(false);

  return (
    <div className="w-[328px] bg-white p-3 pt-6 shadow-2xl relative group transform transition-transform">
        {/* Texture Overlay */}
        <div className="texture-overlay"></div>

        {/* Pin Decoration */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none drop-shadow-md">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="12" r="8" fill="var(--ui-danger-bg)" /> {/* Red head */}
                <circle cx="20" cy="12" r="8" fill="url(#grad1)" fillOpacity="0.4" />
                <path d="M20 20 L20 35" stroke="#9ca3af" strokeWidth="2" /> {/* Needle */}
                <defs>
                    <radialGradient id="grad1" cx="0.3" cy="0.3" r="0.7">
                        <stop offset="0%" stopColor="white" />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                </defs>
            </svg>
        </div>

        {/* Drag Overlay */}
        {!isInteractive && (
            <div className="absolute inset-0 z-20 bg-transparent cursor-grab active:cursor-grabbing">
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors"></div>
            </div>
        )}

        {/* Interaction Toggle */}
        <button 
            onClick={(e) => { e.stopPropagation(); setIsInteractive(!isInteractive); }}
            className={`absolute top-2 right-2 z-30 bg-white/90 rounded-full p-1 shadow-sm border border-gray-100 hover:bg-white transition-opacity ${isInteractive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
            {isInteractive ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
            ) : (
                <span className="text-[10px] font-bold text-slate-400 px-1">UNLOCK</span>
            )}
        </button>

        <div className="bg-white">
             <InstagramEmbed url={data.url} width="100%" captioned />
        </div>
    </div>
  );
};

export default InstagramCard;