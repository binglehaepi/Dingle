import React, { useState } from 'react';
import { ScrapMetadata } from '../../types';

interface FashionTagProps {
  data: ScrapMetadata;
}

const FashionTag: React.FC<FashionTagProps> = ({ data }) => {
  const [isTransparent, setIsTransparent] = useState(false);
  const { fashionConfig } = data;

  return (
    <div className="relative pt-8 group w-[220px]">
        {/* --- Safety Pin (SVG) --- */}
        {/* Positioned absolutely to look like it's pinning the tag */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-16 h-12 pointer-events-none drop-shadow-md">
            <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Back part of pin (behind tag) */}
                <path d="M10 20 L90 10" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
                {/* Front part (Clasp and needle) */}
                <path d="M10 20 C0 20 0 40 10 40 L80 50" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                {/* Clasp Head */}
                <path d="M80 45 L90 55 L95 45 L85 35 Z" fill="#64748b" />
            </svg>
        </div>

        {/* --- The Tag Card --- */}
        <div className="bg-[#e8e4d9] rounded-sm shadow-xl p-4 flex flex-col relative overflow-hidden border-t-4 border-[#d6d1c2]">
            {/* Paper Texture */}
            <div className="texture-overlay opacity-40 mix-blend-multiply"></div>
            
            {/* Punch Hole */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 rounded-full border-2 border-[#d6d1c2] shadow-inner z-10"></div>

            {/* Brand Header */}
            <div className="mt-6 text-center border-b-2 border-slate-800/10 pb-2 mb-2">
                <h3 className="font-serif font-bold text-slate-800 text-lg uppercase tracking-wider">{fashionConfig?.brand || "Brand"}</h3>
            </div>

            {/* Image Area */}
            <div className="relative w-full aspect-[4/5] bg-white mb-2 overflow-hidden border border-slate-200">
                <img 
                    src={data.imageUrl} 
                    alt="Fashion Item" 
                    className={`w-full h-full object-contain transition-all duration-300 ${isTransparent ? 'mix-blend-multiply bg-[#e8e4d9]' : ''}`} 
                />
                
                {/* Blend Mode Toggle (Water drop icon) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsTransparent(!isTransparent); }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-white/50 hover:bg-white text-slate-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    title="Toggle Transparent Background (Multiply)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 00-.556-.144h-3.554a1 1 0 00-.556.144A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Info Details */}
            <div className="text-center">
                <p className="font-sans text-[10px] text-slate-500 uppercase tracking-widest mb-1">{data.title}</p>
                {fashionConfig?.size && (
                     <span className="inline-block border border-slate-400 px-2 py-0.5 text-[10px] font-bold text-slate-600 rounded-full mb-2">
                        SIZE: {fashionConfig.size}
                     </span>
                )}
            </div>

            {/* Price & Barcode Section */}
            <div className="mt-auto pt-3 border-t-2 border-dashed border-slate-300">
                <div className="flex justify-between items-end">
                    <div className="text-left">
                        <span className="block text-[9px] font-bold text-slate-400">PRICE</span>
                        <span className="font-mono text-xl font-bold text-slate-800">{fashionConfig?.price}</span>
                    </div>
                    {/* Barcode Font Render */}
                    <div className="text-right opacity-80">
                        <span className="font-barcode text-4xl text-slate-800 select-none">
                            {fashionConfig?.price ? fashionConfig.price.replace(/[^0-9]/g, '').substring(0,6) : '123456'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default FashionTag;