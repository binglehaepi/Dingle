import React from 'react';
import { ScrapMetadata } from '../../types';

interface ChatPhoneObjectProps {
  data: ScrapMetadata;
}

const ChatPhoneObject: React.FC<ChatPhoneObjectProps> = ({ data }) => {
  return (
    <div className="w-[300px] relative group">
       {/* Device Frame with Titanium Texture */}
       <div className="bg-texture-titanium rounded-[45px] p-3 shadow-2xl relative border-[6px] border-slate-700/50 ring-1 ring-white/10">
           {/* Metallic Shine Gradient overlay on border */}
           <div className="absolute inset-0 rounded-[39px] pointer-events-none border border-white/10 z-20"></div>
           
           {/* Notch / Dynamic Island */}
           <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-30 flex justify-center items-center shadow-md">
                {/* Camera & Sensor */}
                <div className="w-16 h-full flex items-center justify-end pr-2">
                    <div className="w-2 h-2 bg-[#1a1a1a] rounded-full ring-[0.5px] ring-white/10"></div>
                </div>
           </div>
           
           {/* Side Buttons (Simulated with shadows) */}
           <div className="absolute top-24 -left-[9px] w-[3px] h-8 bg-slate-600 rounded-l-md"></div>
           <div className="absolute top-36 -left-[9px] w-[3px] h-14 bg-slate-600 rounded-l-md"></div>
           <div className="absolute top-36 -right-[9px] w-[3px] h-20 bg-slate-600 rounded-r-md"></div>

           {/* Screen Container */}
           {/* stopPropagation on pointerDown allows interacting with the screen (scroll) without dragging the parent container */}
           <div 
             className="w-full h-[580px] bg-white rounded-[35px] overflow-hidden relative cursor-auto shadow-inner"
             onPointerDown={(e) => e.stopPropagation()} 
           >
              {/* Internal Scroll Area */}
              <div className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 scrollbar-track-transparent">
                 {/* Use img tag for the screenshot */}
                 {data.imageUrl ? (
                    <img src={data.imageUrl} alt="Chat Log" className="w-full h-auto block min-h-full object-cover object-top" />
                 ) : (
                    <div className="flex items-center justify-center h-full text-slate-300 flex-col gap-2">
                        <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs">No Image</span>
                    </div>
                 )}
              </div>
              
              {/* Status Bar Fake Overlay */}
              <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-white/95 via-white/80 to-transparent pointer-events-none z-10 flex justify-between px-8 pt-3.5 text-[12px] font-bold text-slate-900 tracking-wide">
                  <span>9:41</span>
                  <div className="flex gap-1.5 opacity-90 items-center">
                     <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21L24 9C24 9 18.6 2 12 2C5.4 2 0 9 0 9L12 21Z"/></svg>
                     <svg className="w-5 h-3" fill="currentColor" viewBox="0 0 24 12"><path d="M22 4h-2v4h2V4zm0-2a2 2 0 012 2v6a2 2 0 01-2 2h-2v-2h-2v2H4a2 2 0 01-2-2V4a2 2 0 012-2h16V0h2v2z"/></svg>
                  </div>
              </div>
              
              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/80 rounded-full z-10 pointer-events-none"></div>
           </div>
       </div>
    </div>
  );
};

export default ChatPhoneObject;