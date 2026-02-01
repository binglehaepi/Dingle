import React, { useState } from 'react';
import { UIPalette, UITokens } from '../types';
import { DEFAULT_UI_PALETTE, DEFAULT_UI_TOKENS } from '../constants/appConstants';
import { migrateDiaryStyle } from '../utils/theme';

type NotePaperBackgroundFit = 'contain' | 'cover' | 'zoom';

interface PaletteEditorModalProps {
  isOpen: boolean;
  currentPalette: UIPalette;
  currentUiTokens: UITokens;
  currentDashboardUseNotePaperOverride?: boolean;
  currentDashboardNotePaperBackground?: string;
  currentNotePaperBackgroundImage?: string;
  currentNotePaperBackgroundFit?: NotePaperBackgroundFit;
  currentNotePaperBackgroundZoom?: number;
  currentCenterShadowEnabled?: boolean;
  currentCenterShadowColor?: string;
  currentCenterShadowOpacity?: number;
  currentCenterShadowWidth?: number;
  onClose: () => void;
  onSave: (data: {
    palette: UIPalette;
    uiTokens: UITokens;
    dashboardUseNotePaperOverride: boolean;
    dashboardNotePaperBackground?: string;
    notePaperBackgroundImage?: string;
    notePaperBackgroundFit?: NotePaperBackgroundFit;
    notePaperBackgroundZoom?: number;
    centerShadowEnabled: boolean;
    centerShadowColor?: string;
    centerShadowOpacity: number;
    centerShadowWidth: number;
  }) => void;
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

// ✅ "선 색(통일)" 마스터 동기화:
// - strokeColor 변경 시, 테두리 계열 팔레트 키들을 같이 갱신해서 사용자가 체감하는 "통일"을 만든다.
// - noteCenterFoldLineColor 같은 장식선은 제외(요구사항).
export function syncStrokeToBorders(palette: UIPalette, strokeColor: string): UIPalette {
  return {
    ...palette,
    strokeColor,
    noteOuterBorderColor: strokeColor,
    widgetBorderColor: strokeColor,
    calendarGridLineColor: strokeColor,
    monthTabBorderColor: strokeColor,
    keyringFrameBorderColor: strokeColor,
  };
}

// Hex to RGBA
const hexToRgba = (hex: string): { r: number; g: number; b: number; a: number } => {
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
      a: 1,
    };
  } else if (clean.length === 8) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
      a: parseInt(clean.slice(6, 8), 16) / 255,
    };
  }
  return { r: 255, g: 255, b: 255, a: 1 };
};

