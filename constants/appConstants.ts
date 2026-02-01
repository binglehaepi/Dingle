/**
 * 앱 전역 상수
 */

import { UIPalette, UITokens } from '../types';

// LocalStorage 키
export const STORAGE_KEY = 'smart_scrap_diary_layout_v2';
export const LAYOUT_PREF_KEY = 'smart_scrap_layout_pref';
export const TEXT_DATA_KEY = 'smart_scrap_text_data';
export const STYLE_PREF_KEY = 'smart_scrap_style_pref';
export const LINK_DOCK_KEY = 'smart_scrap_link_dock_items';

// 월 이름
export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// 글로벌 스크랩 페이지 키
export const GLOBAL_SCRAP_PAGE_KEY = 'GLOBAL_SCRAP_PAGE';

// 📐 좌표계 통일: 저장은 항상 SPREAD 기준
// 동적 크기 계산 함수
export const getSpreadWidth = (compactMode?: boolean) => compactMode ? 1100 : 1400;
export const getPageWidth = (compactMode?: boolean) => getSpreadWidth(compactMode) / 2;

// 기본값 (하위 호환성)
export const SPREAD_WIDTH = 1400;  // 2페이지 스프레드 (저장 좌표계)
export const PAGE_WIDTH = SPREAD_WIDTH / 2;  // 700px (1페이지)
export const DESIGN_HEIGHT = 820;  // 공통 높이

/**
 * 모바일 1페이지 모드: view 좌표 변환
 * - 왼쪽 페이지: x ∈ [0..700) → pageOffset = 0
 * - 오른쪽 페이지: x ∈ [700..1400) → pageOffset = 700
 * - xView = xStore - pageOffset
 * - xStore = xView + pageOffset
 */

// ===== 기본 핑크 UI 팔레트 (1:1 정확 매핑) =====
export const DEFAULT_UI_PALETTE: UIPalette = {
  // ===== 전역 선(Stroke) =====
  strokeColor: '#330a0a',

  // ===== 앱 / 노트 구조 =====
  appBackground: '#ffffff',
  notePaperBackground: '#f7f5ed',
  noteOuterBorderColor: '#764737',
  noteCenterFoldLineColor: '#94a3b8',

  // ===== 위젯 공통 =====
  widgetBorderColor: 'var(--ui-stroke-color, #94a3b8)',
  widgetSurfaceBackground: '#ffffff',
  widgetInputBackground: '#f8fafc',

  // ===== 위젯 상단 바 =====
  profileHeaderBarBg: '#F9D4F0',
  goalsHeaderBarBg: '#FEDFDC',
  ddayHeaderBarBg: '#FCF5C8',
  ohaasaHeaderBarBg: '#EBE7F5',
  bucketHeaderBarBg: '#EFF1AA',

  // ===== 달력 =====
  calendarDateHeaderBg: '#FEDFDC',
  calendarWeekdayHeaderBg: '#FEDFDC',
  calendarGridLineColor: 'var(--ui-stroke-color, #d1d5db)',
  calendarCellBackground: '#ffffff',
  calendarTodayHighlightBg: '#FFFCE1',

  // ===== 월 탭 =====
  monthTabBg: '#FFFFFF33',           // 반투명
  monthTabBgActive: '#FFFFFF',
  monthTabBorderColor: '#764737',
  monthTabTextColor: '#764737',

  // ===== 키링 =====
  keyringMetalColor: '#764737',
  keyringFrameBorderColor: '#764737',

  // ===== CD 플레이어 =====
  cdWidgetBackground: '#F4F5E1',
  cdDiscColor: '#1e293b',
  cdScreenBg: '#1e293b',
  cdButtonBg: '#ffffff',
  cdDotColor: '#94a3b8',

  // ===== 글로벌 텍스트 =====
  textColorPrimary: '#764737',
};

// ===== UI 액션 토큰 기본값 (index.html :root 기본값과 1:1) =====
export const DEFAULT_UI_TOKENS: UITokens = {
  '--ui-primary-bg': '#3b82f6',
  '--ui-primary-text': '#ffffff',
  '--ui-primary-hover': '#2563eb',

  '--ui-danger-bg': '#ef4444',
  '--ui-danger-text': '#ffffff',
  '--ui-danger-hover': '#dc2626',

  '--ui-success-bg': '#22c55e',
  '--ui-success-text': '#ffffff',
  '--ui-success-hover': '#16a34a',

  '--ui-sunday-text': '#ef4444',
};




