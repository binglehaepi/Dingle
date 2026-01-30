import React from 'react';
import { ScrapMetadata } from '../../types';

interface BookObjectProps {
  data: ScrapMetadata;
}

const BookObject: React.FC<BookObjectProps> = ({ data }) => {
  return (
    <div className="relative group perspective-1000 w-48 h-72 cursor-pointer">
      {/* 3D Book Container */}
      <div className="relative w-full h-full transform-style-3d transition-transform duration-500 group-hover:rotate-y-[-20deg]">
        
        {/* Front Cover */}
        <div className="absolute inset-0 bg-[#f8f5e6] rounded-r-md shadow-2xl backface-hidden z-20 flex flex-col overflow-hidden border-l-4 border-l-black/10">
            <img src={data.imageUrl} alt="cover" className="w-full h-3/4 object-cover" />
            
            <div className="absolute bottom-0 w-full h-1/4 bg-[#f8f5e6] p-3 flex flex-col justify-center border-t border-black/5">
                <h3 className="text-pencil font-serif font-bold text-lg leading-none line-clamp-2">{data.title}</h3>
                <p className="text-slate-500 text-xs mt-1 font-serif italic">{data.subtitle}</p>
            </div>

            {/* Paper Texture Overlay */}
            <div className="texture-overlay opacity-40"></div>
            
            {/* Glossy sheen */}
            <div className="gloss-overlay opacity-30"></div>
        </div>

        {/* Side (Spine) - Simulated */}
        <div className="absolute top-0 left-0 w-8 h-full bg-[#eaddcf] transform origin-left rotate-y-90 z-10 flex items-center justify-center border-r border-black/5">
            <span className="text-pencil/80 text-xs font-serif tracking-widest rotate-90 whitespace-nowrap overflow-hidden text-ellipsis w-64 text-center font-bold">
                {data.title.substring(0, 25)}
            </span>
        </div>

        {/* Pages (Side View) */}
        <div className="absolute top-1 right-0 w-full h-[98%] bg-white transform translate-z-[-20px] rounded-r-sm shadow-md border-r border-gray-300 bg-[repeating-linear-gradient(90deg,transparent,transparent_1px,#eee_2px)]"></div>
        <div className="absolute top-0 right-0 w-[20px] h-full bg-[#fdfbf7] transform origin-right rotate-y-90 translate-x-[-1px] shadow-inner"></div>

      </div>
    </div>
  );
};

export default BookObject;