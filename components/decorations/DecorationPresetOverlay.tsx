import React, { useMemo } from 'react';
import type { DecorationPresetId } from '../../types';

export interface DecorationPresetOverlayProps {
  presetId: DecorationPresetId;
  width: number;
  height: number;
  className?: string;
}

const strokeColor = 'var(--ui-stroke-color, #330a0a)';
const fillColor = 'var(--widget-surface-background, #fff)';
const accentColor = 'var(--ui-primary-bg, #ffb7b2)';

const commonProps = {
  vectorEffect: 'non-scaling-stroke' as const,
  strokeWidth: 1,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const round05 = (n: number) => Math.round(n * 2) / 2;

const getPadding = (id: DecorationPresetId) => {
  if (typeof id === 'string' && id.startsWith('device_')) return 32;
  if (typeof id === 'string' && id.startsWith('frame_')) return 20;
  return 0;
};

// RoundRect path with 0.5 alignment
function roundRectPath(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  const x0 = round05(x);
  const y0 = round05(y);
  const w0 = round05(w);
  const h0 = round05(h);
  const r0 = round05(rr);
  return [
    `M ${x0 + r0},${y0}`,
    `h ${w0 - r0 * 2}`,
    `a ${r0},${r0} 0 0 1 ${r0},${r0}`,
    `v ${h0 - r0 * 2}`,
    `a ${r0},${r0} 0 0 1 -${r0},${r0}`,
    `h -${w0 - r0 * 2}`,
    `a ${r0},${r0} 0 0 1 -${r0},-${r0}`,
    `v -${h0 - r0 * 2}`,
    `a ${r0},${r0} 0 0 1 ${r0},-${r0}`,
    'Z',
  ].join(' ');
}

// Evenodd windowed path: outer + inner (hole)
function createWindowedPath(outerPath: string, w: number, h: number, p: number, innerRadius: number) {
  const ix = round05(p + 0.5);
  const iy = round05(p + 0.5);
  const iw = round05(Math.max(0, w - p * 2 - 1));
  const ih = round05(Math.max(0, h - p * 2 - 1));
  const inner = roundRectPath(ix, iy, iw, ih, innerRadius);
  return `${outerPath} ${inner}`;
}

function createScallopBorder(w: number, h: number, inset: number, scallopR: number) {
  // 간단 scallop: 상/하만 반복 arc (얇은 벡터 느낌)
  const x0 = inset + 0.5;
  const x1 = w - inset - 0.5;
  const yTop = inset + 0.5;
  const yBot = h - inset - 0.5;
  const step = scallopR * 2;

  const topParts: string[] = [];
  for (let x = x0 + scallopR; x + scallopR <= x1; x += step) {
    topParts.push(`M ${round05(x - scallopR)},${round05(yTop)}`);
    topParts.push(`a ${scallopR},${scallopR} 0 0 1 ${scallopR},-${scallopR}`);
    topParts.push(`a ${scallopR},${scallopR} 0 0 1 ${scallopR},${scallopR}`);
  }

  const botParts: string[] = [];
  for (let x = x0 + scallopR; x + scallopR <= x1; x += step) {
    botParts.push(`M ${round05(x - scallopR)},${round05(yBot)}`);
    botParts.push(`a ${scallopR},${scallopR} 0 0 0 ${scallopR},${scallopR}`);
    botParts.push(`a ${scallopR},${scallopR} 0 0 0 ${scallopR},-${scallopR}`);
  }

  return `${topParts.join(' ')} ${botParts.join(' ')}`;
}

const normalizePreset = (id: DecorationPresetId): DecorationPresetId => {
  // legacy -> new IDs
  if (id === 'lace' || id === 'scallop_lace' || id === 'scallop_lace_clean' || id === 'wavy_frame' || id === 'heart_lace') return 'frame_scallop_lace';
  if (id === 'pearls' || id === 'pearl' || id === 'pearl_thin') return 'frame_pearl_border';
  if (id === 'ribbon' || id === 'ribbon_top' || id === 'ribbon_top_thin') return 'frame_bow_top';
  if (id === 'ribbon_corners' || id === 'ribbon_corners_thin') return 'frame_bow_corners';
  if (id === 'polaroid' || id === 'polaroid_thin') return 'frame_simple_round';
  // 요구사항: stickerCorners는 (없으면 none) → 최소회귀로 none 처리
  if (id === 'stickerCorners' || id === 'sticker_corners' || id === 'sticker_corners_thin') return 'none';
  return id;
};

export const DecorationPresetOverlay: React.FC<DecorationPresetOverlayProps> = ({
  presetId,
  width,
  height,
  className,
}) => {
  const id = useMemo(() => normalizePreset(presetId), [presetId]);
  if (id === 'none') return null;

  const w = Math.max(0, Math.floor(width));
  const h = Math.max(0, Math.floor(height));
  if (w <= 2 || h <= 2) return null;

  const p = getPadding(id);

  const outerRect = useMemo(() => {
    // outer는 “전체 영역”을 채우는 사각형(0.5 정렬) — window는 innerRect로 뚫는다
    return `M 0.5,0.5 h ${round05(w - 1)} v ${round05(h - 1)} h -${round05(w - 1)} Z`;
  }, [w, h]);

  const innerRadius = id.startsWith('device_') ? 8 : 10;
  const windowedPath = useMemo(() => createWindowedPath(outerRect, w, h, p, innerRadius), [outerRect, w, h, p, innerRadius]);

  const renderDetails = () => {
    switch (id) {
      // --- Frame Series ---
      case 'frame_simple_round': {
        // 작은 “나사” 4개(선명하게 0.5 정렬)
        const r = 1.5;
        return (
          <>
            <circle cx={6.5} cy={6.5} r={r} fill={strokeColor} stroke="none" />
            <circle cx={w - 6.5} cy={6.5} r={r} fill={strokeColor} stroke="none" />
            <circle cx={6.5} cy={h - 6.5} r={r} fill={strokeColor} stroke="none" />
            <circle cx={w - 6.5} cy={h - 6.5} r={r} fill={strokeColor} stroke="none" />
          </>
        );
      }
      case 'frame_scallop_lace': {
        const scallopPath = createScallopBorder(w, h, 10, 5);
        return (
          <>
            <path d={scallopPath} fill="none" stroke={strokeColor} {...commonProps} opacity={0.9} shapeRendering="geometricPrecision" />
            <path
              d={roundRectPath(p + 0.5 + 6, p + 0.5 + 6, w - (p + 6) * 2 - 1, h - (p + 6) * 2 - 1, 10)}
              fill="none"
              stroke={strokeColor}
              {...commonProps}
              opacity={0.6}
              shapeRendering="geometricPrecision"
            />
          </>
        );
      }
      case 'frame_pearl_border': {
        const pearls: React.ReactNode[] = [];
        const gap = 10;
        const rr = 1.5;
        for (let x = p + 12; x <= w - p - 12; x += gap) {
          pearls.push(
            <circle key={`t-${x}`} cx={round05(x)} cy={round05(p / 2 + 0.5)} r={rr} fill={fillColor} stroke={strokeColor} {...commonProps} />
          );
          pearls.push(
            <circle key={`b-${x}`} cx={round05(x)} cy={round05(h - p / 2 - 0.5)} r={rr} fill={fillColor} stroke={strokeColor} {...commonProps} />
          );
        }
        for (let y = p + 18; y <= h - p - 18; y += gap) {
          pearls.push(
            <circle key={`l-${y}`} cx={round05(p / 2 + 0.5)} cy={round05(y)} r={rr} fill={fillColor} stroke={strokeColor} {...commonProps} />
          );
          pearls.push(
            <circle key={`r-${y}`} cx={round05(w - p / 2 - 0.5)} cy={round05(y)} r={rr} fill={fillColor} stroke={strokeColor} {...commonProps} />
          );
        }
        return <>{pearls}</>;
      }
      case 'frame_bow_top': {
        const cx = round05(w / 2);
        const y = 0.5;
        return (
          <g>
            {/* bow */}
            <path
              d={`M ${cx - 18},${y + 16} Q ${cx - 28},${y + 6} ${cx - 18},${y + 26} Q ${cx - 8},${y + 16} ${cx - 18},${y + 16} Z`}
              fill={accentColor}
              stroke={strokeColor}
              {...commonProps}
              shapeRendering="geometricPrecision"
            />
            <path
              d={`M ${cx + 18},${y + 16} Q ${cx + 28},${y + 6} ${cx + 18},${y + 26} Q ${cx + 8},${y + 16} ${cx + 18},${y + 16} Z`}
              fill={accentColor}
              stroke={strokeColor}
              {...commonProps}
              shapeRendering="geometricPrecision"
            />
            <circle cx={cx} cy={y + 16} r={6} fill={accentColor} stroke={strokeColor} {...commonProps} />
          </g>
        );
      }
      case 'frame_bow_corners': {
        const bow = (x: number, y: number) => (
          <g key={`${x}-${y}`} transform={`translate(${round05(x)},${round05(y)})`}>
            <path d="M 0,10 Q -10,2 0,18 Q 10,10 0,10 Z" fill={accentColor} stroke={strokeColor} {...commonProps} shapeRendering="geometricPrecision" />
            <circle cx={10} cy={10} r={4} fill={accentColor} stroke={strokeColor} {...commonProps} />
          </g>
        );
        return (
          <>
            {bow(p + 10, p + 4)}
            {bow(w - p - 30, p + 4)}
            {bow(p + 10, h - p - 26)}
            {bow(w - p - 30, h - p - 26)}
          </>
        );
      }

      // --- Device Series ---
      case 'device_ds': {
        // d-pad + buttons (모두 strokeWidth=1 유지)
        const baseX = p + 14.5;
        const baseY = h - p - 18.5;
        const btnX = w - p - 18.5;
        const btnY = h - p - 18.5;
        return (
          <>
            <path d={`M ${baseX},${baseY} h 14 m -7 -7 v 14`} fill="none" stroke={strokeColor} {...commonProps} />
            <circle cx={btnX} cy={btnY} r={4} fill={accentColor} stroke={strokeColor} {...commonProps} />
            <circle cx={btnX - 10} cy={btnY + 8} r={4} fill={accentColor} stroke={strokeColor} {...commonProps} />
          </>
        );
      }
      case 'device_gameboy': {
        // speaker slashes
        const x = w - p - 28.5;
        const y = h - p - 20.5;
        return (
          <>
            <path d={`M ${x},${y} l 16,-10`} fill="none" stroke={strokeColor} {...commonProps} />
            <path d={`M ${x - 6},${y} l 16,-10`} fill="none" stroke={strokeColor} {...commonProps} />
            <circle cx={p + 18.5} cy={h - p - 22.5} r={5} fill={accentColor} stroke={strokeColor} {...commonProps} />
          </>
        );
      }
      case 'device_camera': {
        const cx = round05(w / 2);
        const cy = round05(p + 18.5);
        return (
          <>
            <rect x={round05(p + 10.5)} y={round05(p + 8.5)} width={round05(w - (p + 10) * 2 - 1)} height={round05(26)} rx={8} fill={fillColor} stroke={strokeColor} {...commonProps} />
            <circle cx={cx} cy={cy} r={8} fill={fillColor} stroke={strokeColor} {...commonProps} />
            <circle cx={cx} cy={cy} r={4} fill={accentColor} stroke={strokeColor} {...commonProps} />
          </>
        );
      }
      case 'device_tamagotchi': {
        const cx = round05(w / 2);
        const cy = round05(h - p - 18.5);
        return (
          <>
            <circle cx={cx} cy={cy} r={4} fill={accentColor} stroke={strokeColor} {...commonProps} />
            <circle cx={cx - 12} cy={cy + 6} r={4} fill={accentColor} stroke={strokeColor} {...commonProps} />
            <circle cx={cx + 12} cy={cy + 6} r={4} fill={accentColor} stroke={strokeColor} {...commonProps} />
          </>
        );
      }
      case 'device_tv': {
        const ax = w - p - 18.5;
        const ay = p + 10.5;
        return (
          <>
            <path d={`M ${p + 18.5},${p + 12.5} l -8,-10`} fill="none" stroke={strokeColor} {...commonProps} />
            <path d={`M ${p + 18.5},${p + 12.5} l 8,-10`} fill="none" stroke={strokeColor} {...commonProps} />
            <circle cx={ax} cy={ay} r={3.5} fill={accentColor} stroke={strokeColor} {...commonProps} />
            <circle cx={ax} cy={ay + 10} r={3.5} fill={accentColor} stroke={strokeColor} {...commonProps} />
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <svg
      data-decoration-overlay="1"
      data-decoration-preset={id}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}
    >
      <path d={windowedPath} fill={fillColor} stroke={strokeColor} fillRule="evenodd" {...commonProps} />
      {renderDetails()}
    </svg>
  );
};

export default DecorationPresetOverlay;


