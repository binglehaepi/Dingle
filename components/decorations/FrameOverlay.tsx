import React from 'react';

export type FrameOverlayPresetId = 'none' | 'pearl' | 'lace' | 'ribbon';

export interface FrameOverlayProps {
  presetId: FrameOverlayPresetId;
  padding?: number; // px (default 10)
  opacity?: number; // 0~1 (default 1)
  color?: string; // CSS color / var(...) allowed
  customFrameUrl?: string; // png/svg url
}

const DEFAULT_STROKE = 'var(--ui-stroke-color, #330a0a)';

export default function FrameOverlay(props: FrameOverlayProps) {
  const { presetId, padding = 10, opacity = 1, color, customFrameUrl } = props;

  // URL이 있으면 presetId와 무관하게(= 우선) 렌더한다.
  if (presetId === 'none' && !customFrameUrl) return null;

  const stroke = color || DEFAULT_STROKE;
  const commonStyle: React.CSSProperties = {
    position: 'absolute',
    top: -padding,
    right: -padding,
    bottom: -padding,
    left: -padding,
    opacity,
    pointerEvents: 'none',
    zIndex: 9999,
  };

  if (customFrameUrl) {
    return (
      <div
        aria-hidden
        style={{
          ...commonStyle,
          backgroundImage: `url(${customFrameUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '100% 100%',
        }}
      />
    );
  }

  // SVG presets (demo quality, stroke-only, no fill)
  const svgProps = {
    width: '100%',
    height: '100%',
    viewBox: '0 0 100 100',
    preserveAspectRatio: 'none' as const,
    style: { display: 'block' },
  };

  if (presetId === 'pearl') {
    // Simple border + pearl dots
    const dots: React.ReactNode[] = [];
    const step = 6;
    for (let x = 6; x <= 94; x += step) {
      dots.push(<circle key={`t-${x}`} cx={x} cy={4} r={1.2} stroke={stroke} />);
      dots.push(<circle key={`b-${x}`} cx={x} cy={96} r={1.2} stroke={stroke} />);
    }
    for (let y = 10; y <= 90; y += step) {
      dots.push(<circle key={`l-${y}`} cx={4} cy={y} r={1.2} stroke={stroke} />);
      dots.push(<circle key={`r-${y}`} cx={96} cy={y} r={1.2} stroke={stroke} />);
    }

    return (
      <div aria-hidden style={commonStyle}>
        <svg {...svgProps}>
          <rect x={3} y={3} width={94} height={94} rx={6} ry={6} fill="none" stroke={stroke} strokeWidth={1.6} />
          {/* pearls */}
          {dots}
        </svg>
      </div>
    );
  }

  if (presetId === 'lace') {
    // Scalloped border + dotted line feel
    return (
      <div aria-hidden style={commonStyle}>
        <svg {...svgProps}>
          {/* outer thin line */}
          <rect x={4} y={4} width={92} height={92} rx={8} ry={8} fill="none" stroke={stroke} strokeWidth={1.2} />

          {/* scallops (top & bottom) */}
          <path
            d="M6,9
               Q9,5 12,9 T18,9 T24,9 T30,9 T36,9 T42,9 T48,9 T54,9 T60,9 T66,9 T72,9 T78,9 T84,9 T90,9 T94,9"
            fill="none"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
          <path
            d="M6,91
               Q9,95 12,91 T18,91 T24,91 T30,91 T36,91 T42,91 T48,91 T54,91 T60,91 T66,91 T72,91 T78,91 T84,91 T90,91 T94,91"
            fill="none"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinecap="round"
          />

          {/* scallops (left & right) */}
          <path
            d="M9,6
               Q5,9 9,12 T9,18 T9,24 T9,30 T9,36 T9,42 T9,48 T9,54 T9,60 T9,66 T9,72 T9,78 T9,84 T9,90 T9,94"
            fill="none"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
          <path
            d="M91,6
               Q95,9 91,12 T91,18 T91,24 T91,30 T91,36 T91,42 T91,48 T91,54 T91,60 T91,66 T91,72 T91,78 T91,84 T91,90 T91,94"
            fill="none"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinecap="round"
          />

          {/* dotted inner border */}
          <rect
            x={10}
            y={10}
            width={80}
            height={80}
            rx={10}
            ry={10}
            fill="none"
            stroke={stroke}
            strokeWidth={1.1}
            strokeDasharray="1.5 3"
            opacity={0.9}
          />
        </svg>
      </div>
    );
  }

  // ribbon
  return (
    <div aria-hidden style={commonStyle}>
      <svg {...svgProps}>
        {/* border */}
        <rect x={5} y={5} width={90} height={90} rx={10} ry={10} fill="none" stroke={stroke} strokeWidth={1.4} />

        {/* corner bows (4) - simple loops + tails */}
        {/* top-left */}
        <path
          d="M12 14
             C8 10, 6 16, 10 18
             C6 20, 8 26, 12 22
             C16 26, 18 20, 14 18
             C18 16, 16 10, 12 14
             M12 18 L6 26
             M12 18 L18 26"
          fill="none"
          stroke={stroke}
          strokeWidth={1.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* top-right */}
        <path
          d="M88 14
             C92 10, 94 16, 90 18
             C94 20, 92 26, 88 22
             C84 26, 82 20, 86 18
             C82 16, 84 10, 88 14
             M88 18 L94 26
             M88 18 L82 26"
          fill="none"
          stroke={stroke}
          strokeWidth={1.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* bottom-left */}
        <path
          d="M12 86
             C8 90, 6 84, 10 82
             C6 80, 8 74, 12 78
             C16 74, 18 80, 14 82
             C18 84, 16 90, 12 86
             M12 82 L6 74
             M12 82 L18 74"
          fill="none"
          stroke={stroke}
          strokeWidth={1.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* bottom-right */}
        <path
          d="M88 86
             C92 90, 94 84, 90 82
             C94 80, 92 74, 88 78
             C84 74, 82 80, 86 82
             C82 84, 84 90, 88 86
             M88 82 L94 74
             M88 82 L82 74"
          fill="none"
          stroke={stroke}
          strokeWidth={1.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}


