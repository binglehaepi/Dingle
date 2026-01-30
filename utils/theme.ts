import type { CSSProperties } from 'react';
import type { DiaryStyle, UITokens, UIPalette, ScrapItem } from '../types';
import { DEFAULT_UI_PALETTE, DEFAULT_UI_TOKENS } from '../constants/appConstants';
import { DEFAULT_FONT_ID, FONT_IDS } from '../constants/fonts';
import { paletteToCSSVars, uiTokensToCSSVars } from './cssVariables';
import { migrateScrapItemsDecoration } from './itemMigrations';

// =========================================================
// Note paper background image: dataURL(large) -> Blob URL
// - Some browsers ignore extremely long CSS variable values.
// - Keep base64 in storage, but apply as short blob: URL.
// - Revoke previous objectURL on change to avoid memory leaks.
// =========================================================
let _paperBgObjectUrl: string | null = null;
let _paperBgLastDataUrl: string | null = null;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = (hex || '').trim().replace('#', '');
  if (!h) return null;
  // #rgb
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    if ([r, g, b].some((x) => Number.isNaN(x))) return null;
    return { r, g, b };
  }
  // #rrggbb or #rrggbbaa
  if (h.length === 6 || h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((x) => Number.isNaN(x))) return null;
    return { r, g, b };
  }
  return null;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',');
  const mime = /data:(.*?);base64/.exec(meta || '')?.[1] || 'image/jpeg';
  const bin = atob(b64 || '');
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

function getPaperBgUrl(dataUrl: string): string {
  const trimmed = (dataUrl || '').trim();
  if (!trimmed) return '';

  // Non-data URL: just return it as-is (no objectURL management)
  if (!trimmed.startsWith('data:')) return trimmed;

  if (_paperBgLastDataUrl === trimmed && _paperBgObjectUrl) return _paperBgObjectUrl;

  if (_paperBgObjectUrl) {
    try {
      URL.revokeObjectURL(_paperBgObjectUrl);
    } catch {
      // ignore
    }
  }
  _paperBgLastDataUrl = trimmed;

  const blob = dataUrlToBlob(trimmed);
  _paperBgObjectUrl = URL.createObjectURL(blob);
  return _paperBgObjectUrl;
}

export function revokeNotePaperBgObjectUrl(): void {
  if (_paperBgObjectUrl) {
    try {
      URL.revokeObjectURL(_paperBgObjectUrl);
    } catch {
      // ignore
    }
  }
  _paperBgObjectUrl = null;
  _paperBgLastDataUrl = null;
}

/**
 * 기존 저장 데이터 호환을 위한 마이그레이션
 * - uiPalette / uiTokens 누락 시 기본값으로 채움
 * - 부분 누락 시에도 기본값으로 보강
 */
