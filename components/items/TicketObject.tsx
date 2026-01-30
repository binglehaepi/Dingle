import React from 'react';
import { ScrapMetadata } from '../../types';

interface TicketObjectProps {
  data: ScrapMetadata;
}

const TicketObject: React.FC<TicketObjectProps> = ({ data }) => {
  const { ticketConfig } = data;

  return (
    <div className="w-[300px] flex drop-shadow-2xl relative group hover:scale-[1.02] transition-transform">
        {/* Main Ticket Area */}
        <div className="flex-1 bg-[#fffdf5] rounded-l-lg relative overflow-hidden border-t border-b border-l border-slate-200">
             {/* Poster Background with Blend Mode */}
             <div className="absolute inset-0 z-0">
                <img src={data.imageUrl} alt="poster" className="w-full h-full object-cover grayscale opacity-30 mix-blend-multiply" />
                <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay"></div>
             </div>
             
             {/* Texture */}
             <div className="texture-overlay opacity-50"></div>

             {/* Content */}
             <div className="relative z-10 p-4 flex flex-col h-full justify-between">
                <div>
                    <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">CINEMA TICKET</div>
                    <h2 className="font-serif font-black text-2xl text-slate-800 leading-none mb-1">{data.title}</h2>
                    <p className="font-handwriting text-slate-600 text-lg">{data.subtitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 border-t border-slate-800/20 pt-2">
                    <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-bold">DATE</span>
                        <span className="font-mono text-sm font-bold text-slate-800">{ticketConfig?.date}</span>
                    </div>
                    <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-bold">TIME</span>
                        <span className="font-mono text-sm font-bold text-slate-800">{ticketConfig?.time}</span>
                    </div>
                    <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-bold">CINEMA</span>
                        <span className="font-mono text-xs font-bold text-slate-800 truncate">{ticketConfig?.cinema}</span>
                    </div>
                </div>
             </div>

             {/* Right Edge Perforations (Visual Trick) */}
             <div className="absolute right-0 top-0 bottom-0 w-[4px] border-r-2 border-dashed border-slate-300 z-20"></div>
        </div>

        {/* Stub Area */}
        <div className="w-20 bg-[#f8f5e6] rounded-r-lg border-t border-b border-r border-slate-200 relative flex flex-col justify-center items-center">
            {/* Notch circles */}
            <div className="absolute -left-2 top-0 bottom-0 w-4 flex flex-col justify-between py-1 z-30">
               {[...Array(8)].map((_, i) => (
                   <div key={i} className="w-4 h-4 rounded-full bg-slate-50/0 shadow-inner"></div> // Simplified visual
               ))}
            </div>
            
            {/* Real Notch cutout visual effect with radial gradient mask is hard in pure Tailwind classes, 
                so using a simple border-left dashed on this side to match the main part */}
            <div className="absolute left-0 top-0 bottom-0 border-l-2 border-dashed border-slate-300 h-full w-full pointer-events-none"></div>

            <div className="rotate-90 whitespace-nowrap">
                <span className="block text-[10px] text-slate-400 font-bold tracking-widest">ADMIT ONE</span>
                <span className="block font-mono text-2xl font-bold text-red-700">{ticketConfig?.seat}</span>
            </div>
        </div>
    </div>
  );
};

export default TicketObject;