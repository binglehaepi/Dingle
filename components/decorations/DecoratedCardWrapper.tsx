import React, { useEffect, useRef, useState } from 'react';
import DecorationPresetOverlay from '../decorations/DecorationPresetOverlay';

type Props = {
  presetId: string;
  shadow?: string;
  children: React.ReactNode;
  /** Optional, for debug only */
  debugItemId?: string;
};

/**
 * 카드 데코레이션 wrapper (중요: 컴포넌트 타입 안정화)
 * - ItemRenderer render 중에 inline component를 만들면 매 렌더마다 타입이 달라져 자식(embed)이 remount될 수 있다.
 * - 이 wrapper는 타입이 고정되어 드래그 중에도 embed가 재마운트되지 않게 한다.
 */
export default function DecoratedCardWrapper({ presetId, shadow, children, debugItemId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const DBG = !!import.meta.env.DEV && (typeof window !== 'undefined') && ((window as any).__DSD_DEBUG_DRAG ?? true);

  // padding: preset prefix 기반(요구사항 getPadding과 동일 규칙)
  const pad =
    presetId.startsWith('device_') ? 32 :
      presetId.startsWith('frame_') ? 20 :
        0;

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'visible',
    border: 'none',
    backgroundColor: 'transparent',
    padding: pad,
    boxShadow:
      shadow === 'soft'
        ? '0 6px 16px rgba(0,0,0,0.14)'
        : shadow === 'hard'
          ? '0 10px 22px rgba(0,0,0,0.22)'
          : undefined,
  };

  const contentStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 10,
    overflow: 'hidden',
    borderRadius: 12,
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      setSize((prev) => (prev.w === cw && prev.h === ch ? prev : { w: cw, h: ch }));
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!DBG) return;
    const dragActive = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
    console.debug('[decorWrapper] MOUNT', { itemId: debugItemId, presetId, dragActive });
    return () => {
      const dragActive2 = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
      console.debug('[decorWrapper] UNMOUNT', { itemId: debugItemId, presetId, dragActive: dragActive2 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      style={wrapperStyle}
      data-decoration-preset={presetId}
      {...(shadow ? { 'data-decoration-shadow': shadow } : {})}
    >
      <div style={contentStyle}>{children}</div>
      {size.w > 0 && size.h > 0 && (
        <DecorationPresetOverlay presetId={presetId as any} width={size.w} height={size.h} />
      )}
    </div>
  );
}
















