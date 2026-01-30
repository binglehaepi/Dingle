import React, { useState } from 'react';

interface FreeLayoutProps {
  currentDate: Date;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  isStaticPage?: boolean;
  snapToGrid?: boolean;
  onToggleGrid?: () => void;
}

const FreeLayout: React.FC<FreeLayoutProps> = ({ currentDate, onPrevDay, onNextDay, isStaticPage = false, snapToGrid = false, onToggleGrid }) => {
  const yyyy = currentDate.getFullYear();
  const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
  const dd = String(currentDate.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}.${mm}.${dd}`;

  return (
    <>
      {/* Left Page */}
      <div className={`flex-1 border-r border-slate-300 relative flex flex-col`} style={{ backgroundColor: 'transparent', backgroundImage: 'none' }}>
          {/* Header Date */}
          <div className="p-5 pb-2 border-b border-dashed border-slate-300/50 flex items-center justify-between z-20 relative h-14">
              <div className="font-handwriting font-bold text-stone-600 text-base">
                  {isStaticPage ? "MY SCRAPBOOK" : dateStr}
              </div>
          </div>
          
          {/* Footer Nav */}
          <div className="mt-auto p-4 flex justify-start z-50">
             {!isStaticPage && onPrevDay && (
               <button onClick={onPrevDay} className="flex items-center gap-1 text-stone-400 hover:text-stone-700 font-bold text-xs transition-colors px-2 py-1 hover:bg-stone-100 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  PREV
              </button>
             )}
          </div>
      </div>

      {/* Right Page */}
      <div className={`flex-1 relative flex flex-col`} style={{ backgroundColor: 'transparent', backgroundImage: 'none' }}>
           {/* Header Space (Empty to make room for UrlInput) */}
           <div className="p-5 pb-2 border-b border-dashed border-slate-300/50 flex justify-end items-center z-20 relative h-14">
               {/* URL Input sits here absolutely from App.tsx */}
               {isStaticPage && (
                  <div className="mr-60 font-handwriting text-stone-400 text-sm tracking-widest opacity-50">
                      ETERNAL COLLECTION
                  </div>
               )}
           </div>

           {/* Footer Nav */}
           <div className="mt-auto p-4 flex justify-end items-center gap-4 z-50">
               <div className="text-stone-300 font-mono text-[10px] tracking-widest">
                   {isStaticPage ? "∞" : `NO. ${currentDate.getDate()}`}
               </div>
               {!isStaticPage && onNextDay && (
                 <button onClick={onNextDay} className="flex items-center gap-1 text-stone-400 hover:text-stone-700 font-bold text-xs transition-colors px-2 py-1 hover:bg-stone-100 rounded">
                     NEXT
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                     </svg>
                 </button>
               )}
           </div>
      </div>
    </>
  );
};

export default FreeLayout;