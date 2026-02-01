import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

interface EmbedPreviewModalProps {
  isOpen: boolean;
  url: string;
  title?: string;
  onClose: () => void;
}

function toYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '').trim();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
  } catch {
    // ignore
  }
  return null;
}

function toSpotifyEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('spotify.com')) {
      // https://open.spotify.com/track/ABC -> https://open.spotify.com/embed/track/ABC
      const path = u.pathname;
      if (!path.includes('/embed/')) {
        return `https://open.spotify.com/embed${path}`;
      }
      return url;
    }
  } catch {
    // ignore
  }
  return null;
}

function toSoundCloudEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('soundcloud.com')) {
      // https://soundcloud.com/artist/track -> https://w.soundcloud.com/player/?url=...
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
    }
  } catch {
    // ignore
  }
  return null;
}

function toPinterestEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('pinterest.com')) {
      // https://www.pinterest.com/pin/123456/ -> extract pin ID
      const match = u.pathname.match(/\/pin\/(\d+)/);
      if (match && match[1]) {
        return `https://assets.pinterest.com/ext/embed.html?id=${match[1]}`;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export default function EmbedPreviewModal({ isOpen, url, title, onClose }: EmbedPreviewModalProps) {
  const embedUrl = useMemo(() => {
    return (
      toYouTubeEmbedUrl(url) ??
      toSpotifyEmbedUrl(url) ??
      toSoundCloudEmbedUrl(url) ??
      toPinterestEmbedUrl(url) ??
      url
    );
  }, [url]);
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoaded(false);
    setTimedOut(false);
    const timeout = window.setTimeout(() => setTimedOut(true), 2000);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    // body scroll lock
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (!url) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/30"
      onClick={onClose}
      data-embed-preview-modal
    >
      <div
        className="w-[900px] max-w-[92vw] h-[80vh] border rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--widget-surface-background, #ffffff)',
          borderColor: 'var(--ui-stroke-color, #330a0a)',
          color: 'var(--text-color-primary, #764737)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b flex items-center gap-3"
          style={{ borderColor: 'var(--ui-stroke-color, #330a0a)' }}
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold truncate">{title || 'Link Preview'}</div>
            <div className="text-[11px] truncate" style={{ opacity: 0.8 }}>
              {url}
            </div>
          </div>

          <button
            className="px-3 py-1 text-xs rounded border transition-colors"
            style={{
              borderColor: 'var(--ui-stroke-color, #330a0a)',
              color: 'var(--text-color-primary, #764737)',
              backgroundColor: 'transparent',
            }}
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            title="새 탭으로 열기"
          >
            새 탭으로 열기
          </button>

          <button
            className="w-8 h-8 rounded border flex items-center justify-center"
            style={{
              borderColor: 'var(--ui-stroke-color, #330a0a)',
              color: 'var(--text-color-primary, #764737)',
              backgroundColor: 'transparent',
            }}
            onClick={onClose}
            aria-label="Close"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 bg-white relative" style={{ backgroundColor: 'var(--widget-surface-background, #ffffff)' }}>
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-xs" style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.8 }}>
                Loading…
              </div>
            </div>
          )}
          <iframe
            title={title || 'Embed Preview'}
            src={embedUrl}
            style={{ width: '100%', height: '100%', border: 0 }}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
          />
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 text-[10px] border-t" style={{ borderColor: 'var(--ui-stroke-color, #330a0a)' }}>
          {timedOut && !loaded ? (
            <div className="flex items-center justify-between gap-3">
              <div style={{ opacity: 0.85 }}>
                이 사이트는 보안정책으로 앱 내 미리보기를 허용하지 않습니다.
              </div>
              <button
                className="px-3 py-1 text-xs rounded border transition-colors"
                style={{
                  borderColor: 'var(--ui-stroke-color, #330a0a)',
                  color: 'var(--text-color-primary, #764737)',
                  backgroundColor: 'transparent',
                }}
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              >
                새 탭으로 열기
              </button>
            </div>
          ) : (
            <div style={{ opacity: 0.75 }}>
              일부 사이트는 보안 정책(X-Frame-Options/CSP)으로 앱 내부 미리보기가 제한될 수 있습니다. 이 경우 “새 탭으로 열기”를 사용하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}


