import React from 'react';
import { ScrapMetadata } from '../../types';

interface BoardingPassObjectProps {
  data: ScrapMetadata;
}

const BoardingPassObject: React.FC<BoardingPassObjectProps> = ({ data }) => {
  const { boardingConfig } = data;
  const headerColor = boardingConfig?.color || '#3b82f6';

  return (
    <div className="w-[380px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col relative group">
       {/* Texture */}
       <div className="texture-overlay opacity-20"></div>
       
       {/* Header Stripe */}
       <div className="h-3 w-full" style={{ backgroundColor: headerColor }}></div>
       
       <div className="flex h-40">
           {/* Left Info Section */}
           <div className="flex-1 p-4 relative">
               <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: headerColor }}>
                           ✈
                       </div>
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Boarding Pass</span>
                   </div>
                   <span className="text-xs font-mono text-slate-400">{boardingConfig?.date}</span>
               </div>

               <div className="flex justify-between items-center mb-1">
                   <div className="text-center">
                       <span className="block text-4xl font-black text-slate-800 leading-none">{boardingConfig?.from}</span>
                       <span className="text-[10px] text-slate-400 font-bold">SEOUL</span>
                   </div>
                   <div className="text-slate-300 text-xl">✈</div>
                   <div className="text-center">
                       <span className="block text-4xl font-black text-slate-800 leading-none">{boardingConfig?.to}</span>
                       <span className="text-[10px] text-slate-400 font-bold">DESTINATION</span>
                   </div>
               </div>
               
               <div className="flex justify-between mt-4 border-t border-dashed border-slate-200 pt-2">
                   <div>
                       <span className="block text-[9px] text-slate-400 uppercase">FLIGHT</span>
                       <span className="block text-sm font-bold text-slate-700">{boardingConfig?.flight}</span>
                   </div>
                   <div>
                       <span className="block text-[9px] text-slate-400 uppercase">GATE</span>
                       <span className="block text-sm font-bold text-slate-700">{boardingConfig?.gate}</span>
                   </div>
                   <div>
                       <span className="block text-[9px] text-slate-400 uppercase">SEAT</span>
                       <span className="block text-sm font-bold text-slate-700">{boardingConfig?.seat}</span>
                   </div>
               </div>
           </div>

           {/* Perforation Line */}
           <div className="w-[1px] border-l-2 border-dashed border-slate-300 relative my-2">
               <div className="absolute -top-3 -left-[5px] w-3 h-3 bg-slate-50 rounded-full"></div>
               <div className="absolute -bottom-3 -left-[5px] w-3 h-3 bg-slate-50 rounded-full"></div>
           </div>

           {/* Right Barcode Section */}
           <div className="w-24 p-2 flex flex-col justify-center items-center bg-slate-50">
               <span className="font-barcode text-4xl text-slate-800 origin-center rotate-90 whitespace-nowrap mt-4 opacity-80">
                   {boardingConfig?.flight} {boardingConfig?.seat}
               </span>
           </div>
       </div>
    </div>
  );
};

export default BoardingPassObject;