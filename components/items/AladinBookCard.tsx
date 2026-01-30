import React from 'react';
import { ScrapMetadata } from '../../types';
import { requestEmbedPreview } from '../../utils/embedPreview';
import { createLinkCardNavHandlers } from '../../utils/linkCardNav';

interface AladinBookCardProps {
  data: ScrapMetadata;
}

/**
 * 알라딘 도서 카드
 * 책 표지 스타일
 */
const AladinBookCard: React.FC<AladinBookCardProps> = ({ data }) => {
  const { 
    url, 
    title = "알라딘 도서", 
    subtitle = "",
    imageUrl = "",
    description = ""
  } = data;
  const nav = createLinkCardNavHandlers(url, title);

  return (
    <a
      href={url}
      onClick={nav.onClick}
      onDoubleClick={nav.onDoubleClick}
      className="block w-[280px] cursor-pointer no-drag"
      style={{
        perspective: '1000px',
      }}
    >
      {/* 📚 3D 책 효과 */}
      <div 
        className="relative transition-all hover:scale-105"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateY(-5deg)',
        }}
      >
        {/* 책 표지 */}
        <div 
          className="relative bg-white shadow-2xl"
          style={{
            borderRadius: '8px 12px 12px 8px',
            border: '3px solid #0066CC',
            borderLeft: '8px solid #004080',
            overflow: 'hidden',
          }}
        >
          {/* 책 표지 영역 */}
          <div className="relative bg-white p-6 flex items-center justify-center" style={{ height: '320px' }}>
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={title}
                className="max-h-full max-w-full object-contain shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'block';
                  }
                }}
              />
            ) : null}
            
            {/* 기본 책 아이콘 (폴백) */}
            <div className={`text-center ${imageUrl ? 'hidden' : ''} fallback-icon`}>
              <div className="text-8xl mb-4">📚</div>
              <div className="text-sm text-gray-500 font-medium">알라딘</div>
            </div>
            
            {/* 알라딘 로고 뱃지 */}
            <div className="absolute top-3 right-3 bg-[var(--ui-primary-bg)] text-[var(--ui-primary-text)] text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              ALADIN
            </div>
          </div>

          {/* 책 정보 영역 */}
          <div className="bg-gradient-to-b from-white to-blue-50 p-4 border-t-2 border-blue-200">
            <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-600 line-clamp-1">
                {subtitle}
              </p>
            )}
            
            {/* 버튼 */}
            <div className="mt-3 flex items-center justify-center gap-2 bg-[var(--ui-primary-bg)] text-[var(--ui-primary-text)] py-2 px-4 rounded-lg font-medium text-sm hover:bg-[var(--ui-primary-hover)] transition-colors">
              <span>알라딘에서 보기</span>
              <span>→</span>
            </div>
          </div>

          {/* 책 등받이 효과 (왼쪽) */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-2"
            style={{
              background: 'linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.05))',
            }}
          />

          {/* 책 페이지 효과 (오른쪽) */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-1"
            style={{
              background: 'linear-gradient(to left, rgba(0,0,0,0.1), transparent)',
            }}
          />
        </div>

        {/* 책 옆면 (3D 효과) */}
        <div 
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: '8px',
            background: 'linear-gradient(to right, #003366, #004080)',
            transform: 'translateX(-8px) rotateY(90deg)',
            transformOrigin: 'right',
            borderRadius: '2px 0 0 2px',
          }}
        />
      </div>
    </a>
  );
};

export default AladinBookCard;

