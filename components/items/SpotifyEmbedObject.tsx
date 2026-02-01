import React, { useState } from 'react';
import { ScrapMetadata } from '../../types';
import LinkCardFallback from './LinkCardFallback';

interface SpotifyEmbedObjectProps {
  data: ScrapMetadata;
}

// Spotify ID 추출
function extractSpotifyId(url: string): { type: string; id: string } | null {
  try {
    const match = url.match(/spotify\.com\/(track|album|playlist)\/([^?]+)/);
    if (match && match[1] && match[2]) {
      return { type: match[1], id: match[2] };
    }
    return null;
  } catch {
    return null;
  }
}

const SpotifyEmbedObject: React.FC<SpotifyEmbedObjectProps> = ({ data }) => {
  const [embedError, setEmbedError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  // URL에서 Spotify ID 추출
  const spotifyInfo = extractSpotifyId(data.url || '');

  // 🛡️ 방어: 유효하지 않은 URL
  if (!spotifyInfo) {
    return <LinkCardFallback data={data} />;
  }

  // 🛡️ 에러 발생 시 Fallback
  if (embedError) {
    return <LinkCardFallback data={data} />;
  }

  const { type, id } = spotifyInfo;
  const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;

  return (
    <div 
      className="relative w-full group" 
      data-embed="spotify"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* 로딩 중 */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-white rounded-xl flex items-center justify-center z-10"
          style={{ height: '352px' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-slate-300 border-t-green-500 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500">Spotify 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* Spotify iframe */}
      <iframe 
        style={{ 
          borderRadius: '12px',
          border: 'none',
        }}
        src={embedUrl}
        width="100%" 
        height="352" 
        frameBorder="0" 
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.error('Spotify iframe 로드 실패');
          setEmbedError(true);
          setIsLoading(false);
        }}
        title={data.title || 'Spotify Player'}
        className="spotify-embed-iframe"
      />

      {/* 호버 시 드래그/선택 가능 오버레이 */}
      {showOverlay && !isLoading && (
        <div 
          className="absolute inset-0 bg-black/5 backdrop-blur-[0.5px] rounded-xl transition-opacity"
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

export default SpotifyEmbedObject;

