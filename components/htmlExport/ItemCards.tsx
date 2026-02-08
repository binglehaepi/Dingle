/**
 * ItemCards — HTML 내보내기 전용 아이템 카드 컴포넌트 모음
 *
 * DesktopSpreadView, MobileView 양쪽에서 공용으로 사용.
 */

import React from 'react';
import { ScrapItem, ScrapType } from '../../types';

// ─── Constants ───────────────────────────────────────────────────

/** 1차 지원하지 않는 타입 목록 → placeholder */
const UNSUPPORTED_TYPES = new Set<string>([
  // ScrapType.TWITTER — TwitterCard로 지원
  ScrapType.INSTAGRAM,
  ScrapType.PINTEREST,
  ScrapType.SPOTIFY,
  ScrapType.SOUNDCLOUD,
  ScrapType.TIKTOK,
  ScrapType.VIMEO,
  ScrapType.FASHION,
  ScrapType.CHAT,
  ScrapType.TICKET,
  ScrapType.BOARDING,
  ScrapType.RECEIPT,
  ScrapType.TOPLOADER,
  ScrapType.CUPSLEEVE,
  ScrapType.MOVING_PHOTO,
  ScrapType.PROFILE,
  ScrapType.TODO,
  ScrapType.OHAASA,
  ScrapType.TAPE,
  ScrapType.BOOK,
]);

// ─── Helpers ─────────────────────────────────────────────────────

/** YouTube URL에서 videoId 추출 */
function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
  return match ? match[1] : null;
}

