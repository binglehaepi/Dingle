/**
 * 리사이저 컴포넌트 - 사이드바 너비 조정
 */

import React, { useRef, useState } from 'react';

interface ResizerProps {
  onResize: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
}

const Resizer: React.FC<ResizerProps> = ({ 
  onResize, 
  minWidth = 200, 
  maxWidth = 500 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
    
    // 현재 사이드바 너비 가져오기
    const sidebar = document.querySelector('[data-sidebar]') as HTMLElement;
    if (sidebar) {
      startWidthRef.current = sidebar.offsetWidth;
    }

    // 전역 이벤트 리스너 추가
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // 드래그 중 텍스트 선택 방지
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    const dx = e.clientX - startXRef.current;
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + dx));
    onResize(newWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        width: '4px',
        height: '100vh',
        backgroundColor: isDragging ? '#d4c4b4' : 'transparent',
        cursor: 'ew-resize',
        position: 'relative',
        transition: isDragging ? 'none' : 'background-color 0.2s',
        zIndex: 10,
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = '#e8e4dd';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    />
  );
};

export default Resizer;



