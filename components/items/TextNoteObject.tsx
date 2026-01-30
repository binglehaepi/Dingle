import React, { useState, useEffect, useRef } from 'react';
import { ScrapMetadata } from '../../types';

interface TextNoteObjectProps {
  data: ScrapMetadata;
}

const TextNoteObject: React.FC<TextNoteObjectProps> = ({ data }) => {
  const [text, setText] = useState(data.noteConfig?.text || data.title || "Write something...");
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
        // Move cursor to end
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    // In a real app, we would bubble this up to save to the main state
  };

  // Dynamic font sizing based on length roughly, or fixed.
  // Using user config if available
  const fontSizeClass = data.noteConfig?.fontSize === 'large' ? 'text-4xl' : data.noteConfig?.fontSize === 'small' ? 'text-lg' : 'text-2xl';

  return (
    <div 
        className="min-w-[150px] max-w-[400px] relative group"
        onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
    >
        {isEditing ? (
             <textarea 
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                className={`
                    w-full h-auto min-h-[100px] bg-transparent resize-none border-none outline-none 
                    font-handwriting text-slate-800 ${fontSizeClass} leading-relaxed
                    overflow-hidden p-2 ring-2 ring-purple-200 rounded
                `}
                style={{ height: textareaRef.current ? `${textareaRef.current.scrollHeight}px` : 'auto' }}
             />
        ) : (
            <div className={`
                font-handwriting text-slate-800 ${fontSizeClass} leading-relaxed whitespace-pre-wrap p-2
                mix-blend-multiply opacity-90 cursor-text select-none
                border border-transparent group-hover:border-slate-200/50 rounded transition-colors
            `}>
                {text}
            </div>
        )}
        
        {/* Helper hint on hover */}
        {!isEditing && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Double click to edit
            </div>
        )}
    </div>
  );
};

export default TextNoteObject;