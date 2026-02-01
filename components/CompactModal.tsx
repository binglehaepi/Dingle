import React, { useEffect, useRef } from 'react';

interface CompactModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: { x: number; y: number }; // 클릭 위치 근처에 표시
}

/**
 * 컴팩트한 미니 모달 컴포넌트
 * - 검은색 오버레이 없음
 * - 패널 설정 색상 따라가기
 * - 작고 직관적인 UI
 */
export default function CompactModal({ isOpen, onClose, title, children, position }: CompactModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        ref={modalRef}
        className="relative rounded-lg border shadow-lg p-4 min-w-[200px] max-w-[320px] pointer-events-auto"
        style={{
          backgroundColor: 'var(--widget-surface-background, #ffffff)',
          borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          color: 'var(--text-color-primary, #764737)',
          ...(position
            ? {
                position: 'absolute',
                left: Math.min(position.x, window.innerWidth - 240),
                top: Math.min(position.y, window.innerHeight - 200),
              }
            : {}),
        }}
      >
        <div className="text-sm font-medium mb-3 text-center" style={{ color: 'inherit' }}>
          {title}
        </div>
        <div className="flex flex-col gap-2">{children}</div>
      </div>
    </div>
  );
}

