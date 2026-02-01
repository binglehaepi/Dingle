import React, { useState } from 'react';
import { ScrapMetadata } from '../../types';
import LinkCardFallback from './LinkCardFallback';

interface SoundCloudEmbedObjectProps {
  data: ScrapMetadata;
}

// SoundCloud URL 검증
function isValidSoundCloudUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('soundcloud.com');
  } catch {
    return false;
  }
}

const SoundCloudEmbedObject: React.FC<SoundCloudEmbedObjectProps> = ({ data }) => {
  const [embedError, setEmbedError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  // 🛡️ 방어: 유효하지 않은 URL
  if (!isValidSoundCloudUrl(data.url || '')) {
    return <LinkCardFallback data={data} />;
  }

  // 🛡️ 에러 발생 시 Fallback
  if (embedError) {
    return <LinkCardFallback data={data} />;
  }

  // oEmbed에서 받은 URL 사용 (우선순위)
  const embedUrl = data.soundcloudEmbedUrl || 
    (data.embedHtml ? null : `https://w.soundcloud.com/player/?url=${encodeURIComponent(data.url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`);

  // embedHtml이 있고 embedUrl이 없으면 직접 HTML 렌더링
  if (data.embedHtml && !embedUrl) {
    return (
      <div 
        className="soundcloud-embed-wrapper relative w-full"
        data-embed="soundcloud"
        dangerouslySetInnerHTML={{ __html: data.embedHtml }}
        style={{ minHeight: '166px' }}
      />
    );
  }

  return (
    <div 
      className="relative w-full group" 
      data-embed="soundcloud"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* 로딩 중 */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-white rounded-lg flex items-center justify-center z-10"
          style={{ height: '166px' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-slate-300 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500">SoundCloud 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* SoundCloud iframe */}
      <iframe 
        width="100%" 
        height="166"
        scrolling="no" 
        frameBorder="no"
        allow="autoplay"
        src={embedUrl}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.error('SoundCloud iframe 로드 실패');
          setEmbedError(true);
          setIsLoading(false);
        }}
        title={data.title || 'SoundCloud Player'}
        className="soundcloud-embed-iframe"
        style={{
          border: 'none',
          borderRadius: '8px',
        }}
      />

      {/* 호버 시 드래그/선택 가능 오버레이 */}
      {showOverlay && !isLoading && (
        <div 
          className="absolute inset-0 bg-black/5 backdrop-blur-[0.5px] rounded-lg transition-opacity"
          style={{ 
            zIndex: 20,
            cursor: 'grab',
            pointerEvents: 'auto',
          }}
          title="클릭하여 선택/드래그"
        />
      )}
    </div>
  );
};

export default SoundCloudEmbedObject;

