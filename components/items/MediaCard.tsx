import React from 'react';
import { ScrapMetadata } from '../../types';
import { requestEmbedPreview } from '../../utils/embedPreview';
import { createLinkCardNavHandlers } from '../../utils/linkCardNav';

interface MediaCardProps {
  data: ScrapMetadata;
}

const MediaCard: React.FC<MediaCardProps> = ({ data }) => {
  const nav = createLinkCardNavHandlers(data.url, data.title);
  // 플랫폼별 아이콘
  const getPlatformIcon = () => {
    if (data.subtitle?.includes('Spotify')) {
      return '🎵';
    } else if (data.subtitle?.includes('TikTok')) {
      return '📱';
    } else if (data.subtitle?.includes('Vimeo')) {
      return '🎥';
    }
    return '🎬';
  };

  return (
    <a 
      href={data.url} 
      className="block w-[320px] bg-white shadow-xl relative group transition-all hover:shadow-2xl hover:scale-[1.02] rounded-lg overflow-hidden no-drag"
      onClick={nav.onClick}
      onDoubleClick={nav.onDoubleClick}
    >
      {/* 썸네일 이미지 */}
      <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
        {data.imageUrl ? (
          <img 
            src={data.imageUrl} 
            alt={data.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {getPlatformIcon()}
          </div>
        )}
        
        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        
        {/* 플랫폼 아이콘 배지 */}
        <div className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg">
          <span className="text-xl">{getPlatformIcon()}</span>
        </div>
      </div>

      {/* 카드 정보 */}
      <div className="p-4">
        {/* 플랫폼 이름 */}
        <div className="flex items-center gap-2 mb-2">
          <span 
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{ 
              backgroundColor: data.themeColor ? `${data.themeColor}20` : '#f1f5f9',
              color: data.themeColor || '#64748b'
            }}
          >
            {data.subtitle}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="font-handwriting font-bold text-slate-800 text-lg leading-tight line-clamp-2 mb-2">
          {data.title}
        </h3>

        {/* 설명 */}
        {data.description && (
          <p className="text-slate-500 text-sm line-clamp-2">
            {data.description}
          </p>
        )}

        {/* 하단 액션 */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>재생하기</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-600">
            <span className="text-xs font-bold">보기</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </div>

      {/* 호버 테두리 효과 */}
      <div 
        className="absolute inset-0 border-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ borderColor: data.themeColor || '#000' }}
      />
    </a>
  );
};

export default MediaCard;



