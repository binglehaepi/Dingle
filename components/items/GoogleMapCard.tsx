import React, { useState } from 'react';
import { ScrapMetadata } from '../../types';
import { requestEmbedPreview } from '../../utils/embedPreview';
import { createLinkCardNavHandlers } from '../../utils/linkCardNav';

interface GoogleMapCardProps {
  data: ScrapMetadata;
}

/**
 * Google Maps 위치 카드
 * 지도 핀 스타일 + 지도 미리보기 토글
 */
const GoogleMapCard: React.FC<GoogleMapCardProps> = ({ data }) => {
  const { 
    url, 
    title = "Google Maps 위치", 
    subtitle = "",
    imageUrl = "",
    embedHtml = ""
  } = data;
  const nav = createLinkCardNavHandlers(url, title);
  
  const [showMap, setShowMap] = useState(false);
  const DBG = !!import.meta.env.DEV && (typeof window !== 'undefined') && ((window as any).__DSD_DEBUG_DRAG ?? true);
  
  // embedUrl 추출 (embedHtml에서)
  const embedUrl = embedHtml ? embedHtml.match(/src="([^"]+)"/)?.[1] : null;

  React.useEffect(() => {
    if (!DBG) return;
    const dragActive = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
    console.debug('[googleMap] MOUNT', { url, embedUrl, dragActive });
    return () => {
      const dragActive2 = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
      console.debug('[googleMap] UNMOUNT', { url, embedUrl, dragActive: dragActive2 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <a
      href={url}
      onClick={nav.onClick}
      onDoubleClick={nav.onDoubleClick}
      className="block w-[300px] bg-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer no-drag"
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: '3px solid #4285F4'
      }}
    >
      {/* 지도 헤더 */}
      <div 
        className="relative p-6 flex flex-col items-center justify-center"
        style={{
          height: '200px',
          background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)'
        }}
      >
        {/* 위치 핀 아이콘 */}
        <div className="relative mb-4">
          <div 
            className="text-8xl filter drop-shadow-lg"
            style={{
              animation: 'bounce 2s infinite'
            }}
          >
            📍
          </div>
        </div>

        {/* Google Maps 로고 */}
        <div className="absolute top-3 right-3 bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          Google Maps
        </div>
      </div>

      {/* 지도 미리보기 (토글) */}
      {showMap && embedUrl && (
        <div className="relative bg-white" style={{ height: '300px' }}>
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onClick={(e) => e.stopPropagation()}
          />
          {/* 닫기 버튼 */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMap(false);
            }}
            className="absolute top-2 right-2 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* 위치 정보 영역 */}
      <div className="p-4 bg-white">
        <div className="flex items-start gap-2 mb-3">
          <span className="text-2xl">🗺️</span>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-sm line-clamp-2">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="flex gap-2">
          {embedUrl && !showMap && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMap(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-[var(--ui-success-bg)] text-[var(--ui-success-text)] py-2 px-4 rounded-lg font-medium text-sm hover:bg-[var(--ui-success-hover)] transition-colors"
            >
              <span>지도 미리보기</span>
            </button>
          )}
          <div className="flex-1 flex items-center justify-center gap-2 bg-[var(--ui-primary-bg)] text-[var(--ui-primary-text)] py-2 px-4 rounded-lg font-medium text-sm hover:bg-[var(--ui-primary-hover)] transition-colors">
            <span>지도에서 보기</span>
            <span>→</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </a>
  );
};

export default GoogleMapCard;

