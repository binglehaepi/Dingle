import React, { useState } from 'react';
import { ScrapMetadata } from '../../types';

interface TodoWidgetProps {
  data: ScrapMetadata;
  onUpdate: (newData: Partial<ScrapMetadata>) => void;
}

const TodoWidget: React.FC<TodoWidgetProps> = ({ data, onUpdate }) => {
  const [newItem, setNewItem] = useState('');
  const items = data.todoConfig?.items || [];
  const title = data.title || "Checklist";

  const toggleItem = (id: string) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onUpdate({ todoConfig: { items: newItems } });
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const newItems = [...items, { id: crypto.randomUUID(), text: newItem, completed: false }];
    onUpdate({ todoConfig: { items: newItems } });
    setNewItem('');
  };

  const deleteItem = (id: string) => {
      const newItems = items.filter(i => i.id !== id);
      onUpdate({ todoConfig: { items: newItems } });
  };

  return (
    <div
      className="w-[220px] border shadow-md p-4 rotate-1 relative"
      style={{
        backgroundColor: 'var(--widget-surface-background, #ffffff)',
        borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
        color: 'var(--text-color-primary, #764737)',
      }}
    >
       {/* Tape */}
       <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 rotate-[-2deg] tape-edge" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}></div>

       <h3
         className="font-handwriting font-bold text-xl border-b-2 border-dashed pb-1 mb-2"
         style={{
           color: 'var(--text-color-primary, #764737)',
           borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
         }}
       >
         {title}
       </h3>
       
       <ul className="space-y-1 mb-2 max-h-[150px] overflow-y-auto scrollbar-hide">
          {items.map(item => (
            <li key={item.id} className="flex items-start gap-2 group/item">
               <button 
                onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
                className={`mt-1 w-3 h-3 border border-slate-400 rounded-sm flex items-center justify-center ${item.completed ? 'bg-slate-700 border-slate-700' : 'bg-transparent'}`}
               >
                 {item.completed && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
               </button>
               <span className={`font-handwriting text-sm flex-1 leading-tight ${item.completed ? 'line-through text-slate-400' : ''}`} style={!item.completed ? { color: 'var(--text-color-primary, #764737)' } : undefined}>
                 {item.text}
               </span>
               <button
                 onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                 className="opacity-0 group-hover/item:opacity-100 px-1"
                 style={{ color: 'var(--ui-danger-bg, #ef4444)' }}
               >
                 ×
               </button>
            </li>
          ))}
       </ul>

       <form onSubmit={addItem} className="relative">
          <input 
            className="w-full bg-transparent border-b outline-none font-handwriting text-sm py-1 pr-4"
            style={{
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              color: 'var(--text-color-primary, #764737)',
            }}
            placeholder="Add item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <button type="submit" className="absolute right-0 top-1 font-bold" style={{ color: 'var(--ui-primary-bg, #3b82f6)' }}>+</button>
       </form>
    </div>
  );
};

export default TodoWidget;