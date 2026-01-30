import React from 'react';
import { ScrapItem, ScrapType, ScrapMetadata } from '../types';

// Item Components
import TwitterEmbedCard from './items/TwitterEmbedCard';
import InstagramEmbedCard from './items/InstagramEmbedCard';
import PinterestCard from './items/PinterestCard';
import BookObject from './items/BookObject';
import MusicCdObject from './items/MusicCdObject';
import VideoPlayerObject from './items/VideoPlayerObject';
import FashionTag from './items/FashionTag';
import EditableScrap from './items/EditableScrap';
import MediaCard from './items/MediaCard';
import ChatPhoneObject from './items/ChatPhoneObject';
import TicketObject from './items/TicketObject';
import BoardingPassObject from './items/BoardingPassObject';
import ReceiptObject from './items/ReceiptObject';
import ToploaderObject from './items/ToploaderObject';
import CupSleeveObject from './items/CupSleeveObject';
import TextNoteObject from './items/TextNoteObject';
import StickerObject from './items/StickerObject';
import TapeObject from './items/TapeObject';
import MovingPhotoObject from './items/MovingPhotoObject';
import ProfileWidget from './items/ProfileWidget';
import TodoWidget from './items/TodoWidget';
import OhaAsaWidget from './items/OhaAsaWidget';
import AladinBookCard from './items/AladinBookCard';
import GoogleMapCard from './items/GoogleMapCard';
import DecoratedCardWrapper from './decorations/DecoratedCardWrapper';

interface ItemRendererProps {
  item: ScrapItem;
  onUpdateMetadata: (id: string, newMeta: Partial<ScrapMetadata>) => void;
}

/**
 * 아이템 타입별 렌더링 컴포넌트
 * 
 * App.tsx의 renderItemContent 로직을 분리
 */
export const ItemRenderer: React.FC<ItemRendererProps> = ({ item, onUpdateMetadata }) => {
  const wrapWithCardDecorations = (node: React.ReactNode) => {
    const deco: any = item?.metadata?.decoration;
    const presetId: string = (deco?.presetId || 'none') as string;

    // legacy -> new preset mapping (최소회귀)
    const effectivePresetId: string = (() => {
      if (presetId === 'lace' || presetId === 'scallop_lace' || presetId === 'scallop_lace_clean' || presetId === 'wavy_frame' || presetId === 'heart_lace') return 'frame_scallop_lace';
      if (presetId === 'pearls' || presetId === 'pearl' || presetId === 'pearl_thin') return 'frame_pearl_border';
      if (presetId === 'ribbon' || presetId === 'ribbon_top' || presetId === 'ribbon_top_thin') return 'frame_bow_top';
      if (presetId === 'ribbon_corners' || presetId === 'ribbon_corners_thin') return 'frame_bow_corners';
      if (presetId === 'polaroid' || presetId === 'polaroid_thin') return 'frame_simple_round';
      // 요구사항: stickerCorners는 없으면 none
      if (presetId === 'stickerCorners' || presetId === 'sticker_corners' || presetId === 'sticker_corners_thin') return 'none';
      return presetId;
    })();

    // decoration이 없거나(또는 effectivePresetId가 none이면) 기존 DOM 최소화
    if (!deco || effectivePresetId === 'none') return node;

    const shadow = (deco?.shadow as string | undefined) || undefined;
    return (
      <DecoratedCardWrapper presetId={effectivePresetId} shadow={shadow} debugItemId={item.id}>
        {node}
      </DecoratedCardWrapper>
    );
  };

  // 🟢 1차 릴리즈: Platform 기반 렌더링
  const platform = item.metadata.platform;
  
  // 알라딘 도서
  if (platform === 'aladin') {
    console.log(`📚 알라딘 도서 카드 렌더링`);
    return wrapWithCardDecorations(<AladinBookCard data={item.metadata} />);
  }
  
  // Google Maps
  if (platform === 'googlemap') {
    console.log(`🗺️ Google Maps 카드 렌더링`);
    return wrapWithCardDecorations(<GoogleMapCard data={item.metadata} />);
  }

  // Editable or General
  if (item.metadata.isEditable || item.type === ScrapType.GENERAL) {
    return <EditableScrap data={item.metadata} onSave={(newData) => onUpdateMetadata(item.id, newData)} />;
  }

  // Type-specific rendering
  switch (item.type) {
    case ScrapType.PROFILE:
      return <ProfileWidget data={item.metadata} onUpdate={(d) => onUpdateMetadata(item.id, d)} />;
    
    case ScrapType.TODO:
      return <TodoWidget data={item.metadata} onUpdate={(d) => onUpdateMetadata(item.id, d)} />;
    
    case ScrapType.OHAASA:
      return <OhaAsaWidget data={item.metadata} />;
    
    case ScrapType.MOVING_PHOTO:
      return <MovingPhotoObject data={item.metadata} />;
    
    case ScrapType.STICKER:
      return <StickerObject data={item.metadata} />;
    
    case ScrapType.TAPE:
      return <TapeObject data={item.metadata} />;
    
    case ScrapType.TWITTER:
      return wrapWithCardDecorations(<TwitterEmbedCard data={item.metadata} />);
    
    case ScrapType.INSTAGRAM:
      return wrapWithCardDecorations(<InstagramEmbedCard data={item.metadata} />);
    
    case ScrapType.PINTEREST:
      return wrapWithCardDecorations(<PinterestCard data={item.metadata} />);
    
    case ScrapType.BOOK:
      return <BookObject data={item.metadata} />;
    
    case ScrapType.YOUTUBE:
      return item.metadata.youtubeConfig?.mode === 'cd' 
        ? <MusicCdObject data={item.metadata} /> 
        : wrapWithCardDecorations(<VideoPlayerObject data={item.metadata} />);
    
    case ScrapType.SPOTIFY:
      return wrapWithCardDecorations(<MediaCard data={item.metadata} />);
    
    case ScrapType.TIKTOK:
      return wrapWithCardDecorations(<MediaCard data={item.metadata} />);
    
    case ScrapType.VIMEO:
      return wrapWithCardDecorations(<MediaCard data={item.metadata} />);
    
    case ScrapType.FASHION:
      return <FashionTag data={item.metadata} />;
    
    case ScrapType.CHAT:
      return <ChatPhoneObject data={item.metadata} />;
    
    case ScrapType.TICKET:
      return <TicketObject data={item.metadata} />;
    
    case ScrapType.BOARDING:
      return <BoardingPassObject data={item.metadata} />;
    
    case ScrapType.RECEIPT:
      return <ReceiptObject data={item.metadata} />;
    
    case ScrapType.TOPLOADER:
      return <ToploaderObject data={item.metadata} />;
    
    case ScrapType.CUPSLEEVE:
      return <CupSleeveObject data={item.metadata} />;
    
    case ScrapType.NOTE:
      return <TextNoteObject data={item.metadata} />;
    
    default:
      return <EditableScrap data={item.metadata} onSave={(newData) => onUpdateMetadata(item.id, newData)} />;
  }
};



