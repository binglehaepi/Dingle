import React, { useRef, useState } from 'react';
import { ScrapMetadata } from '../../types';

interface CupSleeveObjectProps {
  data: ScrapMetadata;
}

const CupSleeveObject: React.FC<CupSleeveObjectProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element.
    const width = rect.width;
    
    // Calculate rotation between -30deg and 30deg based on mouse X
    const rotateY = ((x / width) - 0.5) * 60;
    setRotation(rotateY);
  };

  const handleMouseLeave = () => {
    setRotation(0);
  };

  return (
    <div 
      className="w-[280px] h-[340px] flex items-center justify-center perspective-1000 group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
        <div 
          ref={containerRef}
          className="relative w-48 h-64 transition-transform duration-100 ease-out preserve-3d"
          style={{ transform: `rotateY(${rotation}deg)` }}
        >
            {/* The Cup (White Paper Cup) */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-white to-slate-200 rounded-b-[40px] rounded-t-[10px] shadow-2xl">
                 {/* Cup Rim */}
                 <div className="absolute -top-4 left-0 right-0 h-8 bg-slate-50 border border-slate-200 rounded-[50%] shadow-sm z-10"></div>
                 {/* Lid Shadow inside rim */}
                 <div className="absolute -top-3 left-1 right-1 h-6 bg-slate-200 rounded-[50%] blur-[2px] z-0"></div>
            </div>

            {/* The Sleeve (Cylindrical Mapping) */}
            {/* We create a slightly wider container for the sleeve */}
            <div className="absolute top-12 bottom-16 -left-1 -right-1 bg-white shadow-md transform-style-3d overflow-hidden rounded-[2px]">
                 {/* User Image mapped as texture */}
                 <div className="absolute inset-0 bg-slate-800">
                    <img 
                        src={data.imageUrl} 
                        alt="sleeve" 
                        className="w-full h-full object-cover" 
                        style={{ transform: `scaleX(1.2)` }} // Stretch slightly to account for curve
                    />
                 </div>

                 {/* Lighting / Shadow Overlay to sell the cylinder effect */}
                 <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none mix-blend-multiply"></div>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none mix-blend-overlay"></div>
                 
                 {/* Event Info Overlay */}
                 <div className="absolute bottom-2 right-2 text-right">
                    <p className="text-[10px] text-white font-bold drop-shadow-md bg-black/20 px-1 inline-block backdrop-blur-sm">
                        {data.cupSleeveConfig?.cafeName || "Birthday Cafe"}
                    </p>
                    <p className="text-[8px] text-white/90 drop-shadow-md">
                        {data.cupSleeveConfig?.eventDate}
                    </p>
                 </div>
            </div>

            {/* Reflection on the Cup itself (below sleeve) */}
            <div className="absolute bottom-4 left-0 right-0 h-10 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50 z-20"></div>

        </div>
        
        {/* Floating Tag */}
        <div className="absolute -bottom-8 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm text-xs font-handwriting text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
            🥤 {data.title}
        </div>
    </div>
  );
};

export default CupSleeveObject;