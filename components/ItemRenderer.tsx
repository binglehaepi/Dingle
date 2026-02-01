import React from 'react';
import { ScrapItem, ScrapType, ScrapMetadata, LayoutTextData } from '../types';

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
import SpotifyEmbedObject from './items/SpotifyEmbedObject';
import SoundCloudEmbedObject from './items/SoundCloudEmbedObject';
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
// DecoratedCardWrapper removed - decoration feature disabled for MVP

interface ItemRendererProps {
  item: ScrapItem;
  onUpdateMetadata: (id: string, newMeta: Partial<ScrapMetadata>) => void;
  onDeleteItem?: (id: string) => void;
  onUpdateText?: (key: string, value: string) => void;
  textData?: LayoutTextData;
}

/**
 * 아이템 타입별 렌더링 컴포넌트
 * 
 * App.tsx의 renderItemContent 로직을 분리
 */
export const ItemRenderer: React.FC<ItemRendererProps> = ({ item, onUpdateMetadata, onDeleteItem, onUpdateText, textData }) => {
  // Decoration feature removed for MVP - cards render without decorations

  // 🟢 1차 릴리즈: Platform 기반 렌더링
  const platform = item.metadata.platform;
  
  // 알라딘 도서
  if (platform === 'aladin') {
    console.log(`📚 알라딘 도서 카드 렌더링`);
    return <AladinBookCard data={item.metadata} />;
  }
  
  // Google Maps
  if (platform === 'googlemap') {
    console.log(`🗺️ Google Maps 카드 렌더링`);
    return <GoogleMapCard data={item.metadata} />;
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
      return <OhaAsaWidget data={item.metadata} onUpdateText={onUpdateText} textData={textData} />;
    
    case ScrapType.MOVING_PHOTO:
      return <MovingPhotoObject data={item.metadata} />;
    
    case ScrapType.STICKER:
      return <StickerObject data={item.metadata} width={item.w} height={item.h} />;
    
    case ScrapType.TAPE:
      return <TapeObject data={item.metadata} width={item.w} height={item.h} />;
    
    case ScrapType.TWITTER:
      return <TwitterEmbedCard data={item.metadata} />;
    
    case ScrapType.INSTAGRAM:
      return <InstagramEmbedCard data={item.metadata} />;
    
    case ScrapType.PINTEREST:
      return <PinterestCard data={item.metadata} />;
    
    case ScrapType.BOOK:
      return <BookObject data={item.metadata} />;
    
    case ScrapType.YOUTUBE:
      return item.metadata.youtubeConfig?.mode === 'cd' 
        ? <MusicCdObject data={item.metadata} /> 
        : <VideoPlayerObject data={item.metadata} />;
    
    case ScrapType.SPOTIFY:
      return <SpotifyEmbedObject data={item.metadata} />;
    
    case ScrapType.SOUNDCLOUD:
      return <SoundCloudEmbedObject data={item.metadata} />;
    
    case ScrapType.TIKTOK:
      return <MediaCard data={item.metadata} />;
    
    case ScrapType.VIMEO:
      return <MediaCard data={item.metadata} />;
    
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
      return <TextNoteObject 
        data={item.metadata} 
        onDelete={() => onDeleteItem?.(item.id)}
        onUpdate={(newMeta) => onUpdateMetadata(item.id, newMeta)}
      />;
    
    default:
      return <EditableScrap data={item.metadata} onSave={(newData) => onUpdateMetadata(item.id, newData)} />;
  }
};