export function migrateDiaryStyle(input: any): DiaryStyle {
  const base: DiaryStyle = {
    coverColor: '#ffffff',
    coverPattern: 'quilt',
    keyring: 'https://i.ibb.co/V0JFcWp8/0000-1.png',
    backgroundImage: '',
    fontId: 'noto',
    uiPalette: DEFAULT_UI_PALETTE,
    uiTokens: DEFAULT_UI_TOKENS,
    dashboardUseNotePaperOverride: false,
    dashboardNotePaperBackground: undefined,
    notePaperBackgroundImage: undefined,
    notePaperBackgroundFit: 'contain',
    notePaperBackgroundZoom: 100,
    centerFoldShadowEnabled: true,
    centerShadowEnabled: true,
    centerShadowColor: '',
    centerShadowOpacity: 0.14,
    centerShadowWidth: 44,
  };

  const merged: DiaryStyle = {
    ...base,
    ...(input || {}),
  };

  // legacy: themeId 제거
  if (merged && typeof merged === 'object' && 'themeId' in (merged as any)) {
    delete (merged as any).themeId;
  }

  // uiPalette 보강
  // ✅ 구버전 팔레트 키 흡수(A~D) + 기본값 보강
  // - calendarHeaderBannerBg / calendarYearNavColor / monthTabTextColorActive 는 더 이상 사용하지 않음
  // - 값이 남아있을 수 있으므로 신키로 흡수 후 폐기
  const incomingPalette = ((merged.uiPalette as any) || {}) as any;
  const absorbed: any = { ...incomingPalette };

  // A) calendarDateHeaderBg가 없고 calendarHeaderBannerBg가 있으면 흡수
  if (!absorbed.calendarDateHeaderBg && absorbed.calendarHeaderBannerBg) {
    absorbed.calendarDateHeaderBg = absorbed.calendarHeaderBannerBg;
  }
  // B) calendarWeekdayHeaderBg가 없고 calendarHeaderBannerBg가 있으면 흡수(구버전: 헤더 1개였던 경우)
  if (!absorbed.calendarWeekdayHeaderBg && absorbed.calendarHeaderBannerBg) {
    absorbed.calendarWeekdayHeaderBg = absorbed.calendarHeaderBannerBg;
  }
  // C) monthTabTextColor가 없고 monthTabTextColorActive가 있으면 흡수
  if (!absorbed.monthTabTextColor && absorbed.monthTabTextColorActive) {
    absorbed.monthTabTextColor = absorbed.monthTabTextColorActive;
  }
  // D) calendarYearNavColor는 기본적으로 무시(사용처 제거). 다만 textColorPrimary가 없을 때만 보조값으로 흡수 가능.
  if (!absorbed.textColorPrimary && absorbed.calendarYearNavColor) {
    absorbed.textColorPrimary = absorbed.calendarYearNavColor;
  }

  // 구키 제거
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { calendarHeaderBannerBg, calendarYearNavColor, monthTabTextColorActive, ...restPalette } = absorbed;

  merged.uiPalette = {
    ...DEFAULT_UI_PALETTE,
    ...(restPalette as UIPalette),
  };

  // uiTokens 보강
  merged.uiTokens = {
    ...DEFAULT_UI_TOKENS,
    ...((merged.uiTokens as UITokens) || {}),
  };

  // fontId 보강
  if (!merged.fontId || !FONT_IDS.includes(merged.fontId as any)) {
    merged.fontId = DEFAULT_FONT_ID;
  }

  // 대시보드 종이 오버라이드 보강
  if (typeof merged.dashboardUseNotePaperOverride !== 'boolean') {
    merged.dashboardUseNotePaperOverride = false;
  }

  // 노트 종이 배경 이미지 fit/zoom 보강
  const fit = (merged as any).notePaperBackgroundFit;
  if (fit !== 'contain' && fit !== 'cover' && fit !== 'zoom') {
    merged.notePaperBackgroundFit = 'contain';
  }
  const zoomRaw = Number((merged as any).notePaperBackgroundZoom);
  let zoom = Number.isFinite(zoomRaw) ? zoomRaw : 100;
  zoom = Math.max(50, Math.min(200, zoom));
  merged.notePaperBackgroundZoom = Math.round(zoom);

  // 하위호환: 기존 centerFoldShadowEnabled → 새 centerShadowEnabled
  if (typeof (merged as any).centerShadowEnabled !== 'boolean' && typeof (merged as any).centerFoldShadowEnabled === 'boolean') {
    merged.centerShadowEnabled = (merged as any).centerFoldShadowEnabled;
  }

  // 기본값 보강
  if (typeof merged.centerShadowEnabled !== 'boolean') merged.centerShadowEnabled = true;
  if (typeof merged.centerShadowColor !== 'string') merged.centerShadowColor = '';
  if (typeof merged.centerShadowOpacity !== 'number') merged.centerShadowOpacity = 0.14;
  if (typeof merged.centerShadowWidth !== 'number') merged.centerShadowWidth = 44;

  return merged;
}

/**
 * diaryStyle → CSS Variables (palette + uiTokens)
 */
