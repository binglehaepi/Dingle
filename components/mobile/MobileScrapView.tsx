import React from 'react';
import { ScrapItem, DiaryStyle } from '../../types';
import DraggableItem from '../DraggableItem';
import { ItemRenderer } from '../ItemRenderer';

interface MobileScrapViewProps {
  items: ScrapItem[];
  diaryStyle: DiaryStyle;
  onUpdateItem: (id: string, updates: Partial<ScrapItem>) => void;
  onDeleteItem: (id: string) => void;
  isDraggingItem: boolean;
  setIsDraggingItem: (dragging: boolean) => void;
  maxZ: number;
  onBringToFront: (id: string) => void;
  currentLayout?: 'free' | 'scrap_page'; // 일기 vs 스크랩
  currentDate?: Date; // 일기 날짜
  onBackToMonth?: () => void; // 월 화면으로 돌아가기
}

const GLOBAL_SCRAP_PAGE_KEY = 'GLOBAL_SCRAP_PAGE';

const MobileScrapView: React.FC<MobileScrapViewProps> = ({
  items,
  diaryStyle,
  onUpdateItem,
  onDeleteItem,
  isDraggingItem,
  setIsDraggingItem,
  maxZ,
  onBringToFront,
  currentLayout = 'scrap_page',
  currentDate,
  onBackToMonth
}) => {
  // 스크랩 페이지 vs 일기 페이지 분기
  const isDiaryPage = currentLayout === 'free';
  
  // 아이템 필터링
  const scrapItems = isDiaryPage
    ? items.filter(item => {
        // 일기 페이지: 해당 날짜의 아이템만
        if (!currentDate || !item.diaryDate) return false;
        const itemDate = new Date(item.diaryDate);
        return (
          itemDate.getFullYear() === currentDate.getFullYear() &&
          itemDate.getMonth() === currentDate.getMonth() &&
          itemDate.getDate() === currentDate.getDate()
        );
      })
    : items.filter(item => item.diaryDate === GLOBAL_SCRAP_PAGE_KEY);

  // ✅ 모바일 렌더링은 ItemRenderer(단일 소스)로 통일한다.
  // - 알 수 없는 타입은 ItemRenderer의 default fallback(EditableScrap)으로 안전하게 떨어진다.
  // - 기존 저장 데이터에 enum 밖 문자열이 있어도 런타임 크래시를 피한다.
  const renderItem = (item: ScrapItem) => {
    return (
      <DraggableItem
        key={item.id}
        item={item}
        interactionScale={1}
        onUpdatePosition={(id, updates) => {
          onUpdateItem(id, {
            position: {
              ...item.position,
              ...updates,
            },
          });
        }}
        onDelete={onDeleteItem}
        onBringToFront={onBringToFront}
        // 모바일에서는 “메인 아이템 토글” UX를 별도로 제공하지 않으므로 no-op(크래시 방지, 동작 변경 최소)
        onSetMainItem={() => {}}
        onDragStart={() => setIsDraggingItem(true)}
        onDragEnd={() => setIsDraggingItem(false)}
      >
        <ItemRenderer
          item={item}
          onUpdateMetadata={(id, newMeta) => {
            onUpdateItem(id, {
              metadata: {
                ...item.metadata,
                ...newMeta,
              },
            });
          }}
        />
      </DraggableItem>
    );
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: 'var(--app-h, 100vh)',
        backgroundColor: diaryStyle.backgroundImage ? 'transparent' : 'var(--app-background)',
        backgroundImage: diaryStyle.backgroundImage ? `url(${diaryStyle.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        touchAction: isDraggingItem ? 'none' : 'pan-y' // 드래그 중엔 스크롤 방지
      }}
    >
      {/* 📅 일기 헤더 (일기 페이지일 때만) */}
      {isDiaryPage && currentDate && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            {/* 뒤로가기 버튼 */}
            <button
              onClick={onBackToMonth}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">달력</span>
            </button>
            
            {/* 날짜 표시 */}
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">
                {currentDate.toLocaleDateString('ko-KR', { 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </p>
            </div>
            
            {/* 빈 공간 (균형 맞추기) */}
            <div className="w-16"></div>
          </div>
        </div>
      )}

      {/* 📝 Canvas Layer - 아이템 렌더링 */}
      <div 
        className="absolute inset-0"
        style={{
          paddingTop: isDiaryPage ? '60px' : '0' // 헤더 높이만큼 여백
        }}
      >
        {scrapItems.map(renderItem)}
      </div>

      {/* 빈 상태 안내 */}
      {scrapItems.length === 0 && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            paddingTop: isDiaryPage ? '60px' : '0'
          }}
        >
          <div className="text-center px-8">
            <p className="text-lg font-medium text-gray-400 mb-2">
              {isDiaryPage ? '오늘의 일기를 시작해보세요' : '스크랩이 비어있어요'}
            </p>
            <p className="text-sm text-gray-300">
              우측 하단 + 버튼으로 추가해보세요
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileScrapView;

