import React, { useMemo } from 'react';
import type {
  Decoration,
  DecorationOutlineStyle,
  DecorationPresetId,
  DecorationShadow,
  ScrapItem,
} from '../types';

interface LinkDecorationPanelProps {
  item: ScrapItem;
  onChangeDecoration: (next: Decoration) => void;
  onClose: () => void;
}

const PRESETS: Array<{ id: DecorationPresetId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'tape', label: 'Tape' },
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'lace', label: 'Lace' },
  { id: 'stickerCorners', label: 'Sticker Corners' },
];

const OUTLINE: DecorationOutlineStyle[] = ['solid', 'dashed', 'dotted'];
const SHADOW: DecorationShadow[] = ['none', 'soft', 'hard'];

const FRAME_PRESETS: Array<{ id: DecorationPresetId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'scallop_lace_clean', label: 'Lace (Clean)' },
  { id: 'pearl_thin', label: 'Pearl (Thin)' },
  { id: 'ribbon_top_thin', label: 'Ribbon Top (Thin)' },
  { id: 'ribbon_corners_thin', label: 'Ribbon Corners (Thin)' },
  { id: 'sticker_corners_thin', label: 'Sticker Corners (Thin)' },
  { id: 'polaroid_thin', label: 'Polaroid (Thin)' },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function LinkDecorationPanel({
  item,
  onChangeDecoration,
  onClose,
}: LinkDecorationPanelProps) {
  const decoration: Decoration = useMemo(() => {
    const d = item.metadata.decoration;
    return {
      presetId: d?.presetId ?? 'none',
      borderColor: d?.borderColor,
      borderWidth: d?.borderWidth,
      borderRadius: d?.borderRadius,
      outlineStyle: d?.outlineStyle,
      shadow: d?.shadow,
      tapeColor: d?.tapeColor,
      stickerSetId: d?.stickerSetId,
    };
  }, [item.metadata.decoration]);


  const panelStyle = useMemo<React.CSSProperties>(
    () => ({
      backgroundColor: 'var(--widget-surface-background, #ffffff)',
      borderColor: 'var(--ui-stroke-color, #330a0a)',
      color: 'var(--text-color-primary, #764737)',
    }),
    []
  );

  const set = (patch: Partial<Decoration>) => {
    onChangeDecoration({ ...decoration, ...patch, presetId: patch.presetId ?? decoration.presetId });
  };

  const borderColorText = decoration.borderColor ?? '';
  const borderColorForPicker =
    borderColorText.trim().startsWith('#') && borderColorText.trim().length >= 7 ? borderColorText.trim().slice(0, 7) : '#330a0a';

  return (
    <div
      className="fixed bottom-4 left-4 z-[9999] w-80 border rounded-xl shadow-2xl p-4 no-drag"
      style={panelStyle}
      data-decoration-panel
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: 'var(--ui-stroke-color, #330a0a)' }}>
        <div className="font-bold text-sm">🎀 링크/임베드 꾸미기</div>
        <button
          className="px-2 text-lg"
          style={{ color: 'var(--text-color-primary, #764737)' }}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold">FRAME / 프레임</label>
          <select
            className="w-full text-xs border rounded px-2 py-2 bg-transparent outline-none"
            style={{ borderColor: 'var(--ui-stroke-color, #330a0a)', color: 'var(--text-color-primary, #764737)' }}
            value={decoration.presetId}
            onChange={(e) => set({ presetId: e.target.value as DecorationPresetId })}
          >
            {FRAME_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold">Border Color</label>
            <span className="text-[10px]" style={{ opacity: 0.75, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
              {borderColorText || '(default)'}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={borderColorForPicker}
              onChange={(e) => set({ borderColor: e.target.value })}
              className="w-10 h-8 p-0 border-0 bg-transparent cursor-pointer"
              title="Pick hex color"
            />
            <input
              type="text"
              value={borderColorText}
              onChange={(e) => set({ borderColor: e.target.value })}
              placeholder="rgba(...) or #RRGGBB"
              className="flex-1 text-xs border rounded px-2 py-2 bg-transparent outline-none"
              style={{ borderColor: 'var(--ui-stroke-color, #330a0a)', color: 'var(--text-color-primary, #764737)' }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold">Border Width</label>
            <span className="text-[10px]" style={{ opacity: 0.75 }}>
              {(decoration.borderWidth ?? 1).toFixed(0)}px
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            value={clamp(decoration.borderWidth ?? 1, 1, 8)}
            onChange={(e) => set({ borderWidth: clamp(parseInt(e.target.value, 10), 1, 8) })}
            className="w-full h-1"
            style={{ accentColor: 'var(--text-color-primary, #764737)' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold">Border Radius</label>
            <span className="text-[10px]" style={{ opacity: 0.75 }}>
              {(decoration.borderRadius ?? 12).toFixed(0)}px
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={24}
            value={clamp(decoration.borderRadius ?? 12, 0, 24)}
            onChange={(e) => set({ borderRadius: clamp(parseInt(e.target.value, 10), 0, 24) })}
            className="w-full h-1"
            style={{ accentColor: 'var(--text-color-primary, #764737)' }}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-bold">Outline</label>
            <select
              className="w-full text-xs border rounded px-2 py-2 bg-transparent outline-none"
              style={{ borderColor: 'var(--ui-stroke-color, #330a0a)', color: 'var(--text-color-primary, #764737)' }}
              value={decoration.outlineStyle ?? 'solid'}
              onChange={(e) => set({ outlineStyle: e.target.value as DecorationOutlineStyle })}
            >
              {OUTLINE.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-bold">Shadow</label>
            <select
              className="w-full text-xs border rounded px-2 py-2 bg-transparent outline-none"
              style={{ borderColor: 'var(--ui-stroke-color, #330a0a)', color: 'var(--text-color-primary, #764737)' }}
              value={decoration.shadow ?? 'none'}
              onChange={(e) => set({ shadow: e.target.value as DecorationShadow })}
            >
              {SHADOW.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      <div className="mt-3 text-[10px]" style={{ opacity: 0.7 }}>
        - 적용은 카드 <b>최외곽 wrapper</b>에만 됩니다(내부 embed DOM 변경 없음).
      </div>
    </div>
  );
}


