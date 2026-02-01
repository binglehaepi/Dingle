import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { openExternal } from '../utils/openExternal';

type Props = {
  isOpen: boolean;
  url: string;
  title?: string;
  onClose: () => void;
};

function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ignore
  }

  // fallback
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function ExternalLinkModal({ isOpen, url, title, onClose }: Props) {
  const safeUrl = useMemo(() => (isValidHttpUrl(url) ? url : ''), [url]);
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');

  useEffect(() => {
    if (!isOpen) return;
    setCopied('idle');

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center" onClick={onClose}>
      <div
        className="w-[520px] max-w-[92vw] border rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--widget-surface-background, #ffffff)',
          borderColor: 'var(--ui-stroke-color, #330a0a)',
          color: 'var(--text-color-primary, #764737)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--ui-stroke-color, #330a0a)' }}>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold truncate">{title || '원문 보기'}</div>
            <div className="text-[11px] truncate" style={{ opacity: 0.8 }}>
              {safeUrl || '유효하지 않은 URL'}
            </div>
          </div>
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
        <div className="px-4 py-4 flex flex-col gap-2">
          <div className="text-[11px]" style={{ opacity: 0.85 }}>
            앱 화면 이동 없이 새 창으로만 열 수 있어요.
          </div>

          <div
            className="px-3 py-2 rounded border text-[11px] break-all"
            style={{
              backgroundColor: 'var(--widget-input-background, rgba(248, 250, 252, 0.8))',
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            }}
          >
            {safeUrl || url}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 text-xs rounded border transition-colors disabled:opacity-50"
              style={{
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                color: 'inherit',
                backgroundColor: 'transparent',
              }}
              disabled={!safeUrl}
              onClick={async () => {
                setCopied('idle');
                const ok = await copyText(safeUrl);
                setCopied(ok ? 'ok' : 'fail');
                window.setTimeout(() => setCopied('idle'), 900);
              }}
            >
              {copied === 'ok' ? '복사됨' : copied === 'fail' ? '복사 실패' : '복사'}
            </button>

            <button
              className="px-3 py-1 text-xs rounded border transition-colors disabled:opacity-50"
              style={{
                borderColor: 'var(--ui-stroke-color, #330a0a)',
                color: 'inherit',
                backgroundColor: 'transparent',
              }}
              disabled={!safeUrl}
              onClick={async () => {
                await openExternal(safeUrl);
              }}
            >
              새 창 열기
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}





