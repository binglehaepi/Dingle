import React, { useState, useEffect, useRef } from 'react';
import { ScrapMetadata } from '../../types';

interface TextNoteObjectProps {
  data: ScrapMetadata;
  onDelete?: () => void;
  onUpdate?: (newData: Partial<ScrapMetadata>) => void;
}

const TextNoteObject: React.FC<TextNoteObjectProps> = ({ data, onDelete, onUpdate }) => {
  const [text, setText] = useState(data.noteConfig?.text || "");
  const [isEditing, setIsEditing] = useState(data.noteConfig?.isEditing || false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
        // Move cursor to end
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    // 실시간으로 메타데이터 업데이트
    if (onUpdate) {
      onUpdate({
        noteConfig: {
          ...data.noteConfig,
          text: newText,
          fontSize: data.noteConfig?.fontSize || '14px'
        }
      });
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    // 텍스트가 비어있으면 삭제
    if (!text.trim() && onDelete) {
      onDelete();
      return;
    }
    // isEditing 플래그 제거 (초기 생성용이므로 한번만 사용)
    if (onUpdate && data.noteConfig?.isEditing) {
      onUpdate({
        noteConfig: {
          ...data.noteConfig,
          isEditing: false
        }
      });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('📝 텍스트 노트 클릭 - 편집 모드로 전환');
    setIsEditing(true);
  };

  // Dynamic font sizing based on length roughly, or fixed.
  // Using user config if available
  const fontSize = data.noteConfig?.fontSize || '14px';
  const fontSizeStyle = fontSize.endsWith('px') ? { fontSize } : undefined;
  const fontSizeClass = !fontSizeStyle 
    ? (fontSize === 'large' ? 'text-4xl' : fontSize === 'small' ? 'text-lg' : 'text-base')
    : '';

  return (
    <div 
        className="min-w-[150px] min-h-[24px] relative group cursor-text"
        onClick={handleClick}
    >
        {isEditing ? (
             <textarea 
                ref={textareaRef}
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onBlur={handleBlur}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="텍스트를 입력하세요"
                className={`
                    w-full h-auto min-w-[150px] min-h-[24px] bg-white/90 resize-none
                    border-2 border-blue-400 rounded-lg outline-none shadow-sm
                    ${fontSizeClass} leading-relaxed
                    overflow-hidden p-2
                `}
                style={{ 
                  height: textareaRef.current ? `${Math.max(textareaRef.current.scrollHeight, 24)}px` : '24px',
                  fontFamily: 'var(--app-font, "Noto Sans KR", sans-serif)',
                  color: '#000',
                  caretColor: '#3b82f6',
                  ...fontSizeStyle
                }}
             />
        ) : (
            <div 
              className={`
                ${fontSizeClass} leading-relaxed whitespace-pre-wrap px-1 py-0.5 min-h-[24px]
                cursor-text
                border border-transparent group-hover:border-dashed group-hover:border-slate-300 rounded transition-all
                bg-transparent group-hover:bg-slate-50/30
              `}
              style={{
                fontFamily: 'var(--app-font, "Noto Sans KR", sans-serif)',
                color: 'inherit',
                ...fontSizeStyle
              }}
            >
                {text || "텍스트를 입력하세요"}
            </div>
        )}
    </div>
  );
};

export default TextNoteObject;