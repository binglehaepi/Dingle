import React from 'react';
import { ScrapMetadata } from '../../types';

interface StickerObjectProps {
  data: ScrapMetadata;
  width?: number;
  height?: number;
}

const StickerObject: React.FC<StickerObjectProps> = ({ data, width = 100, height = 100 }) => {
  const hasImage = data.stickerConfig?.imageUrl;
  const emoji = data.stickerConfig?.emoji;

  return (
    <div 
      className="flex items-center justify-center cursor-grab group"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
        {hasImage ? (
          // 이미지 스티커 (업로드된 사진)
          <img 
            src={data.stickerConfig.imageUrl} 
            alt="Photo"
            className="w-full h-full object-contain drop-shadow-lg select-none transform transition-transform group-hover:scale-105"
            draggable={false}
          />
        ) : (
          // 이모지 스티커 (fontSize는 부모 크기의 80%로 자동 조정)
          <div 
            className="leading-none drop-shadow-md select-none transform transition-transform group-hover:scale-110"
            style={{ fontSize: `${Math.min(width, height) * 0.8}px` }}
          >
              {emoji || '⭐'}
          </div>
        )}
        {/* Subtle white border for sticker cut-out look */}
        <div className="absolute inset-0 -z-10 bg-white opacity-0 group-hover:opacity-20 rounded-full blur-md"></div>
    </div>
  );
};

export default StickerObject;