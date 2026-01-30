import React from 'react';
import { ScrapItem, LayoutTextData } from '../../types';

interface WeeklySpreadProps {
  currentDate: Date;
  items: ScrapItem[];
  textData: LayoutTextData;
  onUpdateText: (key: string, field: 'goals' | 'important' | 'memo' | 'coverImage', value: string) => void;
}

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- Mini Calendar Component ---
const MiniCalendar = ({ currentDate, weekStart, goals, onUpdateGoals }: { currentDate: Date, weekStart: Date, goals: string, onUpdateGoals: (v: string) => void }) => {
    const year = weekStart.getFullYear();
    const month = weekStart.getMonth();
    
    // Generate Calendar Grid
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create array for grid: empty slots + days
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    // Identify this week's dates for highlighting
    const weekDates = new Set();
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        if (d.getMonth() === month) {
            weekDates.add(d.getDate());
        }
    }

    return (
        <div
          data-ui="panel"
          data-tone="white"
          className="w-full h-full p-4 flex flex-col relative bg-transparent backdrop-blur-sm border-r border-b border-dashed border-slate-300/60"
          style={{ backgroundColor: 'var(--widget-surface-background, #ffffff)' }}
        >
            {/* Month Header */}
            <div className="text-center font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest text-xs">
                {weekStart.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-[9px] font-mono text-center text-slate-400 mb-4">
                {['S','M','T','W','T','F','S'].map((d, i) => <div key={`${d}-${i}`} className="font-bold text-slate-600">{d}</div>)}
                {days.map((day, i) => {
                    const isWeek = day && weekDates.has(day);
                    return (
                        <div key={i} className={`aspect-square flex items-center justify-center rounded-sm ${isWeek ? 'bg-purple-200 text-purple-900 font-bold' : ''}`}>
                            {day}
                        </div>
                    );
                })}
            </div>

            {/* Weekly Goal Input */}
            <div className="flex-1 flex flex-col border-t-2 border-slate-300/30 pt-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Weekly Goal</span>
                 <textarea 
                    className="w-full h-full bg-transparent resize-none font-handwriting text-slate-700 text-sm leading-5 focus:outline-none"
                    placeholder="- Goal 1..."
                    value={goals || ''}
                    onChange={(e) => onUpdateGoals(e.target.value)}
                 />
            </div>
            
            {/* Tape Decoration */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-purple-100/80 rotate-1 shadow-sm backdrop-blur-sm z-10 tape-edge opacity-80"></div>
        </div>
    );
};

// --- Square Day Component ---
const DaySquare = ({ date, dayItems, isBorderRight, isBorderBottom }: { date: Date, dayItems: ScrapItem[], isBorderRight: boolean, isBorderBottom: boolean }) => {
    const isToday = formatDate(new Date()) === formatDate(date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const dayNum = date.getDate();

    return (
      <div
        data-ui="panel"
        data-tone="white"
        className={`relative flex flex-col p-3 group h-full bg-transparent backdrop-blur-[1px]
        ${isBorderRight ? 'border-r border-dashed border-slate-300/60' : ''}
        ${isBorderBottom ? 'border-b border-dashed border-slate-300/60' : ''}
      `}
        style={{ backgroundColor: 'var(--widget-surface-background, #ffffff)' }}
      >
           {/* Header */}
           <div className={`flex justify-between items-end border-b-2 border-slate-300/30 pb-1 mb-2 ${isToday ? 'bg-yellow-50/50 rounded px-1 -mx-1' : ''}`}>
               <span
                  className={`font-handwriting font-bold text-sm ${date.getDay() === 0 ? '' : 'text-slate-600'}`}
                  style={date.getDay() === 0 ? { color: 'var(--ui-sunday-text, var(--ui-danger-bg))' } : undefined}
               >
                  {dayName}
               </span>
               <span className="font-mono text-slate-400 text-xs font-bold">{dayNum}</span>
           </div>

           {/* Content Area */}
           <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide relative">
               {/* Items List */}
               <div className="flex flex-col gap-2">
                   {dayItems.length === 0 && (
                       <div className="mt-4 text-center opacity-30 text-[10px] font-handwriting rotate-[-2deg] text-slate-500">
                           No plans...
                       </div>
                   )}
                   {dayItems.map(item => (
                       <div key={item.id} className="bg-white/90 p-1.5 rounded-sm border border-slate-200/80 shadow-sm flex gap-2 items-center hover:scale-1.02 transition-transform cursor-pointer">
                           {item.metadata.imageUrl && (
                               <div className="w-8 h-8 flex-shrink-0 bg-slate-100 rounded-sm overflow-hidden border border-slate-100">
                                   <img src={item.metadata.imageUrl} className="w-full h-full object-cover" alt="" />
                               </div>
                           )}
                           <div className="flex-1 min-w-0">
                               <div className="text-[10px] font-bold text-slate-700 truncate leading-tight">{item.metadata.title}</div>
                               <div className="text-[8px] text-slate-400 truncate leading-tight">{item.metadata.subtitle || item.type}</div>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
      </div>
    );
};

const WeeklySpread: React.FC<WeeklySpreadProps> = ({ currentDate, items, textData, onUpdateText }) => {
  // Calculate start of week (Sunday)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
  // Week Key for saving data
  const weekNum = Math.ceil((startOfWeek.getDate() - 1 - startOfWeek.getDay()) / 7);
  const weekKey = `${startOfWeek.getFullYear()}-W${weekNum}-${startOfWeek.getMonth()}`;
  const currentTextData = textData[weekKey] || {};

  // Generate 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const getItemsForDay = (date: Date) => {
      const dateStr = formatDate(date);
      return items.filter(i => i.diaryDate === dateStr);
  };

  return (
    <>
      {/* --- Left Page (Mini Calendar + Sun + Mon + Tue) = 2x2 Grid --- */}
      <div className="flex-1 border-r border-slate-300 relative p-6" style={{ backgroundColor: 'transparent', backgroundImage: 'none' }}>
         <div className="w-full h-full border border-slate-300/60 rounded-lg overflow-hidden shadow-sm bg-transparent">
             <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                 {/* Slot 1: Mini Calendar */}
                 <MiniCalendar 
                    currentDate={currentDate} 
                    weekStart={startOfWeek} 
                    goals={currentTextData.goals || ''}
                    onUpdateGoals={(v) => onUpdateText(weekKey, 'goals', v)}
                 />
                 
                 {/* Slot 2: Sunday (Day 0) */}
                 <DaySquare 
                    date={weekDays[0]} 
                    dayItems={getItemsForDay(weekDays[0])} 
                    isBorderRight={false} 
                    isBorderBottom={true} 
                 />

                 {/* Slot 3: Monday (Day 1) */}
                 <DaySquare 
                    date={weekDays[1]} 
                    dayItems={getItemsForDay(weekDays[1])} 
                    isBorderRight={true} 
                    isBorderBottom={false} 
                 />

                 {/* Slot 4: Tuesday (Day 2) */}
                 <DaySquare 
                    date={weekDays[2]} 
                    dayItems={getItemsForDay(weekDays[2])} 
                    isBorderRight={false} 
                    isBorderBottom={false} 
                 />
             </div>
         </div>
      </div>

      {/* --- Right Page (Wed + Thu + Fri + Sat) = 2x2 Grid --- */}
      <div className="flex-1 relative p-6" style={{ backgroundColor: 'transparent', backgroundImage: 'none' }}>
          <div className="w-full h-full border border-slate-300/60 rounded-lg overflow-hidden shadow-sm bg-transparent">
              <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                 {/* Slot 5: Wednesday (Day 3) */}
                 <DaySquare 
                    date={weekDays[3]} 
                    dayItems={getItemsForDay(weekDays[3])} 
                    isBorderRight={true} 
                    isBorderBottom={true} 
                 />

                 {/* Slot 6: Thursday (Day 4) */}
                 <DaySquare 
                    date={weekDays[4]} 
                    dayItems={getItemsForDay(weekDays[4])} 
                    isBorderRight={false} 
                    isBorderBottom={true} 
                 />

                 {/* Slot 7: Friday (Day 5) */}
                 <DaySquare 
                    date={weekDays[5]} 
                    dayItems={getItemsForDay(weekDays[5])} 
                    isBorderRight={true} 
                    isBorderBottom={false} 
                 />

                 {/* Slot 8: Saturday (Day 6) */}
                 <DaySquare 
                    date={weekDays[6]} 
                    dayItems={getItemsForDay(weekDays[6])} 
                    isBorderRight={false} 
                    isBorderBottom={false} 
                 />
             </div>
          </div>
      </div>
    </>
  );
};

export default WeeklySpread;