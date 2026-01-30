import React, { ReactNode, useRef, useState, useEffect } from 'react';
import { ScrapItem, PageSide } from '../types';

interface SinglePageViewProps {
  activeSide: PageSide;
  onSideChange: (side: PageSide) => void;
  currentPageItems: ScrapItem[];
  renderItem: (item: ScrapItem) => ReactNode;
  children?: ReactNode; // Layout 컴포넌트 (1400px 기준)
  isDraggingItem?: boolean; // 드래그 중일 때 스와이프 비활성화
  pageOffset: number; // 📐 좌표 오프셋 (배경 슬라이스용)
  scale: number; // 🔧 스케일
  spreadWidth: number; // 📐 스프레드 전체 너비 (1400)
  pageWidth: number; // 📐 1페이지 너비 (700)
  height: number; // 📐 높이 (820)
}

/**
 * SinglePageView - Mobile용 1페이지 보기
 * 좌/우 페이지를 스와이프로 전환
 */
const SinglePageView: React.FC<SinglePageViewProps> = ({
  activeSide,
  onSideChange,
  currentPageItems,
  renderItem,
  children,
  isDraggingItem = false,
  pageOffset,
  scale,
  spreadWidth,
  pageWidth,
  height
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const SWIPE_THRESHOLD = 60; // 스와이프 임계값 (px)

  // 스와이프 시작
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isDraggingItem || isTransitioning) return;
    setSwipeStart({ x: e.clientX, y: e.clientY });
  };

  // 스와이프 중
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!swipeStart || isDraggingItem || isTransitioning) return;
    
    const dx = e.clientX - swipeStart.x;
    const dy = Math.abs(e.clientY - swipeStart.y);
    
    // 세로 스크롤이 더 큰 경우 스와이프 취소
    if (dy > Math.abs(dx)) {
      setSwipeStart(null);
      return;
    }
    
    setSwipeOffset(dx);
  };

  // 스와이프 끝
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!swipeStart || isDraggingItem || isTransitioning) {
      setSwipeStart(null);
      setSwipeOffset(0);
      return;
    }

    const dx = e.clientX - swipeStart.x;

    // 좌→우 스와이프 (left로 이동)
    if (dx > SWIPE_THRESHOLD && activeSide === 'right') {
      setIsTransitioning(true);
      setTimeout(() => {
        onSideChange('left');
        setIsTransitioning(false);
        setSwipeOffset(0);
      }, 300);
    }
    // 우→좌 스와이프 (right로 이동)
    else if (dx < -SWIPE_THRESHOLD && activeSide === 'left') {
      setIsTransitioning(true);
      setTimeout(() => {
        onSideChange('right');
        setIsTransitioning(false);
        setSwipeOffset(0);
      }, 300);
    } else {
      // 임계값 미달 - 원위치
      setSwipeOffset(0);
    }

    setSwipeStart(null);
  };

  return (
    <div 
      ref={containerRef}
      className="relative"
      style={{ 
        width: pageWidth,
        height: height,
        overflow: 'hidden', // ✅ 배경 슬라이스를 위한 핵심
        touchAction: 'pan-y',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        setSwipeStart(null);
        setSwipeOffset(0);
      }}
    >
      {/* 📐 배경 슬라이스: SPREAD 크기 유지 + left 이동 */}
      <div
        className="absolute top-0"
        style={{
          left: -pageOffset, // ✅ right면 -700px 이동
          width: spreadWidth, // 1400px 고정
          height: height,
        }}
      >
        {children}
      </div>

      {/* 페이지 전환 토글 (상단) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border border-stone-200">
        <button
          onClick={() => onSideChange('left')}
          className={`
            px-3 py-1 text-xs font-bold rounded-full transition-all
            ${activeSide === 'left' 
              ? 'bg-stone-800 text-white' 
              : 'text-stone-400 hover:text-stone-600'
            }
          `}
        >
          좌
        </button>
        <div className="w-px h-4 bg-stone-300" />
        <button
          onClick={() => onSideChange('right')}
          className={`
            px-3 py-1 text-xs font-bold rounded-full transition-all
            ${activeSide === 'right' 
              ? 'bg-stone-800 text-white' 
              : 'text-stone-400 hover:text-stone-600'
            }
          `}
        >
          우
        </button>
      </div>

      {/* 페이지 표시 (좌측 상단) */}
      <div className="absolute top-4 left-4 z-40 text-xs text-stone-400 font-bold">
        {activeSide === 'left' ? '← 왼쪽 페이지' : '오른쪽 페이지 →'}
      </div>

      {/* Canvas Layer - 현재 페이지 아이템 (스와이프 애니메이션) */}
      <div 
        className="absolute inset-0 z-30 pointer-events-none transition-transform"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isTransitioning ? 'transform 0.3s ease-out' : swipeOffset !== 0 ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {currentPageItems.map(item => (
          <div key={item.id} className="pointer-events-auto">
            {renderItem(item)}
          </div>
        ))}
      </div>

      {/* 스와이프 힌트 (좌/우 화살표) */}
      {!isDraggingItem && (
        <>
          {activeSide === 'right' && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 animate-pulse pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          )}
          {activeSide === 'left' && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 animate-pulse pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SinglePageView;

