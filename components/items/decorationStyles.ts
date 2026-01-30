import type { CSSProperties } from 'react';
import type { Decoration } from '../../types';

function shouldApplyDecoration(decoration?: Decoration): boolean {
  if (!decoration) return false;
  if (decoration.presetId && decoration.presetId !== 'none') return true;
  return !!(
    decoration.borderColor ||
    decoration.borderWidth ||
    decoration.borderRadius ||
    decoration.outlineStyle ||
    decoration.shadow ||
    decoration.tapeColor ||
    decoration.stickerSetId
  );
}

export function getDecorationWrapperStyle(decoration?: Decoration): CSSProperties | undefined {
  if (!shouldApplyDecoration(decoration)) return undefined;

  const borderColor = decoration?.borderColor ?? 'var(--ui-stroke-color, #330a0a)';
  const borderWidth = Math.min(8, Math.max(1, decoration?.borderWidth ?? 1));
  const borderRadius = Math.min(24, Math.max(0, decoration?.borderRadius ?? 12));
  const borderStyle = decoration?.outlineStyle ?? 'solid';

  const boxShadow =
    decoration?.shadow === 'hard'
      ? '0 10px 22px rgba(0,0,0,0.22)'
      : decoration?.shadow === 'soft'
        ? '0 6px 16px rgba(0,0,0,0.14)'
        : undefined;

  const presetId = decoration?.presetId ?? 'none';

  return {
    position: 'relative',
    boxSizing: 'border-box',
    borderStyle,
    borderWidth,
    borderColor,
    borderRadius,
    boxShadow,

    // Preset에서 pseudo를 바깥으로 내보내는 경우가 있어 visible 권장
    overflow: presetId === 'tape' || presetId === 'stickerCorners' ? 'visible' : undefined,

    // Preset에서 사용하는 CSS 변수들
    ['--decoration-border-color' as any]: borderColor,
    ['--decoration-tape-color' as any]: decoration?.tapeColor ?? 'rgba(255,255,255,0.65)',
  } as CSSProperties;
}

export function getDecorationDataAttrs(decoration?: Decoration): Record<string, string> {
  if (!shouldApplyDecoration(decoration)) return {};
  const presetId = decoration?.presetId ?? 'none';
  return presetId !== 'none' ? { 'data-decoration': presetId } : {};
}



