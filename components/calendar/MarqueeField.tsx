import React, { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  storageKey: string;
  placeholder?: string;
  className?: string;
};

const DEFAULT_PLACEHOLDER = '전광판 문구를 입력하세요...';

type MarqueeMetrics = {
  viewportWidth: number;
  textWidth: number;
};

/**
 * Calendar header marquee field
 * - Click to edit
 * - Blur/Enter to save
 * - Saved in localStorage
 * - ✅ Single sentence marquee: starts outside right → moves left → re-enters from right
 */
const MarqueeField: React.FC<Props> = ({ storageKey, placeholder = DEFAULT_PLACEHOLDER, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const xRef = useRef<number>(0);
  const metricsRef = useRef<MarqueeMetrics>({ viewportWidth: 0, textWidth: 0 });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (typeof saved === 'string') setValue(saved);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const trimmed = value.trim();
  const hasText = trimmed.length > 0;
  const shouldAnimate = !isEditing && hasText;

  const displayText = useMemo(() => trimmed, [trimmed]);
  const prefersReducedMotion = useMemo(() => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }, []);

  const save = () => {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // ignore
    }
  };

  const cancelAnimation = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTsRef.current = 0;
  };

  const measureAndReset = () => {
    const viewport = viewportRef.current;
    const textEl = textRef.current;
    if (!viewport || !textEl) return;

    const viewportWidth = Math.max(0, viewport.clientWidth || 0);
    const textWidth = Math.max(0, textEl.scrollWidth || 0);
    metricsRef.current = { viewportWidth, textWidth };
    xRef.current = viewportWidth; // start from outside right
    // apply immediately
    textEl.style.transform = `translateX(${xRef.current}px)`;
  };

  useEffect(() => {
    if (!hasText || isEditing) {
      cancelAnimation();
      return;
    }
    if (prefersReducedMotion) {
      cancelAnimation();
      return;
    }

    // Initial measure
    measureAndReset();

    const viewport = viewportRef.current;
    const textEl = textRef.current;
    if (!viewport || !textEl) return;

    // Observe size changes (window resize / layout changes)
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => {
        measureAndReset();
      });
      ro.observe(viewport);
      ro.observe(textEl);
    } catch {
      // ignore (ResizeObserver not available)
    }

    const speed = 60; // px/sec
    const tick = (ts: number) => {
      const { viewportWidth, textWidth } = metricsRef.current;
      if (!viewportWidth || !textWidth) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000); // cap dt
      lastTsRef.current = ts;

      xRef.current -= speed * dt;
      if (xRef.current <= -textWidth) {
        xRef.current = viewportWidth;
      }
      // mutate DOM directly (no rerender per frame)
      if (textRef.current) {
        textRef.current.style.transform = `translateX(${xRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimation();
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasText, isEditing, displayText, prefersReducedMotion, storageKey]);

  return (
    <div className={className} data-ui="calendar-marquee" style={{ color: 'inherit' }}>
      {isEditing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            save();
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              save();
              setIsEditing(false);
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              setIsEditing(false);
            }
          }}
          className="w-full min-w-0 bg-transparent outline-none text-[12px]"
          style={{ color: 'inherit' }}
          placeholder={placeholder}
        />
      ) : (
        <div
          className="w-full min-w-0 overflow-hidden cursor-text select-none"
          onClick={() => setIsEditing(true)}
          title={trimmed.length > 0 ? trimmed : placeholder}
        >
          {hasText ? (
            <div
              ref={viewportRef}
              className="w-full h-full overflow-hidden flex items-center"
              aria-label={displayText}
            >
              <span
                ref={textRef}
                className="inline-block whitespace-nowrap text-[12px]"
                style={{ color: 'inherit', opacity: 0.9, willChange: shouldAnimate ? 'transform' : undefined }}
              >
                {displayText}
              </span>
            </div>
          ) : (
            <div
              className="w-full text-center text-[12px] py-0.5"
              style={{ color: 'inherit', opacity: 0.6 }}
            >
              {placeholder}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarqueeField;


