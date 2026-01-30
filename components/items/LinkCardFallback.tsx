import React from 'react';
import { ScrapMetadata } from '../../types';
import { requestEmbedPreview } from '../../utils/embedPreview';
import { createLinkCardNavHandlers } from '../../utils/linkCardNav';

interface LinkCardFallbackProps {
  data: ScrapMetadata;
}

/**
 * 🛡️ 안전한 링크 카드 (Fallback)
 * 
 * SNS Embed 실패 시 또는 내보내기 안전 모드에서 사용
 * - 원문/이미지 없이 최소 정보만 표시
 * - preview 정보가 있으면 사용
 * - 없으면 플랫폼명 + 원본 링크
 */
const LinkCardFallback: React.FC<LinkCardFallbackProps> = ({ data }) => {
  const {
    platform,
    source,
    preview,
    title,
    subtitle,
    url,
    themeColor = '#64748b',
  } = data;

  // 표시할 정보 우선순위: preview > V1 필드 > 기본값
  const displayTitle = preview?.title || title || `${platform || 'Link'}`;
  const displaySubtitle = preview?.subtitle || subtitle || '';
  const displaySnippet = preview?.textSnippet || '';
  const displayUrl = source?.url || url;
  const nav = createLinkCardNavHandlers(displayUrl, displayTitle);

  // 플랫폼별 아이콘/색상
  const getPlatformIcon = () => {
    switch (platform) {
      case 'twitter':
        return '🐦';
      case 'instagram':
        return '📷';
      case 'pinterest':
        return '📌';
      case 'youtube':
        return '▶️';
      default:
        return '🔗';
    }
  };

  const getPlatformColor = () => {
    switch (platform) {
      case 'twitter':
        return '#1DA1F2';
      case 'instagram':
        return '#E4405F';
      case 'pinterest':
        return '#E60023';
      case 'youtube':
        return '#FF0000';
      default:
        return themeColor;
    }
  };

  const platformColor = getPlatformColor();
  const platformIcon = getPlatformIcon();

  return (
    <div 
      className="relative w-[380px] bg-white shadow-xl rounded-lg overflow-hidden border-2 group"
      style={{ borderColor: platformColor }}
    >
      {/* Decorative Tape */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-8 bg-white/80 backdrop-blur-sm rotate-3 shadow-md z-10 flex items-center justify-center"
        style={{ borderColor: platformColor, borderWidth: '1px' }}
      >
        <span className="text-2xl">{platformIcon}</span>
      </div>

      {/* Header */}
      <div 
        className="px-6 pt-8 pb-4"
        style={{ backgroundColor: `${platformColor}15` }}
      >
        <h3 className="font-bold text-lg text-gray-800 line-clamp-2">
          {displayTitle}
        </h3>
        {displaySubtitle && (
          <p className="text-sm text-gray-600 mt-1">
            {displaySubtitle}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        {displaySnippet && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {displaySnippet}
          </p>
        )}

        {/* Thumbnail (if available) */}
        {preview?.thumbnailUrl && (
          <div className="mb-4">
            <img 
              src={preview.thumbnailUrl} 
              alt="thumbnail"
              className="w-full h-48 object-cover rounded-lg"
              loading="lazy"
            />
          </div>
        )}

        {/* Original Link Button */}
        <button
          onClick={nav.onClick}
          onDoubleClick={nav.onDoubleClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all hover:scale-105 cursor-pointer"
          style={{ backgroundColor: platformColor }}
        >
          미리보기 →
        </button>

        {/* Safe Mode Badge */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
            🛡️ 안전 모드
          </span>
          <span>원본 콘텐츠는 {platform || 'source'}에서 확인하세요</span>
        </div>
      </div>

      {/* Expire Warning (if preview expired) */}
      {preview?.expiresAt && Date.now() > preview.expiresAt && (
        <div className="px-6 pb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
            ⚠️ 미리보기 정보가 만료되었습니다. 최신 정보는 원본 링크에서 확인하세요.
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkCardFallback;

