import React, { useState, useEffect, useRef } from 'react';
import { ScrapMetadata } from '../../types';

interface TextNoteObjectProps {
  data: ScrapMetadata;
  onDelete?: () => void;
  onUpdate?: (newData: Partial<ScrapMetadata>) => void;
}

// 포토샵 스타일 상수
const TEXT_STYLES = {
  editBg: 'rgba(255, 252, 247, 0.95)',
  editBorder: '1px solid rgba(212, 197, 185, 0.5)',
  editFocusBorder: '2px solid #E89BA3',
  readBg: 'transparent',
  readBorder: 'none',  // 완전히 투명
  padding: '12px',
  fontSize: '14px',
  lineHeight: '1.8',
  minWidth: '100px',
  minHeight: '40px',
};

const TextNoteObject: React.FC<TextNoteObjectProps> = ({ data, onDelete, onUpdate }) => {
  const [text, setText] = useState(data.noteConfig?.text || "");
  const [isEditing, setIsEditing] = useState(data.noteConfig?.isEditing || false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
        // Move cursor to end
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const handleTextChange = (newText: string) => {
    setText(newText);
    
    // 0.5초 debounce로 자동 저장
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = setTimeout(() => {
      if (onUpdate) {
        onUpdate({
          noteConfig: {
            ...data.noteConfig,
            text: newText,
            fontSize: data.noteConfig?.fontSize || '14px',
            isEditing: false,
          }
        });
      }
    }, 500);
  };

  const handleBlur = () => {
    setIsEditing(false);
    // 빈 텍스트도 저장 가능 (삭제는 × 버튼으로만)
    // isEditing 플래그 제거
    if (onUpdate && data.noteConfig?.isEditing) {
      onUpdate({
        noteConfig: {
          ...data.noteConfig,
          text,
          isEditing: false
        }
      });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  return (
    <div 
        className="w-full h-full cursor-text"
        onClick={handleClick}
    >
        {isEditing ? (
             <textarea 
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  const newText = e.target.value;
                  if (newText.length <= 10000) {
                    handleTextChange(newText);
                  }
                }}
                onBlur={handleBlur}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="여기에 메모를 작성하세요..."
                className="w-full h-full resize-none outline-none"
                style={{
                  background: TEXT_STYLES.editBg,
                  border: TEXT_STYLES.editBorder,
                  borderRadius: '4px',
                  padding: TEXT_STYLES.padding,
                  fontSize: TEXT_STYLES.fontSize,
                  lineHeight: TEXT_STYLES.lineHeight,
                  fontFamily: 'var(--app-font, "Noto Sans KR", sans-serif)',
                  color: 'var(--text-color-primary, #000)',
                  minWidth: TEXT_STYLES.minWidth,
                  minHeight: TEXT_STYLES.minHeight,
                }}
             />
        ) : (
            <div 
              className="w-full h-full"
              style={{
                background: TEXT_STYLES.readBg,
                border: TEXT_STYLES.readBorder,
                padding: TEXT_STYLES.padding,
                fontSize: TEXT_STYLES.fontSize,
                lineHeight: TEXT_STYLES.lineHeight,
                fontFamily: 'var(--app-font, "Noto Sans KR", sans-serif)',
                color: 'var(--text-color-primary, #000)',
                minWidth: TEXT_STYLES.minWidth,
                minHeight: TEXT_STYLES.minHeight,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
                {text || '텍스트를 입력하세요'}
            </div>
        )}
    </div>
  );
};

export default TextNoteObject;