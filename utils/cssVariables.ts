// utils/cssVariables.ts
import type { CSSProperties } from 'react';
import { UIPalette, UITokens } from '../types';
import { DEFAULT_UI_PALETTE, DEFAULT_UI_TOKENS } from '../constants/appConstants';

/**
 * UIPalette → CSS Variables (1:1 정확 매핑)
 * ✅ 레거시/하위호환 별칭 완전 제거 (연쇄 변경 차단)
 */
export function paletteToCSSVars(
  palette: UIPalette = DEFAULT_UI_PALETTE
): CSSProperties {
  return {
    // ===== 전역 선(Stroke) =====
    '--ui-stroke-color': palette.strokeColor,

    // ===== 앱 / 노트 구조 =====
    '--app-background': palette.appBackground,
    '--note-paper-background': palette.notePaperBackground,
    '--note-outer-border-color': palette.noteOuterBorderColor,
    '--note-center-fold-line-color': palette.noteCenterFoldLineColor,

    // ===== 위젯 공통 =====
    '--widget-border-color': palette.widgetBorderColor,
    '--widget-surface-background': palette.widgetSurfaceBackground,
    '--widget-input-background': palette.widgetInputBackground,

    // ===== 위젯 상단 바 =====
    '--profile-header-bar-bg': palette.profileHeaderBarBg,
    '--goals-header-bar-bg': palette.goalsHeaderBarBg,
    '--dday-header-bar-bg': palette.ddayHeaderBarBg,
    '--ohaasa-header-bar-bg': palette.ohaasaHeaderBarBg,
    '--bucket-header-bar-bg': palette.bucketHeaderBarBg,

    // ===== 달력 =====
    '--calendar-date-header-bg': palette.calendarDateHeaderBg,
    '--calendar-weekday-header-bg': palette.calendarWeekdayHeaderBg,
    '--calendar-grid-line-color': palette.calendarGridLineColor,
    '--calendar-cell-background': palette.calendarCellBackground,
    '--calendar-today-highlight-bg': palette.calendarTodayHighlightBg,

    // ===== 월 탭 =====
    '--month-tab-bg': palette.monthTabBg,
    '--month-tab-bg-active': palette.monthTabBgActive,
    '--month-tab-border-color': palette.monthTabBorderColor,
    '--month-tab-text-color': palette.monthTabTextColor,

    // ===== 키링 =====
    '--keyring-metal-color': palette.keyringMetalColor,
    '--keyring-frame-border-color': palette.keyringFrameBorderColor,

    // ===== CD 플레이어 =====
    '--cd-widget-background': palette.cdWidgetBackground,
    '--cd-disc-color': palette.cdDiscColor,
    '--cd-screen-bg': palette.cdScreenBg,
    '--cd-button-bg': palette.cdButtonBg,
    '--cd-dot-color': palette.cdDotColor,

    // ===== 글로벌 텍스트 =====
    '--text-color-primary': palette.textColorPrimary,
  } as CSSProperties;
}

/**
 * UITokens → CSS Variables (1:1 정확 매핑)
 */
export function uiTokensToCSSVars(
  tokens: UITokens = DEFAULT_UI_TOKENS
): CSSProperties {
  return {
    '--ui-primary-bg': tokens['--ui-primary-bg'],
    '--ui-primary-text': tokens['--ui-primary-text'],
    '--ui-primary-hover': tokens['--ui-primary-hover'],

    '--ui-danger-bg': tokens['--ui-danger-bg'],
    '--ui-danger-text': tokens['--ui-danger-text'],
    '--ui-danger-hover': tokens['--ui-danger-hover'],

    '--ui-success-bg': tokens['--ui-success-bg'],
    '--ui-success-text': tokens['--ui-success-text'],
    '--ui-success-hover': tokens['--ui-success-hover'],

    '--ui-sunday-text': tokens['--ui-sunday-text'],
  } as CSSProperties;
}
