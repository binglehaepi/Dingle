import React from 'react';
import { ScrapMetadata } from '../../types';

interface StickerObjectProps {
  data: ScrapMetadata;
}

const StickerObject: React.FC<StickerObjectProps> = ({ data }) => {
  const hasImage = data.stickerConfig?.imageUrl;
  const emoji = data.stickerConfig?.emoji;

  return (
    <div className="flex items-center justify-center p-2 cursor-grab group">
        {hasImage ? (
          // 이미지 스티커
          <div className="relative w-32 h-32">
            <img 
              src={data.stickerConfig.imageUrl} 
              alt="Sticker"
              className="w-full h-full object-contain drop-shadow-lg select-none transform transition-transform group-hover:scale-110"
              draggable={false}
            />
          </div>
        ) : (
          // 이모지 스티커
          <div className="text-[100px] leading-none drop-shadow-md select-none transform transition-transform group-hover:scale-110">
              {emoji || '⭐'}
          </div>
        )}
        {/* Subtle white border for sticker cut-out look */}
        <div className="absolute inset-0 -z-10 bg-white opacity-0 group-hover:opacity-20 rounded-full blur-md"></div>
    </div>
  );
};

export default StickerObject;