// RGBA to Hex
const rgbaToHex = (r: number, g: number, b: number, a: number): string => {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  if (a < 1) return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a * 255)}`;
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange, description }) => {
  const rgba = hexToRgba(value);
  const alphaPercent = Math.round(rgba.a * 100);

  const handleColorChange = (newColor: string) => {
    const newRgba = hexToRgba(newColor);
    onChange(rgbaToHex(newRgba.r, newRgba.g, newRgba.b, rgba.a));
  };

  const handleAlphaChange = (newAlpha: number) => {
    onChange(rgbaToHex(rgba.r, rgba.g, rgba.b, newAlpha / 100));
  };

  const handleTextChange = (text: string) => {
    if (text.startsWith('#')) onChange(text);
  };

  // color input은 alpha 미지원 → RGB만
  const colorOnly = `#${rgba.r.toString(16).padStart(2, '0')}${rgba.g
    .toString(16)
    .padStart(2, '0')}${rgba.b.toString(16).padStart(2, '0')}`;

  return (
    <div className="flex flex-col gap-1 py-1.5">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={colorOnly}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer flex-shrink-0 border"
          style={{
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
          }}
        />

        <label
          className="text-sm flex-1 min-w-[120px]"
          style={{ color: 'var(--text-color-primary, #764737)' }}
        >
          {label}
        </label>

        <input
          type="text"
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-24 px-2 py-1 text-xs font-mono border rounded outline-none"
          placeholder="#RRGGBBAA"
          maxLength={9}
          style={{
            backgroundColor: 'var(--widget-input-background, #f8fafc)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            color: 'var(--text-color-primary, #764737)',
          }}
        />

        <div className="flex items-center gap-1">
          <input
            type="range"
            min="0"
            max="100"
            value={alphaPercent}
            onChange={(e) => handleAlphaChange(parseInt(e.target.value))}
            className="w-16 h-1"
            style={{ accentColor: 'var(--text-color-primary, #764737)' }}
          />
          <span
            className="text-xs w-9 text-right"
            style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.7 }}
          >
            {alphaPercent}%
          </span>
        </div>
      </div>

      {description && (
        <p
          className="text-[10px] ml-10 italic"
          style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.65 }}
        >
          {description}
        </p>
      )}
    </div>
  );
};

const PaletteEditorModal: React.FC<PaletteEditorModalProps> = ({
  isOpen,
  currentPalette,
  currentUiTokens,
  currentDashboardUseNotePaperOverride,
  currentDashboardNotePaperBackground,
  currentNotePaperBackgroundImage,
  currentNotePaperBackgroundFit,
  currentNotePaperBackgroundZoom,
  currentCenterShadowEnabled,
  currentCenterShadowColor,
  currentCenterShadowOpacity,
  currentCenterShadowWidth,
  onClose,
  onSave,
}) => {
  const [palette, setPalette] = useState<UIPalette>(currentPalette);
  const [uiTokens, setUiTokens] = useState<UITokens>(currentUiTokens);
  const [dashboardUseOverride, setDashboardUseOverride] = useState<boolean>(!!currentDashboardUseNotePaperOverride);
  const [dashboardNotePaperBg, setDashboardNotePaperBg] = useState<string>(currentDashboardNotePaperBackground || '');
  const [notePaperImage, setNotePaperImage] = useState<string>(currentNotePaperBackgroundImage || '');
  const [notePaperFit, setNotePaperFit] = useState<NotePaperBackgroundFit>(currentNotePaperBackgroundFit || 'contain');
  const [notePaperZoom, setNotePaperZoom] = useState<number>(
    typeof currentNotePaperBackgroundZoom === 'number' ? currentNotePaperBackgroundZoom : 100
  );
  const [centerShadowEnabled, setCenterShadowEnabled] = useState<boolean>(currentCenterShadowEnabled ?? true);
  const [centerShadowColor, setCenterShadowColor] = useState<string>(currentCenterShadowColor || '');
  const [centerShadowOpacity, setCenterShadowOpacity] = useState<number>(
    typeof currentCenterShadowOpacity === 'number' ? currentCenterShadowOpacity : 0.14
  );
  const [centerShadowWidth, setCenterShadowWidth] = useState<number>(
    typeof currentCenterShadowWidth === 'number' ? currentCenterShadowWidth : 44
  );

  if (!isOpen) return null;

  const emitSave = (overrides: Partial<Parameters<PaletteEditorModalProps['onSave']>[0]> = {}) => {
    onSave({
      palette,
      uiTokens,
      dashboardUseNotePaperOverride: dashboardUseOverride,
      dashboardNotePaperBackground: dashboardNotePaperBg || undefined,
      notePaperBackgroundImage: notePaperImage || undefined,
      notePaperBackgroundFit: notePaperFit,
      notePaperBackgroundZoom: notePaperZoom,
      centerShadowEnabled,
      centerShadowColor: centerShadowColor || undefined,
      centerShadowOpacity,
      centerShadowWidth,
      ...overrides,
    });
  };

  const updateColor = (key: keyof UIPalette, value: string) => {
    const newPalette =
      key === 'strokeColor'
        ? syncStrokeToBorders(palette, value)
        : ({ ...palette, [key]: value } as UIPalette);
    setPalette(newPalette);
    emitSave({ palette: newPalette }); // 실시간 반영
  };

  const updateUiToken = (key: keyof UITokens, value: string) => {
    const next = { ...uiTokens, [key]: value } as UITokens;
    setUiTokens(next);
    emitSave({ uiTokens: next }); // 실시간 반영
  };

  const updateDashboardOverride = (enabled: boolean) => {
    const nextEnabled = enabled;
    setDashboardUseOverride(nextEnabled);
    const nextBg = nextEnabled ? (dashboardNotePaperBg || palette.notePaperBackground) : dashboardNotePaperBg;
    if (nextEnabled && !dashboardNotePaperBg) setDashboardNotePaperBg(nextBg);
    emitSave({
      dashboardUseNotePaperOverride: nextEnabled,
      dashboardNotePaperBackground: nextEnabled ? (nextBg || undefined) : (dashboardNotePaperBg || undefined),
    });
  };

  const updateDashboardPaperBg = (value: string) => {
    setDashboardNotePaperBg(value);
    emitSave({ dashboardNotePaperBackground: value || undefined });
  };

  const updateNotePaperImage = (value: string) => {
    setNotePaperImage(value);
    emitSave({ notePaperBackgroundImage: value || undefined });
  };

  const updateCenterShadowEnabled = (enabled: boolean) => {
    setCenterShadowEnabled(enabled);
    emitSave({ centerShadowEnabled: enabled });
  };

  const updateCenterShadowColor = (value: string) => {
    setCenterShadowColor(value);
    emitSave({ centerShadowColor: value || undefined });
  };

  const updateCenterShadowOpacity = (value: number) => {
    setCenterShadowOpacity(value);
    emitSave({ centerShadowOpacity: value });
  };

  const updateCenterShadowWidth = (value: number) => {
    setCenterShadowWidth(value);
    emitSave({ centerShadowWidth: value });
  };

  const handleReset = () => {
    setPalette(DEFAULT_UI_PALETTE);
    setUiTokens(DEFAULT_UI_TOKENS);
    setDashboardUseOverride(false);
    setDashboardNotePaperBg('');
    setNotePaperImage('');
    setNotePaperFit('contain');
    setNotePaperZoom(100);
    setCenterShadowEnabled(true);
    setCenterShadowColor('');
    setCenterShadowOpacity(0.14);
    setCenterShadowWidth(44);
    onSave({
      palette: DEFAULT_UI_PALETTE,
      uiTokens: DEFAULT_UI_TOKENS,
      dashboardUseNotePaperOverride: false,
      dashboardNotePaperBackground: undefined,
      notePaperBackgroundImage: undefined,
      notePaperBackgroundFit: 'contain',
      notePaperBackgroundZoom: 100,
      centerShadowEnabled: true,
      centerShadowColor: undefined,
      centerShadowOpacity: 0.14,
      centerShadowWidth: 44,
    });
  };

  const handleExport = () => {
    const json = JSON.stringify({ uiPalette: palette, uiTokens }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ui-theme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        const importedPalette = imported?.uiPalette ?? imported;
        const importedTokens = imported?.uiTokens;
        // ✅ 구버전 호환: migrateDiaryStyle()로 구키 흡수(A~D) 포함 보강
        const migrated = migrateDiaryStyle({ uiPalette: importedPalette, uiTokens: importedTokens });
        const newPalette = migrated.uiPalette || DEFAULT_UI_PALETTE;
        const newTokens = (migrated.uiTokens || DEFAULT_UI_TOKENS) as UITokens;
        setPalette(newPalette);
        setUiTokens(newTokens);
        onSave({
          palette: newPalette,
          uiTokens: newTokens,
          dashboardUseNotePaperOverride: dashboardUseOverride,
          dashboardNotePaperBackground: dashboardNotePaperBg || undefined,
          notePaperBackgroundImage: notePaperImage || undefined,
          centerShadowEnabled,
          centerShadowColor: centerShadowColor || undefined,
          centerShadowOpacity,
          centerShadowWidth,
        });
      } catch {
        alert('잘못된 파일 형식입니다.');
      }
    };
    input.click();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const surfaceBg = 'var(--widget-surface-background, #ffffff)';
  const inputBg = 'var(--widget-input-background, #f8fafc)';
  const border = 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))';
  const text = 'var(--text-color-primary, #764737)';
  const centerShadowColorBase = centerShadowColor || palette.strokeColor || '#5D4037';
  const centerShadowColorRgba = hexToRgba(centerShadowColorBase);
  const centerShadowColorOnly = `#${centerShadowColorRgba.r.toString(16).padStart(2, '0')}${centerShadowColorRgba.g
    .toString(16)
    .padStart(2, '0')}${centerShadowColorRgba.b.toString(16).padStart(2, '0')}`;
  const centerShadowOpacityPercent = Math.round(centerShadowOpacity * 100);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-transparent" onClick={handleBackdropClick}>
      <div
        className="rounded-lg border w-[700px] max-w-[90vw] max-h-[90vh] flex flex-col"
        style={{ backgroundColor: surfaceBg, borderColor: border, color: text }}
      >
        {/* Header */}
        <div className="p-4 border-b flex flex-col gap-3" style={{ borderColor: border }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium" style={{ color: text }}>
              🎨 UI 색상 팔레트 편집
            </h3>

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1 text-sm border rounded hover:opacity-80 transition"
                style={{ backgroundColor: inputBg, borderColor: border, color: text }}
              >
                기본값 복원
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1 text-sm border rounded hover:opacity-80 transition"
                style={{ backgroundColor: inputBg, borderColor: border, color: text }}
              >
                내보내기
              </button>
              <button
                onClick={handleImport}
                className="px-3 py-1 text-sm border rounded hover:opacity-80 transition"
                style={{ backgroundColor: inputBg, borderColor: border, color: text }}
              >
                불러오기
              </button>
            </div>
          </div>

          {/* 1:1 매핑 설명 및 프리셋 */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-pink-600">✨ 1:1 매핑 기능</span>
                  <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-semibold">핵심 기능</span>
                </div>
                <p className="text-xs text-pink-700">
                  색상 하나를 변경하면 관련된 모든 UI 요소가 자동으로 업데이트됩니다. 실시간 미리보기로 즉시 확인하세요!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 앱 / 노트 구조 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 pb-1 border-b" style={{ borderColor: border, color: text }}>
              📄 앱 / 노트 구조
            </h4>
            <ColorInput
              label="선 색(통일)"
              value={palette.strokeColor}
              onChange={(v) => updateColor('strokeColor', v)}
              description="전역 선(테두리) 기본값. 개별 선 토큰은 고급에서 별도 조정 가능"
            />
            <ColorInput
              label="노트 바깥 배경"
              value={palette.appBackground}
              onChange={(v) => updateColor('appBackground', v)}
              description="앱 전체 배경 (데스크)"
            />
            <ColorInput
              label="노트 종이 바탕"
              value={palette.notePaperBackground}
              onChange={(v) => updateColor('notePaperBackground', v)}
              description="좌/우 페이지 배경 (위젯/달력과 독립)"
            />

            {/* ✅ 가운데 그림자 */}
            <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: border, backgroundColor: 'rgba(0,0,0,0.03)' }}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold" style={{ color: text }}>
                  가운데 그림자
                </div>
                <label className="text-xs flex items-center gap-2" style={{ color: text }}>
                  <input
                    type="checkbox"
                    checked={centerShadowEnabled}
                    onChange={(e) => updateCenterShadowEnabled(e.target.checked)}
                  />
                  가운데 그림자 사용
                </label>
              </div>
              <div className="text-[10px] mt-1" style={{ color: text, opacity: 0.7 }}>
                색상/진하기/폭을 조절해서 종이 배경 이미지와 어울리게 만들 수 있어요.
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <div className="text-[10px]" style={{ color: text, opacity: 0.8 }}>
                    색상(HEX)
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={centerShadowColorOnly}
                      onChange={(e) => updateCenterShadowColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer flex-shrink-0 border"
                      style={{ borderColor: border, backgroundColor: surfaceBg }}
                    />
                    <input
                      type="text"
                      value={centerShadowColor || ''}
                      placeholder={String(palette.strokeColor || '#5D4037')}
                      onChange={(e) => updateCenterShadowColor(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs font-mono border rounded outline-none"
                      style={{ borderColor: border, backgroundColor: inputBg, color: text }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="text-[10px]" style={{ color: text, opacity: 0.8 }}>
                    진하기 {Math.min(35, Math.max(0, centerShadowOpacityPercent))}%
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={35}
                    step={1}
                    value={Math.min(35, Math.max(0, centerShadowOpacityPercent))}
                    onChange={(e) => updateCenterShadowOpacity(Number(e.target.value) / 100)}
                  />
                  <div className="text-[10px]" style={{ color: text, opacity: 0.8 }}>
                    폭(Width) {Math.round(centerShadowWidth)}px
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    step={1}
                    value={centerShadowWidth}
                    onChange={(e) => updateCenterShadowWidth(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* ✅ 노트 종이 배경 이미지 */}
            <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: border, backgroundColor: 'rgba(0,0,0,0.03)' }}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-bold" style={{ color: text }}>
                  노트 종이 배경 이미지
                </div>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1 text-sm border rounded cursor-pointer" style={{ backgroundColor: inputBg, borderColor: border, color: text }}>
                    이미지 선택
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 6 * 1024 * 1024) {
                          window.alert('이미지가 너무 큽니다. 6MB 이하만 가능합니다.');
                          e.currentTarget.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = typeof reader.result === 'string' ? reader.result : '';
                          if (result) updateNotePaperImage(result);
                        };
                        reader.readAsDataURL(file);
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>
                  <button
                    onClick={() => updateNotePaperImage('')}
                    className="px-3 py-1 text-sm border rounded"
                    style={{ backgroundColor: inputBg, borderColor: border, color: text, opacity: notePaperImage ? 1 : 0.5 }}
                    disabled={!notePaperImage}
                  >
                    제거
                  </button>
                </div>
              </div>
              <div className="text-[10px] mt-1" style={{ color: text, opacity: 0.7 }}>
                설정 시 종이(#f7f5ed) 영역 전체에 적용됩니다. (저장/복원 포함)
              </div>
              {notePaperImage && (
                <div className="mt-2">
                  <img
                    src={notePaperImage}
                    alt="note paper preview"
                    className="w-full rounded border"
                    style={{ borderColor: border, maxHeight: 80, objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* ✅ 배경 이미지 맞춤 / 줌 */}
              <div className="mt-3 grid grid-cols-2 gap-2 items-center">
                <div className="text-[10px]" style={{ color: text, opacity: 0.8 }}>
                  표시 방식
                </div>
                <select
                  value={notePaperFit}
                  onChange={(e) => {
                    const nextFit = (e.target.value || 'contain') as NotePaperBackgroundFit;
                    setNotePaperFit(nextFit);
                    emitSave({ notePaperBackgroundFit: nextFit });
                  }}
                  className="px-2 py-1 text-xs border rounded outline-none"
                  style={{ backgroundColor: inputBg, borderColor: border, color: text }}
                >
                  <option value="contain">전체보기(잘림 없음)</option>
                  <option value="cover">꽉 채우기(잘림)</option>
                  <option value="zoom">줌(%)</option>
                </select>

                <div className="text-[10px]" style={{ color: text, opacity: notePaperFit === 'zoom' ? 0.8 : 0.5 }}>
                  줌
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={50}
                    max={200}
                    value={notePaperZoom}
                    disabled={notePaperFit !== 'zoom'}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      const nextZoom = Math.max(50, Math.min(200, Number.isFinite(raw) ? raw : 100));
                      setNotePaperZoom(nextZoom);
                      emitSave({ notePaperBackgroundZoom: nextZoom });
                    }}
                    className="w-40 h-1"
                    style={{ accentColor: 'var(--text-color-primary, #764737)' }}
                  />
                  <span className="text-xs w-12 text-right" style={{ color: text, opacity: notePaperFit === 'zoom' ? 0.8 : 0.5 }}>
                    {Math.round(notePaperZoom)}%
                  </span>
                </div>
              </div>
            </div>
            {/* ✅ 대시보드(월간: 위젯+달력) 전용 오버라이드 */}
            <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: border, backgroundColor: 'rgba(0,0,0,0.03)' }}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold" style={{ color: text }}>
                  대시보드 전용 노트 종이 배경 사용
                </div>
                <label className="text-xs flex items-center gap-2" style={{ color: text }}>
                  <input
                    type="checkbox"
                    checked={dashboardUseOverride}
                    onChange={(e) => updateDashboardOverride(e.target.checked)}
                  />
                  ON
                </label>
              </div>

              {dashboardUseOverride && (
                <div className="mt-2">
                  <ColorInput
                    label="대시보드 종이 바탕"
                    value={dashboardNotePaperBg || palette.notePaperBackground}
                    onChange={(v) => updateDashboardPaperBg(v)}
                    description="월간 화면에서만 --note-paper-background를 오버라이드"
                  />
                </div>
              )}

              <div className="text-[10px] mt-1" style={{ color: text, opacity: 0.7 }}>
                Week/Diary/Scrap 화면은 위의 “노트 종이 바탕(전역)”을 그대로 사용합니다.
              </div>
            </div>
            <details className="mt-3 rounded-lg border p-3" style={{ borderColor: border }}>
              <summary className="text-xs font-bold cursor-pointer" style={{ color: text }}>
                고급(개별 선: 노트)
              </summary>
              <div className="mt-2">
                <ColorInput
                  label="노트 외곽 테두리"
                  value={palette.noteOuterBorderColor}
                  onChange={(v) => updateColor('noteOuterBorderColor', v)}
                />
                <ColorInput
                  label="노트 중앙 접힘선"
                  value={palette.noteCenterFoldLineColor}
                  onChange={(v) => updateColor('noteCenterFoldLineColor', v)}
                />
              </div>
            </details>
          </div>

          {/* UI 액션 토큰 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 pb-1 border-b" style={{ borderColor: border, color: text }}>
              🧩 UI 액션 토큰 (버튼/상태)
            </h4>

            <ColorInput
              label="Primary BG"
              value={uiTokens['--ui-primary-bg']}
              onChange={(v) => updateUiToken('--ui-primary-bg', v)}
              description="bg-[var(--ui-primary-bg)]"
            />
            <ColorInput
              label="Primary Text"
              value={uiTokens['--ui-primary-text']}
              onChange={(v) => updateUiToken('--ui-primary-text', v)}
              description="text-[var(--ui-primary-text)]"
            />
            <ColorInput
              label="Primary Hover"
              value={uiTokens['--ui-primary-hover']}
              onChange={(v) => updateUiToken('--ui-primary-hover', v)}
              description="hover:bg-[var(--ui-primary-hover)]"
            />

            <ColorInput
              label="Danger BG"
              value={uiTokens['--ui-danger-bg']}
              onChange={(v) => updateUiToken('--ui-danger-bg', v)}
            />
            <ColorInput
              label="Danger Text"
              value={uiTokens['--ui-danger-text']}
              onChange={(v) => updateUiToken('--ui-danger-text', v)}
            />
            <ColorInput
              label="Danger Hover"
              value={uiTokens['--ui-danger-hover']}
              onChange={(v) => updateUiToken('--ui-danger-hover', v)}
            />

            <ColorInput
              label="Success BG"
              value={uiTokens['--ui-success-bg']}
              onChange={(v) => updateUiToken('--ui-success-bg', v)}
            />
            <ColorInput
              label="Success Text"
              value={uiTokens['--ui-success-text']}
              onChange={(v) => updateUiToken('--ui-success-text', v)}
            />
            <ColorInput
              label="Success Hover"
              value={uiTokens['--ui-success-hover']}
              onChange={(v) => updateUiToken('--ui-success-hover', v)}
            />

            <ColorInput
              label="Sunday Text"
              value={uiTokens['--ui-sunday-text']}
              onChange={(v) => updateUiToken('--ui-sunday-text', v)}
              description="WeeklySpread Sunday text"
            />
          </div>

          {/* 위젯 공통 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 pb-1 border-b" style={{ borderColor: border, color: text }}>
              📦 위젯 공통 스타일
            </h4>
            <details className="rounded-lg border p-3" style={{ borderColor: border }}>
              <summary className="text-xs font-bold cursor-pointer" style={{ color: text }}>
                고급(개별 선: 위젯)
              </summary>
              <div className="mt-2">
                <ColorInput
                  label="위젯 테두리"
                  value={palette.widgetBorderColor}
                  onChange={(v) => updateColor('widgetBorderColor', v)}
                  description="모든 위젯 박스 외곽선"
                />
              </div>
            </details>
            <ColorInput
              label="위젯 내부 배경"
              value={palette.widgetSurfaceBackground}
              onChange={(v) => updateColor('widgetSurfaceBackground', v)}
              description="위젯 안쪽 바탕 (종이와 독립)"
            />
            <ColorInput
              label="위젯 입력창 배경"
              value={palette.widgetInputBackground}
              onChange={(v) => updateColor('widgetInputBackground', v)}
              description="input/textarea 전용"
            />
          </div>

          {/* 위젯 상단 바 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 pb-1 border-b" style={{ borderColor: border, color: text }}>
              🎀 위젯 상단 바 (각각 독립)
            </h4>
            <ColorInput label="프로필 위젯" value={palette.profileHeaderBarBg} onChange={(v) => updateColor('profileHeaderBarBg', v)} />
            <ColorInput label="Monthly Goals" value={palette.goalsHeaderBarBg} onChange={(v) => updateColor('goalsHeaderBarBg', v)} />
            <ColorInput label="D-day 위젯" value={palette.ddayHeaderBarBg} onChange={(v) => updateColor('ddayHeaderBarBg', v)} />
            <ColorInput label="오하아사 위젯" value={palette.ohaasaHeaderBarBg} onChange={(v) => updateColor('ohaasaHeaderBarBg', v)} />
            <ColorInput label="Bucket List" value={palette.bucketHeaderBarBg} onChange={(v) => updateColor('bucketHeaderBarBg', v)} />
          </div>

          {/* 달력 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 pb-1 border-b" style={{ borderColor: border, color: text }}>
              📅 달력 (정확 분리)
            </h4>
            <ColorInput
              label="날짜/월 네비 헤더 배경"
              value={palette.calendarDateHeaderBg}
              onChange={(v) => updateColor('calendarDateHeaderBg', v)}
              description="상단 바(월 타이틀 + 이전/다음 버튼). 구버전 테마 호환을 위해 weekday 헤더로 fallback"
            />
            <ColorInput
              label="요일 헤더 배경"
              value={palette.calendarWeekdayHeaderBg}
              onChange={(v) => updateColor('calendarWeekdayHeaderBg', v)}
              description="SUN~SAT 줄 (텍스트는 textColorPrimary 사용)"
            />
            <details className="rounded-lg border p-3" style={{ borderColor: border }}>
              <summary className="text-xs font-bold cursor-pointer" style={{ color: text }}>
                고급(개별 선: 달력)
              </summary>
              <div className="mt-2">
                <ColorInput
                  label="달력 선 색"
                  value={palette.calendarGridLineColor}
                  onChange={(v) => updateColor('calendarGridLineColor', v)}
                  description="중복 없이 1줄만 표시"
                />
              </div>
            </details>
            <ColorInput
              label="칸 배경"
              value={palette.calendarCellBackground}
              onChange={(v) => updateColor('calendarCellBackground', v)}
              description="날짜 칸 내부 (종이/위젯과 독립)"
            />
            <ColorInput
              label="오늘 하이라이트"
              value={palette.calendarTodayHighlightBg}
              onChange={(v) => updateColor('calendarTodayHighlightBg', v)}
            />
          </div>

          {/* 월 탭 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 pb-1 border-b" style={{ borderColor: border, color: text }}>
              📑 월 탭 (RGBA 지원)
            </h4>
            <ColorInput label="기본 탭 배경" value={palette.monthTabBg} onChange={(v) => updateColor('monthTabBg', v)} description="투명도 조절 가능 (알파)" />
            <ColorInput label="활성 탭 배경" value={palette.monthTabBgActive} onChange={(v) => updateColor('monthTabBgActive', v)} />
            <details className="rounded-lg border p-3" style={{ borderColor: border }}>
              <summary className="text-xs font-bold cursor-pointer" style={{ color: text }}>
                고급(개별 선: 월 탭)
              </summary>
              <div className="mt-2">
                <ColorInput label="탭 테두리" value={palette.monthTabBorderColor} onChange={(v) => updateColor('monthTabBorderColor', v)} />
              </div>
            </details>
            <ColorInput label="탭 텍스트" value={palette.monthTabTextColor} onChange={(v) => updateColor('monthTabTextColor', v)} />
          </div>

          {/* 키링 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 pb-1 border-b" style={{ borderColor: border, color: text }}>
              🔑 키링
            </h4>
            <ColorInput label="금속/체인 색" value={palette.keyringMetalColor} onChange={(v) => updateColor('keyringMetalColor', v)} />
            <details className="rounded-lg border p-3" style={{ borderColor: border }}>
              <summary className="text-xs font-bold cursor-pointer" style={{ color: text }}>
                고급(개별 선: 키링)
              </summary>
              <div className="mt-2">
                <ColorInput label="프레임 테두리" value={palette.keyringFrameBorderColor} onChange={(v) => updateColor('keyringFrameBorderColor', v)} />
              </div>
            </details>
          </div>

          {/* CD 플레이어 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 pb-1 border-b" style={{ borderColor: border, color: text }}>
              💿 CD 플레이어
            </h4>
            <ColorInput label="위젯 배경" value={palette.cdWidgetBackground} onChange={(v) => updateColor('cdWidgetBackground', v)} description="CD 플레이어 전체 배경" />
            <ColorInput label="디스크 색" value={palette.cdDiscColor} onChange={(v) => updateColor('cdDiscColor', v)} />
            <ColorInput label="스크린 배경" value={palette.cdScreenBg} onChange={(v) => updateColor('cdScreenBg', v)} />
            <ColorInput label="버튼 배경" value={palette.cdButtonBg} onChange={(v) => updateColor('cdButtonBg', v)} />
            <ColorInput label="하단 점 색" value={palette.cdDotColor} onChange={(v) => updateColor('cdDotColor', v)} />
          </div>

          {/* 글로벌 텍스트 */}
          <div className="mb-2">
            <h4 className="text-sm font-semibold mb-3 pb-1 border-b" style={{ borderColor: border, color: text }}>
              ✍️ 글로벌 텍스트
            </h4>
            <ColorInput
              label="기본 글자색 (전체 통일)"
              value={palette.textColorPrimary}
              onChange={(v) => updateColor('textColorPrimary', v)}
              description="모든 텍스트 (헤더/요일/탭/버튼 포함), placeholder는 opacity로 처리"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center" style={{ borderColor: border }}>
          <p className="text-xs" style={{ color: text, opacity: 0.7 }}>
            💡 각 영역은 독립적으로 변경됩니다. 실시간 반영!
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded"
            style={{ backgroundColor: inputBg, borderColor: border, color: text }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaletteEditorModal;
