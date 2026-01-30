import React, { useState } from 'react';
import { ScrapItem, LayoutTextData, PageSide } from '../../types';
import DraggableItem from '../DraggableItem';

// Import Item Components
import TwitterEmbedCard from '../items/TwitterEmbedCard';
import InstagramEmbedCard from '../items/InstagramEmbedCard';
import PinterestCard from '../items/PinterestCard';
import BookObject from '../items/BookObject';
import MusicCdObject from '../items/MusicCdObject';
import VideoPlayerObject from '../items/VideoPlayerObject';
import FashionTag from '../items/FashionTag';
import EditableScrap from '../items/EditableScrap';
import MediaCard from '../items/MediaCard';
import ChatPhoneObject from '../items/ChatPhoneObject';
import TicketObject from '../items/TicketObject';
import BoardingPassObject from '../items/BoardingPassObject';
import ReceiptObject from '../items/ReceiptObject';
import ToploaderObject from '../items/ToploaderObject';
import CupSleeveObject from '../items/CupSleeveObject';
import TextNoteObject from '../items/TextNoteObject';
import StickerObject from '../items/StickerObject';
import TapeObject from '../items/TapeObject';
import MovingPhotoObject from '../items/MovingPhotoObject';
import ProfileWidget from '../items/ProfileWidget';
import TodoWidget from '../items/TodoWidget';
import OhaAsaWidget from '../items/OhaAsaWidget';
import MonthlySpread from '../layouts/MonthlySpread';

const PAGE_WIDTH = 700;
const DESIGN_HEIGHT = 820;

interface MobileMonthViewProps {
  items: ScrapItem[];
  currentDate: Date;
  textData: LayoutTextData;
  dashboardNotePaperOverride?: string;
  activeSide: PageSide;
  onSideChange: (side: PageSide) => void;
  onUpdateItem: (id: string, updates: Partial<ScrapItem>) => void;
  onDeleteItem: (id: string) => void;
  onUpdateText: (key: string, value: string) => void;
  isDraggingItem: boolean;
  setIsDraggingItem: (dragging: boolean) => void;
  maxZ: number;
  onBringToFront: (id: string) => void;
  onDateClick: (date: Date) => void; // 달력 날짜 클릭
}