export function diaryStyleToCSSVars(style: DiaryStyle): CSSProperties {
  const palette = style.uiPalette || DEFAULT_UI_PALETTE;
  const uiTokens = style.uiTokens || DEFAULT_UI_TOKENS;

  // ⚠️ Do not insert huge base64 dataURL directly into CSS variables.
  // Convert to blob URL (short) for reliable application.
  const paperBg = String(style.uiPalette?.notePaperBackground || '#f7f5ed').trim();
  const imgData = String(style.notePaperBackgroundImage || '').trim();
  let imgUrl = '';
  try {
    imgUrl = imgData ? getPaperBgUrl(imgData) : '';
  } catch {
    imgUrl = '';
  }

  if (!imgUrl) {
    // If image is removed, revoke old objectURL (if any)
    revokeNotePaperBgObjectUrl();
  }

  // ✅ 이미지가 "위"로 보이게: 필름(그라데이션) 제거
  const layered = imgUrl ? `url("${imgUrl}")` : 'none';
  const paperImageUrl = imgUrl ? `url(${JSON.stringify(imgUrl)})` : 'none';

  // ✅ 배경 이미지 맞춤/줌
  const fit = style.notePaperBackgroundFit || 'contain';
  const zoomRaw = Number(style.notePaperBackgroundZoom);
  const zoom = Number.isFinite(zoomRaw) ? Math.max(50, Math.min(200, zoomRaw)) : 100;
  const paperBgSize =
    fit === 'cover'
      ? 'cover'
      : fit === 'zoom'
        ? `${Math.round(zoom)}% auto`
        : 'contain';

  const centerShadowEnabled = style.centerShadowEnabled ?? true;
  const centerShadowWidth = Number.isFinite(style.centerShadowWidth as any) ? Number(style.centerShadowWidth) : 44;
  const centerShadowOpacity = clamp01(
    typeof style.centerShadowOpacity === 'number' ? style.centerShadowOpacity : 0.14
  );
  const centerShadowColorHex = String(style.centerShadowColor || '').trim() || String(palette.strokeColor || '').trim() || '#5D4037';
  const centerShadowRgb = hexToRgb(centerShadowColorHex) || { r: 93, g: 64, b: 55 };
  const centerShadowRgba = `rgba(${centerShadowRgb.r}, ${centerShadowRgb.g}, ${centerShadowRgb.b}, ${centerShadowOpacity})`;

  return {
    ...paletteToCSSVars(palette),
    ...uiTokensToCSSVars(uiTokens),
    '--note-paper-background': paperBg,
    '--note-paper-background-size': paperBgSize,
    '--spread-center-shadow-enabled': centerShadowEnabled ? '1' : '0',
    '--spread-center-shadow-width': `${Math.max(0, Math.round(centerShadowWidth))}px`,
    '--spread-center-shadow-rgba': centerShadowRgba,
    // ✅ 요구사항 변수명 (background shorthand 금지)
    '--note-paper-bg': palette.notePaperBackground,
    '--note-paper-bg-layered': layered,

    // ✅ 하위호환(기존)
    '--note-paper-background-image': paperImageUrl,
    '--note-paper-background-image-layered': layered,
  } as CSSProperties;
}

/**
 * 요구사항 3) 테마 적용: document.documentElement.style.setProperty 로 적용
 */
export function applyDiaryStyleToDocument(style: DiaryStyle): void {
  const root = document.documentElement;
  const vars = diaryStyleToCSSVars(style) as Record<string, string>;

  for (const [k, v] of Object.entries(vars)) {
    if (!k.startsWith('--')) continue;
    if (v == null) continue;
    root.style.setProperty(k, String(v));
  }
}

/**
 * (아이템) 링크/임베드 카드 decoration 하위호환 보강
 * - 구버전 백업에는 metadata.decoration이 없을 수 있어, 로드 시 1회 보강한다.
 * - 실제 로드 경로(useStorageSync/useFileSync/backup restore)에서는 utils/itemMigrations.ts의
 *   migrateScrapItemsDecoration()을 사용한다. (책임 분리)
 */
export function migrateItemsForLinkCardDecoration(items: ScrapItem[]): ScrapItem[] {
  return migrateScrapItemsDecoration(items);
}




