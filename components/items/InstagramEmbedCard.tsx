import React, { useEffect, useRef, useState } from 'react';
import { ScrapMetadata } from '../../types';
import LinkCardFallback from './LinkCardFallback';

interface InstagramEmbedCardProps {
  data: ScrapMetadata;
}

/**
 * 🛡️ Instagram 공식 Embed 카드
 * 
 * - 공식 embeds.js 사용
 * - 실패 시 LinkCardFallback으로 대체
 * - 원문/이미지 저장 안 함 (Safe 모드)
 */
const InstagramEmbedCard: React.FC<InstagramEmbedCardProps> = ({ data }) => {
  const embedRef = useRef<HTMLDivElement>(null);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const DBG = !!import.meta.env.DEV && (typeof window !== 'undefined') && ((window as any).__DSD_DEBUG_DRAG ?? true);
  // decoration은 ItemRenderer의 “카드 외곽 컨테이너”에서만 적용한다(내부 embed DOM/renderer 무변경).

  useEffect(() => {
    if (!DBG) return;
    const instagramUrl = data.embed?.permalink || data.igPermalink || data.url;
    const dragActive = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
    console.debug('[instagramEmbed] MOUNT', { url: instagramUrl, dragActive });
    return () => {
      const dragActive2 = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
      console.debug('[instagramEmbed] UNMOUNT', { url: instagramUrl, dragActive: dragActive2 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Embed 로딩
  useEffect(() => {
    if (embedRef.current && (data.url || data.embed?.permalink) && !embedFailed) {
      const instagramUrl = data.embed?.permalink || data.igPermalink || data.url;
      if (DBG) {
        const dragActive = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
        console.debug('[instagramEmbed] effect RUN', { url: instagramUrl, embedFailed, dragActive });
      }
      
      // 공식 embeds.js 로드
      if (!(window as any).instgrm) {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        
        script.onload = () => {
          if ((window as any).instgrm) {
            try {
              (window as any).instgrm.Embeds.process();
            } catch (error) {
              console.error('❌ Instagram embed failed:', error);
              setEmbedFailed(true);
            }
          } else {
            setEmbedFailed(true);
          }
        };
        
        script.onerror = () => {
          console.error('❌ Instagram script load failed');
          setEmbedFailed(true);
        };
        
        document.head.appendChild(script);
      } else {
        // 이미 로드된 경우
        try {
          (window as any).instgrm.Embeds.process();
        } catch (error) {
          console.error('❌ Instagram embed failed:', error);
          setEmbedFailed(true);
        }
      }
    }
  }, [data.url, data.embed, data.igPermalink, embedFailed]);

  // Embed 실패 시 Fallback
  if (embedFailed) {
    return <LinkCardFallback data={data} />;
  }

  const instagramUrl = data.embed?.permalink || data.igPermalink || data.url;

  return (
    <div
      className={`relative bg-white shadow-xl rounded-lg overflow-hidden group ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      data-sns-embed="instagram"
      onPointerDown={(e) => {
        e.stopPropagation();
        setIsDragging(true);
      }}
      onPointerUp={() => setIsDragging(false)}
      onPointerLeave={() => setIsDragging(false)}
    >
      {/* Decorative Tape */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-8 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 rotate-3 shadow-md z-10 flex items-center justify-center">
        <span className="text-white text-2xl">📷</span>
      </div>

      {/* Instagram Embed Container */}
      <div
        ref={embedRef}
        className="instagram-embed-container sns-embed-content"
        data-sns-type="instagram"
        style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
      >
        {/* Instagram blockquote (공식 방식) */}
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={instagramUrl}
          data-instgrm-version="14"
          style={{
            background: '#FFF',
            border: 0,
            borderRadius: '3px',
            boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
            margin: '1px',
            maxWidth: '540px',
            minWidth: '326px',
            padding: 0,
            width: 'calc(100% - 2px)',
          }}
        />
      </div>

      {/* Safe Mode Badge */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
            🛡️ 안전 모드
          </span>
          <span>원본 콘텐츠는 Instagram에서 확인하세요</span>
        </div>
      </div>
    </div>
  );
};

export default InstagramEmbedCard;

