import { requestEmbedPreview } from './embedPreview';

type Handlers = {
  onClick: (e: any) => void;
  onDoubleClick: (e: any) => void;
};

/**
 * 링크/임베드 카드 공통 네비게이션 UX (최소회귀)
 * - 단일 클릭: confirm → 예면 새 탭
 * - 더블클릭: 앱 내부 모달 프리뷰
 * - 더블클릭 시 단일클릭 confirm이 먼저 뜨지 않도록, 클릭은 짧게 지연시켜 처리한다.
 * - 드래그/리사이즈 중 오동작 방지: window.__dsd_isInteracting / __dsd_isDraggingItem 플래그가 true면 무시
 */
export function createLinkCardNavHandlers(url: string, title?: string): Handlers {
  let clickTimer: any = null;

  const isInteracting = () => {
    try {
      const w: any = window as any;
      return !!(w.__dsd_isInteracting || w.__dsd_isDraggingItem);
    } catch {
      return false;
    }
  };

  const clear = () => {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
  };

  const onClick = (e: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!url) return;
    if (isInteracting()) return;

    // 더블클릭과 충돌 방지: 클릭 confirm은 약간 지연
    clear();
    clickTimer = setTimeout(() => {
      clickTimer = null;
      if (isInteracting()) return;
      const ok = window.confirm('외부 사이트로 이동할까요?');
      if (!ok) return;
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch {
        // ignore
      }
    }, 220);
  };

  const onDoubleClick = (e: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!url) return;
    if (isInteracting()) return;
    clear();
    requestEmbedPreview({ url, title, trigger: 'dblclick' });
  };

  return { onClick, onDoubleClick };
}



