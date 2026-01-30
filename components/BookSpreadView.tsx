import React, { ReactNode } from 'react';
import { ScrapItem } from '../types';

interface BookSpreadViewProps {
  leftPageItems: ScrapItem[];
  rightPageItems: ScrapItem[];
  renderItem: (item: ScrapItem) => ReactNode;
  children?: ReactNode; // Layout 컴포넌트 (MonthlySpread, FreeLayout 등)
  /**
   * NoteModeView 등에서 읽기 전용 렌더링용.
   * - true면 아이템 레이어의 pointer events를 차단한다.
   */
  readOnly?: boolean;
  /**
   * PagesWrapper(2페이지 전용) 스타일/클래스 주입용.
   * - Dock/패널은 이 밖(부모 SpreadRoot)에 두고, 스파인/종이 배경은 이 래퍼에만 적용한다.
   */
  wrapperClassName?: string;
  wrapperStyle?: React.CSSProperties;
}

/**
 * BookSpreadView - Desktop/Tablet용 2페이지 스프레드
 * 좌/우 페이지를 동시에 보여줌
 */
const BookSpreadView: React.FC<BookSpreadViewProps> = ({
  leftPageItems,
  rightPageItems,
  renderItem,
  children,
  readOnly = false,
  wrapperClassName = '',
  wrapperStyle
}) => {
  return (
    <div
      data-pages-wrapper
      data-note-spread
      className={`relative w-full h-full ${wrapperClassName}`}
      style={wrapperStyle}
    >
      {/* Layout 컴포넌트 (배경/페이지 2장) */}
      {children}

      {/* 중앙 Spine / Gutter (PagesWrapper 기준 50%) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px"
        style={{
          position: 'absolute',
          zIndex: 20,
          backgroundColor: 'var(--note-center-fold-line-color, rgba(148, 163, 184, 0.3))',
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-16 pointer-events-none"
        style={{ position: 'absolute', zIndex: 20, display: 'none' }}
      />

      {/* 📐 Canvas Layer - SPREAD 기준 좌표계 */}
      {/* overflow-hidden 제거: 아이템이 페이지 경계를 자유롭게 넘나들 수 있음 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ position: 'absolute', zIndex: 30 }}
      >
        {leftPageItems.map((item) => (
          <div key={item.id} className={readOnly ? 'pointer-events-none' : 'pointer-events-auto'}>
            {renderItem(item)}
          </div>
        ))}
        {rightPageItems.map((item) => (
          <div key={item.id} className={readOnly ? 'pointer-events-none' : 'pointer-events-auto'}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookSpreadView;