const MobileMonthView: React.FC<MobileMonthViewProps> = ({
  items,
  currentDate,
  textData,
  dashboardNotePaperOverride,
  activeSide,
  onSideChange,
  onUpdateItem,
  onDeleteItem,
  onUpdateText,
  isDraggingItem,
  setIsDraggingItem,
  maxZ,
  onBringToFront,
  onDateClick
}) => {
  const viewportRef = React.useRef<HTMLDivElement>(null);

  // 📐 좌표 변환: 왼쪽=0, 오른쪽=700
  const pageOffset = activeSide === 'right' ? PAGE_WIDTH : 0;

  // 📐 현재 페이지 아이템 필터링 (x 좌표 기준)
  // - 왼쪽: x < 700
  // - 오른쪽: x >= 700
  const currentPageItems = items.filter(item => {
    const isLeftPage = item.position.x < PAGE_WIDTH;
    return activeSide === 'left' ? isLeftPage : !isLeftPage;
  });

  // 아이템 렌더 함수
  const renderItem = (item: ScrapItem) => {
    // 📐 view 좌표 변환: xView = xStore - pageOffset
    const viewPosition = {
      ...item.position,
      x: item.position.x - pageOffset
    };

    const viewItem = { ...item, position: viewPosition };

    const commonProps = {
      item: viewItem,
      interactionScale: 1, // 모바일: scale 없이 1:1
      onUpdatePosition: (id: string, updates: { x?: number; y?: number; rotation?: number; scale?: number }) => {
        // 📐 store 좌표 변환: xStore = xView + pageOffset
        const storeUpdates = {
          ...updates,
          x: updates.x !== undefined ? updates.x + pageOffset : undefined
        };
        onUpdateItem(id, { 
          position: { 
            ...item.position, 
            ...storeUpdates 
          },
          pageSide: activeSide // 드래그 완료 시 현재 페이지로 고정
        });
      },
      onDelete: () => onDeleteItem(item.id),
      onBringToFront: () => onBringToFront(item.id),
      onDragStart: () => setIsDraggingItem(true),
      onDragEnd: () => setIsDraggingItem(false)
    };

    // 아이템 타입별 렌더링
    const itemType = item.type as string;
    switch (itemType) {
      case 'twitter': return <TwitterEmbedCard key={item.id} data={item.metadata} {...commonProps} />;
      case 'instagram': return <InstagramEmbedCard key={item.id} data={item.metadata} {...commonProps} />;
      case 'pinterest': return <PinterestCard key={item.id} data={item.metadata} {...commonProps} />;
      case 'book': return <BookObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'music_cd': return <MusicCdObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'video_player': return <VideoPlayerObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'fashion': return <FashionTag key={item.id} data={item.metadata} {...commonProps} />;
      case 'media': return <MediaCard key={item.id} data={item.metadata} {...commonProps} />;
      case 'chat_phone': return <ChatPhoneObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'ticket': return <TicketObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'boarding_pass': return <BoardingPassObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'receipt': return <ReceiptObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'toploader': return <ToploaderObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'cup_sleeve': return <CupSleeveObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'text_note': return <TextNoteObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'sticker': return <StickerObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'tape': return <TapeObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'moving_photo': return <MovingPhotoObject key={item.id} data={item.metadata} {...commonProps} />;
      case 'profile_widget': 
        return (
          <ProfileWidget 
            key={item.id}
            data={item.metadata}
            {...commonProps}
            onUpdateText={(field, value) => onUpdateText(`profile_${field}`, value)}
            textData={textData}
          />
        );
      case 'todo_widget':
        return (
          <TodoWidget
            key={item.id}
            data={item.metadata}
            {...commonProps}
            onUpdateText={(key, value) => onUpdateText(key, value)}
            textData={textData}
          />
        );
      case 'oha_asa_widget':
        return (
          <OhaAsaWidget
            key={item.id}
            data={item.metadata}
            {...commonProps}
            onUpdateText={(key, value) => onUpdateText(key, value)}
            textData={textData}
          />
        );
      case 'editable':
      default:
        return <EditableScrap key={item.id} data={item.metadata} {...commonProps} onSave={(newData) => onUpdateItem(item.id, { metadata: newData })} />;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* 탭 전환 버튼 */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-sm rounded-full shadow-md flex text-xs">
        <button
          onClick={() => onSideChange('left')}
          className={`px-4 py-1.5 rounded-l-full font-medium transition-colors ${
            activeSide === 'left'
              ? 'bg-[var(--ui-primary-bg)] text-[var(--ui-primary-text)]'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          프로필
        </button>
        <button
          onClick={() => onSideChange('right')}
          className={`px-4 py-1.5 rounded-r-full font-medium transition-colors ${
            activeSide === 'right'
              ? 'bg-[var(--ui-primary-bg)] text-[var(--ui-primary-text)]'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          달력
        </button>
      </div>

      {/* 🚨 탭별 독립 페이지 */}
      <div 
        ref={viewportRef}
        className="flex-1 w-full"
        style={{ 
          paddingTop: '40px',
          paddingBottom: '68px',
          overflow: 'auto',
          maxWidth: '100vw'
        }}
      >
        <div className="relative w-full h-full shadow-lg">
          {/* 탭에 따라 MonthlySpread의 좌/우만 렌더링 */}
          <div
            className="contents"
            data-dashboard-scope="monthly"
            style={
              dashboardNotePaperOverride
                ? ({ ['--note-paper-background']: dashboardNotePaperOverride } as React.CSSProperties)
                : undefined
            }
          >
            <MonthlySpread
              currentDate={currentDate}
              items={items}
              textData={textData}
              onDateClick={onDateClick} // 날짜 클릭 → 일기 페이지로
              onWeekSelect={() => {}}
              onUpdateText={onUpdateText}
              viewMode={activeSide} // 'left' | 'right'
            />
          </div>

          {/* 사용자 추가 아이템 */}
          <div className="absolute inset-0 z-10 p-4 pointer-events-none">
            <div className="pointer-events-auto">
              {currentPageItems.map(renderItem)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMonthView;

