import { useRef, useState, useLayoutEffect } from 'react';

/**
 * 화면 자동 Fit 스케일 훅
 * - 디자인 고정 크기를 뷰포트에 맞춰 자동 스케일링
 * - ResizeObserver로 뷰포트 변화 감지
 */
export function useFitScale(designWidth: number, designHeight: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const calculateScale = (width: number, height: number) => {
      const scaleX = width / designWidth;
      const scaleY = height / designHeight;
      // 화면에 꽉 차도록 하되, 1을 넘지 않게
      const nextScale = Math.min(scaleX, scaleY, 1);
      return Number(nextScale.toFixed(4));
    };

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const nextScale = calculateScale(width, height);
      setScale(nextScale);
    });

    ro.observe(el);

    // 초기 계산
    const { width, height } = el.getBoundingClientRect();
    const initialScale = calculateScale(width, height);
    setScale(initialScale);

    return () => ro.disconnect();
  }, [designWidth, designHeight]);

  return { ref, scale };
}