/** 트위터 URL에서 status ID 추출 */
function extractTwitterStatusId(url: string): string | null {
  // https://twitter.com/user/status/123456789
  // https://x.com/user/status/123456789
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

// ─── Item Card Components ────────────────────────────────────────

/** 이미지 카드 */
function ImageCard({ item }: { item: ScrapItem }) {
  const { metadata } = item;
  const imgSrc = metadata.imageUrl || '';
  return (
    <div className="dg-card dg-card--image">
      {imgSrc && (
        <div className="dg-card__image-wrap">
          <img src={imgSrc} alt={metadata.title || '이미지'} loading="lazy" />
        </div>
      )}
      {metadata.title && metadata.title !== metadata.url && (
        <div className="dg-card__body">
          <h4 className="dg-card__title">{metadata.title}</h4>
        </div>
      )}
      {metadata.url && (
        <a href={metadata.url} className="dg-card__link" target="_blank" rel="noopener noreferrer">
          원본 보기 →
        </a>
      )}
    </div>
  );
}

/** 텍스트/메모 카드 */
function NoteCard({ item }: { item: ScrapItem }) {
  const text = item.metadata.noteConfig?.text || item.metadata.textNoteConfig?.text || '';
  return (
    <div className="dg-card dg-card--note">
      <div className="dg-note__content">
        {text || '(빈 메모)'}
      </div>
    </div>
  );
}

/** YouTube 카드 */
function YouTubeCard({ item }: { item: ScrapItem }) {
  const { metadata } = item;
  const videoId = metadata.videoId || metadata.embed?.id || extractVideoId(metadata.url || '');
  const start = metadata.youtubeConfig?.startTime || 0;

  if (!videoId) {
    return <PlaceholderCard item={item} />;
  }

  const iframeSrc = `https://www.youtube.com/embed/${videoId}${start ? `?start=${start}` : ''}`;

  return (
    <div className="dg-card dg-card--youtube">
      <div className="dg-youtube__container">
        <iframe
          src={iframeSrc}
          title={metadata.title || 'YouTube'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {metadata.title && (
        <div className="dg-card__body">
          <h4 className="dg-card__title">{metadata.title}</h4>
        </div>
      )}
    </div>
  );
}

/** 트위터 embed 카드 */
function TwitterCard({ item }: { item: ScrapItem }) {
  const { metadata } = item;
  // status ID: embed.id > URL 파싱
  const statusId = metadata.embed?.id || extractTwitterStatusId(metadata.url || '') || extractTwitterStatusId(metadata.source?.url || '');

  if (!statusId) {
    // status ID를 알 수 없으면 링크 카드로 fallback
    return <PlaceholderCard item={item} />;
  }

  const tweetUrl = `https://twitter.com/i/status/${statusId}`;

  return (
    <div className="dg-card dg-card--twitter">
      <blockquote className="twitter-tweet" data-lang="ko" data-dnt="true">
        <a href={tweetUrl}>트윗 보기</a>
      </blockquote>
      {metadata.title && (
        <noscript>
          <div className="dg-card__body">
            <h4 className="dg-card__title">{metadata.title}</h4>
          </div>
        </noscript>
      )}
    </div>
  );
}

/** 스티커 카드 */
function StickerCard({ item }: { item: ScrapItem }) {
  const { metadata } = item;
  const hasImage = metadata.stickerConfig?.imageUrl;
  const emoji = metadata.stickerConfig?.emoji;

  return (
    <div className="dg-card dg-card--sticker">
      {hasImage ? (
        <img
          src={metadata.stickerConfig!.imageUrl!}
          alt={metadata.title || '스티커'}
          className="dg-sticker__image"
          loading="lazy"
        />
      ) : (
        <span className="dg-sticker__emoji">{emoji || '⭐'}</span>
      )}
    </div>
  );
}

/** 링크 카드 */
function LinkCard({ item }: { item: ScrapItem }) {
  const { metadata } = item;
  const title = metadata.preview?.title || metadata.title || metadata.url || '링크';
  const description = metadata.preview?.textSnippet || metadata.description || '';
  const thumbnailUrl = metadata.preview?.thumbnailUrl || metadata.imageUrl || '';
  const url = metadata.source?.url || metadata.url || '';
  const themeColor = metadata.themeColor || '#64748b';

  return (
    <div className="dg-card dg-card--link" style={{ borderLeftColor: themeColor }}>
      {thumbnailUrl && (
        <div className="dg-link__thumbnail">
          <img src={thumbnailUrl} alt="" loading="lazy" />
        </div>
      )}
      <div className="dg-card__body">
        <h4 className="dg-card__title">{title}</h4>
        {description && <p className="dg-card__desc">{description}</p>}
        {url && (
          <a href={url} className="dg-card__link" target="_blank" rel="noopener noreferrer">
            {(() => { try { return new URL(url).hostname; } catch { return '링크'; } })()} →
          </a>
        )}
      </div>
    </div>
  );
}

/** Placeholder (미지원 아이템) */
function PlaceholderCard({ item }: { item: ScrapItem }) {
  const { metadata } = item;
  const typeName = item.type || 'unknown';
  return (
    <div className="dg-card dg-card--placeholder">
      <div className="dg-placeholder__icon">📋</div>
      <p className="dg-placeholder__text">
        이 아이템은 딩글 앱에서 확인하세요
      </p>
      <span className="dg-placeholder__type">{typeName}</span>
      {metadata.url && (
        <a href={metadata.url} className="dg-card__link" target="_blank" rel="noopener noreferrer">
          원본 링크 열기 →
        </a>
      )}
    </div>
  );
}

/** 데코레이션 래퍼 — 앱의 [data-decoration] CSS와 동일 */
function DecorationWrapper({ item, children }: { item: ScrapItem; children: React.ReactNode }) {
  const decoration = item.metadata?.decoration;
  if (!decoration || decoration.presetId === 'none') {
    return <>{children}</>;
  }

  // tape, polaroid, lace, stickerCorners → data-decoration 속성으로 CSS 적용
  const cssPresets = ['tape', 'polaroid', 'lace', 'stickerCorners'];
  const presetId = decoration.presetId;

  // CSS pseudo-element 기반 프리셋
  if (cssPresets.includes(presetId)) {
    const wrapStyle: React.CSSProperties = {
      position: 'relative',
      overflow: 'visible',
      ...(decoration.borderColor ? { '--decoration-border-color': decoration.borderColor } as React.CSSProperties : {}),
      ...(decoration.tapeColor ? { '--decoration-tape-color': decoration.tapeColor } as React.CSSProperties : {}),
      ...(decoration.shadow === 'soft' ? { boxShadow: '0 6px 16px rgba(0,0,0,0.14)' } : {}),
      ...(decoration.shadow === 'hard' ? { boxShadow: '0 10px 22px rgba(0,0,0,0.22)' } : {}),
      ...(decoration.borderWidth ? { borderWidth: `${decoration.borderWidth}px` } : {}),
      ...(decoration.borderRadius !== undefined ? { borderRadius: `${decoration.borderRadius}px` } : {}),
      ...(decoration.borderColor ? { borderColor: decoration.borderColor } : {}),
    };
    return (
      <div data-decoration={presetId} style={wrapStyle}>
        {children}
      </div>
    );
  }

  // frame_*/device_* 프리셋 — 패딩 + 배경 + 테두리
  const isDevice = presetId.startsWith('device_');
  const isFrame = presetId.startsWith('frame_');
  if (isDevice || isFrame) {
    const pad = isDevice ? 32 : 20;
    const wrapStyle: React.CSSProperties = {
      position: 'relative',
      overflow: 'visible',
      backgroundColor: decoration.fillColor || 'transparent',
      border: `${decoration.strokeWidth || 1}px solid ${decoration.strokeColor || 'var(--ui-stroke-color, #330a0a)'}`,
      borderRadius: `${decoration.radius ?? 12}px`,
      padding: pad,
      ...(decoration.shadow === 'soft' ? { boxShadow: '0 6px 16px rgba(0,0,0,0.14)' } : {}),
      ...(decoration.shadow === 'hard' ? { boxShadow: '0 10px 22px rgba(0,0,0,0.22)' } : {}),
    };
    return (
      <div style={wrapStyle}>
        <div style={{ position: 'relative', zIndex: 10, overflow: 'hidden', borderRadius: 12 }}>
          {children}
        </div>
      </div>
    );
  }

  // 기타 프리셋 — 기본 래핑
  const fallbackStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'visible',
    ...(decoration.shadow === 'soft' ? { boxShadow: '0 6px 16px rgba(0,0,0,0.14)' } : {}),
    ...(decoration.shadow === 'hard' ? { boxShadow: '0 10px 22px rgba(0,0,0,0.22)' } : {}),
    ...(decoration.borderWidth ? { border: `${decoration.borderWidth}px ${decoration.outlineStyle || 'solid'} ${decoration.borderColor || 'var(--ui-stroke-color)'}` } : {}),
    ...(decoration.borderRadius !== undefined ? { borderRadius: `${decoration.borderRadius}px` } : {}),
  };
  return (
    <div style={fallbackStyle}>
      {children}
    </div>
  );
}

/** 아이템 렌더링 분기 */
export function ItemCard({ item }: { item: ScrapItem }) {
  let card: React.ReactNode;

  // 1. 텍스트/메모
  if (item.type === ScrapType.NOTE) {
    card = <NoteCard item={item} />;
  }
  // 2. YouTube
  else if (item.type === ScrapType.YOUTUBE) {
    card = <YouTubeCard item={item} />;
  }
  // 2.5. Twitter (X)
  else if (item.type === ScrapType.TWITTER) {
    card = <TwitterCard item={item} />;
  }
  // 3. 스티커
  else if (item.type === ScrapType.STICKER) {
    card = <StickerCard item={item} />;
  }
  // 4. 미지원 SNS/특수 타입 → placeholder
  else if (UNSUPPORTED_TYPES.has(item.type)) {
    card = <PlaceholderCard item={item} />;
  }
  // 5. 이미지가 있는 일반 아이템 → 이미지 카드
  else if (item.metadata.imageUrl) {
    card = <ImageCard item={item} />;
  }
  // 6. URL이 있는 아이템 → 링크 카드
  else if (item.metadata.url) {
    card = <LinkCard item={item} />;
  }
  // 7. 기본 fallback
  else {
    card = <PlaceholderCard item={item} />;
  }

  // 데코레이션 래핑
  return (
    <DecorationWrapper item={item}>
      {card}
    </DecorationWrapper>
  );
}


