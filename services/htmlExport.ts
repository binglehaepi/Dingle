/**
 * HTML Export Service
 *
 * 다이어리 데이터를 독립 실행 가능한 정적 HTML 파일로 변환합니다.
 * - Tailwind 유틸리티 CSS를 인라인으로 포함 (CDN 없이 오프라인 동작)
 * - 앱의 index.html CSS를 그대로 인라인으로 포함 (data 속성 셀렉터)
 * - 테마 CSS 변수를 diaryStyle에서 추출하여 :root에 주입
 * - 바닐라 JS로 인터랙션 처리 (탭 전환, 날짜 클릭 → 스크랩뷰 전환)
 * - Twitter embed widget.js 포함
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ScrapItem, ScrapType, LayoutTextData, DiaryStyle, LinkDockItem, UIPalette, UITokens } from '../types';
import { DEFAULT_UI_PALETTE, DEFAULT_UI_TOKENS } from '../constants/appConstants';
import { AVAILABLE_FONTS } from '../constants/fonts';
import { DiaryHTMLView } from '../components/htmlExport/DiaryHTMLView';
import { generateJsonLd } from './metadataGenerator';
import { APP_CSS } from './_appCss';

/**
 * APP_CSS에서 :root 블록을 제거합니다.
 * _appCss.ts의 :root에 정의된 기본 팔레트 변수가
 * buildCSSVariables()의 사용자 커스텀 테마를 덮어쓰는 것을 방지합니다.
 * @supports 내부의 :root 블록도 함께 제거합니다.
 */
function stripRootBlocks(css: string): string {
  return css
    .replace(/@supports\s*\([^)]*\)\s*\{\s*:root\s*\{[^}]*\}\s*\}/g, '')
    .replace(/:root\s*\{[^}]*\}/g, '');
}

// ─── Preprocess ──────────────────────────────────────────────────

/**
 * 스티커/로컬 이미지를 인라인 data URI로 변환 (오프라인 동작 보장)
 */
export async function preprocessItemsForExport(items: ScrapItem[]): Promise<ScrapItem[]> {
  const processed: ScrapItem[] = JSON.parse(JSON.stringify(items));

  for (const item of processed) {
    // 스티커 이미지 인라인 변환
    if (item.type === ScrapType.STICKER && item.metadata.stickerConfig?.imageUrl) {
      const url = item.metadata.stickerConfig.imageUrl;
      if (!url.startsWith('data:') && !url.startsWith('http')) {
        try {
          const dataUri = await fetchAsDataUri(url);
          if (dataUri) item.metadata.stickerConfig.imageUrl = dataUri;
        } catch (e) {
          console.warn('[preprocessItemsForExport] Sticker inline failed:', url, e);
        }
      }
    }

    // 로컬 이미지 URL 인라인 (http가 아닌 로컬 경로)
    if (item.metadata.imageUrl && !item.metadata.imageUrl.startsWith('data:') && !item.metadata.imageUrl.startsWith('http')) {
      try {
        const dataUri = await fetchAsDataUri(item.metadata.imageUrl);
        if (dataUri) item.metadata.imageUrl = dataUri;
      } catch (e) {
        console.warn('[preprocessItemsForExport] Image inline failed:', item.metadata.imageUrl, e);
      }
    }
  }

  return processed;
}

async function fetchAsDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * textData 내 이미지 필드를 data URI로 변환 (오프라인 동작 보장)
 *
 * LayoutTextData는 { [key: string]: { profileImage?: string, ... } } 중첩 구조이므로,
 * 각 엔트리(예: "2026-02-DASHBOARD", "2026-02-15") 내부의 이미지 필드를 순회합니다.
 */
export async function preprocessTextDataForExport(
  textData: LayoutTextData
): Promise<LayoutTextData> {
  const td: LayoutTextData = JSON.parse(JSON.stringify(textData));

  const imageFields = [
    'profileImage', 'dDayBgImage', 'cdBodyBgImage',
    'bucketBgImage', 'monthHeaderBg', 'photoUrl', 'coverImage',
    'dowSunBg', 'dowMonBg', 'dowTueBg', 'dowWedBg', 'dowThuBg', 'dowFriBg', 'dowSatBg',
  ] as const;

  for (const entryKey of Object.keys(td)) {
    const entry = td[entryKey];
    if (!entry || typeof entry !== 'object') continue;

    for (const field of imageFields) {
      const val = (entry as Record<string, any>)[field] as string | undefined;
      if (val && !val.startsWith('data:')) {
        try {
          const dataUri = await fetchAsDataUri(val);
          if (dataUri) (entry as Record<string, any>)[field] = dataUri;
        } catch (e) {
          console.warn(`[preprocessTextDataForExport] ${entryKey}.${field} inline failed:`, val, e);
        }
      }
    }
  }

  return td;
}

/**
 * diaryStyle 내 이미지 필드를 data URI로 변환 (오프라인 동작 보장)
 */
export async function preprocessDiaryStyleForExport(
  style: DiaryStyle
): Promise<DiaryStyle> {
  const s: DiaryStyle = JSON.parse(JSON.stringify(style));

  const imageFields = ['keyringImage', 'notePaperBackgroundImage'] as const;

  for (const field of imageFields) {
    const val = (s as Record<string, any>)[field] as string | undefined;
    if (val && !val.startsWith('data:')) {
      try {
        const dataUri = await fetchAsDataUri(val);
        if (dataUri) (s as Record<string, any>)[field] = dataUri;
      } catch (e) {
        console.warn(`[preprocessDiaryStyleForExport] ${field} inline failed:`, val, e);
      }
    }
  }

  return s;
}

// ─── Generate HTML ───────────────────────────────────────────────

/**
 * 독립 실행 가능한 정적 HTML 문자열 생성
 */
export function generateStandaloneHTML(
  items: ScrapItem[],
  textData: LayoutTextData,
  diaryStyle: DiaryStyle,
  linkDockItems?: LinkDockItem[],
): string {
  // 1. React 컴포넌트를 정적 HTML로 변환
  const bodyHTML = renderToStaticMarkup(
    React.createElement(DiaryHTMLView, {
      items,
      textData,
      stylePref: diaryStyle,
      linkDockItems,
    })
  );

  // 2. 테마 CSS 변수 생성
  const cssVariables = buildCSSVariables(diaryStyle);

  // 3. 폰트 import URL 생성
  const fontImport = buildFontImport(diaryStyle.fontId);

  // 4. data-font 속성값 결정
  const fontAttr = diaryStyle.fontId || 'noto';

  // 5. JSON-LD 메타데이터 생성
  let jsonLdScript = '';
  try {
    const jsonLd = generateJsonLd(items, textData, diaryStyle);
    jsonLdScript = `<script type="application/ld+json">${jsonLd}</script>`;
  } catch (e) {
    console.warn('[generateStandaloneHTML] JSON-LD generation failed:', e);
  }

  // 6. 전체 HTML 문서 조립
  return `<!DOCTYPE html>
<html lang="ko" data-font="${fontAttr}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Dingle Diary</title>
<meta name="description" content="Digital Scrap Diary — Made with Dingle">
<meta property="og:title" content="My Dingle Diary">
<meta property="og:description" content="Digital Scrap Diary — Made with Dingle">
<meta property="og:type" content="website">
${jsonLdScript}
${fontImport}
<style>
/* ── Tailwind Utilities (CDN 대체 — 오프라인 동작 보장) ── */
${TAILWIND_UTILS_CSS}

/* ── App CSS (컴포넌트 스타일 — :root 기본 팔레트 제거됨) ── */
${stripRootBlocks(APP_CSS)}

/* ── Theme Override (사용자 커스텀 테마 — 최종 우선) ── */
${cssVariables}

/* ── Export-specific styles ── */
${buildExportCSS(diaryStyle.compactMode)}
</style>
</head>
<body style="background-color: var(--app-background, #ffffff); color: var(--text-color-primary, #764737);">
${bodyHTML}
${buildInteractionScript(diaryStyle.compactMode)}
${buildTwitterWidgetScript(items)}
</body>
</html>`;
}

// ─── CSS Variables ───────────────────────────────────────────────

function buildCSSVariables(diaryStyle: DiaryStyle): string {
  const p: UIPalette = { ...DEFAULT_UI_PALETTE, ...diaryStyle.uiPalette };
  const t: UITokens = { ...DEFAULT_UI_TOKENS, ...diaryStyle.uiTokens };

  return `:root {
  /* Stroke */
  --ui-stroke-color: ${p.strokeColor};
  --ui-stroke-width: ${(diaryStyle.uiTokens as any)?.['--ui-stroke-width'] || '1px'};
  /* App / Note */
  --app-background: ${p.appBackground};
  --note-paper-background: ${p.notePaperBackground};
  --note-outer-border-color: ${p.noteOuterBorderColor};
  --note-center-fold-line-color: ${p.noteCenterFoldLineColor};
  /* Widget */
  --widget-border-color: ${p.widgetBorderColor};
  --widget-surface-background: ${p.widgetSurfaceBackground};
  --widget-input-background: ${p.widgetInputBackground};
  /* Widget Header Bars */
  --profile-header-bar-bg: ${p.profileHeaderBarBg};
  --goals-header-bar-bg: ${p.goalsHeaderBarBg};
  --dday-header-bar-bg: ${p.ddayHeaderBarBg};
  --ohaasa-header-bar-bg: ${p.ohaasaHeaderBarBg};
  --bucket-header-bar-bg: ${p.bucketHeaderBarBg};
  /* Calendar */
  --calendar-date-header-bg: ${p.calendarDateHeaderBg};
  --calendar-weekday-header-bg: ${p.calendarWeekdayHeaderBg};
  --calendar-grid-line-color: ${p.calendarGridLineColor};
  --calendar-cell-background: ${p.calendarCellBackground};
  --calendar-today-highlight-bg: ${p.calendarTodayHighlightBg};
  /* Month Tabs */
  --month-tab-bg: ${p.monthTabBg};
  --month-tab-bg-active: ${p.monthTabBgActive};
  --month-tab-border-color: ${p.monthTabBorderColor};
  --month-tab-text-color: ${p.monthTabTextColor};
  /* Keyring */
  --keyring-metal-color: ${p.keyringMetalColor};
  --keyring-frame-border-color: ${p.keyringFrameBorderColor};
  /* CD Player */
  --cd-widget-background: ${p.cdWidgetBackground};
  --cd-disc-color: ${p.cdDiscColor};
  --cd-screen-bg: ${p.cdScreenBg};
  --cd-button-bg: ${p.cdButtonBg};
  --cd-dot-color: ${p.cdDotColor};
  /* Text */
  --text-color-primary: ${p.textColorPrimary};
  /* Note Paper Background Image (앱 diaryStyleToCSSVars와 동기화) */
  ${(() => {
    const paperImg = diaryStyle.notePaperBackgroundImage || '';
    const layered = paperImg ? `url("${paperImg}")` : 'none';
    const paperImageUrl = paperImg ? `url(${JSON.stringify(paperImg)})` : 'none';
    const fit = diaryStyle.notePaperBackgroundFit || 'contain';
    const zoomRaw = Number(diaryStyle.notePaperBackgroundZoom);
    const zoom = Number.isFinite(zoomRaw) ? Math.max(50, Math.min(200, zoomRaw)) : 100;
    const bgSize = fit === 'cover' ? 'cover' : fit === 'zoom' ? `${Math.round(zoom)}% auto` : 'contain';
    return `--note-paper-bg: ${p.notePaperBackground};
  --note-paper-background-image: ${paperImageUrl};
  --note-paper-background-image-layered: ${layered};
  --note-paper-bg-layered: ${layered};
  --note-paper-background-size: ${bgSize};`;
  })()}
  /* Center Shadow (앱 diaryStyleToCSSVars와 동기화) */
  ${(() => {
    const enabled = diaryStyle.centerShadowEnabled ?? true;
    const width = Number.isFinite(diaryStyle.centerShadowWidth as any) ? Number(diaryStyle.centerShadowWidth) : 44;
    const opacity = typeof diaryStyle.centerShadowOpacity === 'number'
      ? Math.max(0, Math.min(1, diaryStyle.centerShadowOpacity)) : 0.14;
    const colorHex = String(diaryStyle.centerShadowColor || '').trim()
      || String(p.centerShadowColor || '').trim()
      || String(p.strokeColor || '').trim()
      || '#5D4037';
    // 간이 hex→rgb 변환
    const hex = colorHex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 93;
    const g = parseInt(hex.substring(2, 4), 16) || 64;
    const b = parseInt(hex.substring(4, 6), 16) || 55;
    const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    return `--spread-center-shadow-enabled: ${enabled ? '1' : '0'};
  --spread-center-shadow-width: ${Math.max(0, Math.round(width))}px;
  --spread-center-shadow-rgba: ${rgba};`;
  })()}
  /* UI Tokens */
  ${Object.entries(t).map(([k, v]) => `${k}: ${v};`).join('\n  ')}
}`;
}

// ─── Font Import ─────────────────────────────────────────────────

function buildFontImport(fontId?: string): string {
  const fontInfo = AVAILABLE_FONTS.find(f => f.id === fontId) || AVAILABLE_FONTS[0];
  const fontName = fontInfo.name;

  // Google Fonts URL 생성
  const googleFontMap: Record<string, string> = {
    'Noto Sans KR': 'Noto+Sans+KR:wght@300;400;500;700',
    '나눔고딕': 'Nanum+Gothic:wght@400;700',
    '나눔명조': 'Nanum+Myeongjo:wght@400;700',
    '검은고딕': 'Black+Han+Sans',
    '도현체': 'Do+Hyeon',
    '주아체': 'Jua',
    '귀여운폰트': 'Cute+Font',
    '감자꽃': 'Gamja+Flower',
    'Gmarket Sans': 'Gmarket+Sans:wght@300;500;700',
  };

  const googleParam = googleFontMap[fontName];
  if (googleParam) {
    return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${googleParam}&display=swap" rel="stylesheet">`;
  }

  // Noto Sans KR fallback
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">`;
}

// ─── Interaction Script (탭 전환 + 날짜 클릭 + 스크랩뷰) ─────────

function buildInteractionScript(compactMode?: boolean): string {
  const spreadWidth = compactMode ? 1100 : 1400;
  const scaleRefW = spreadWidth + 100; // 여유 마진

  return `<script>
(function() {
  'use strict';

  // === 월 탭 클릭 → 월별 콘텐츠 전환 ===
  document.querySelectorAll('[data-tab-month]').forEach(function(tab) {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      var monthKey = this.getAttribute('data-tab-month');
      if (!monthKey) return;

      // 모든 탭 비활성화
      document.querySelectorAll('[data-tab-month]').forEach(function(t) {
        t.removeAttribute('data-month-tab-active');
        t.style.backgroundColor = 'var(--month-tab-bg)';
        t.classList.remove('font-black', 'translate-x-0');
        t.classList.add('-translate-x-1');
      });

      // 클릭된 탭 활성화
      this.setAttribute('data-month-tab-active', 'true');
      this.style.backgroundColor = 'var(--month-tab-bg-active)';
      this.classList.add('font-black', 'translate-x-0');
      this.classList.remove('-translate-x-1');

      // 왼쪽 페이지: 모든 월별 위젯 숨기기, 해당 월 표시
      document.querySelectorAll('[data-month-content]').forEach(function(el) {
        el.style.display = 'none';
      });
      var targetContent = document.querySelector('[data-month-content="' + monthKey + '"]');
      if (targetContent) targetContent.style.display = '';

      // 오른쪽 페이지: 모든 월별 캘린더 숨기기, 해당 월 표시
      document.querySelectorAll('[data-month-calendar]').forEach(function(el) {
        el.style.display = 'none';
      });
      var targetCalendar = document.querySelector('[data-month-calendar="' + monthKey + '"]');
      if (targetCalendar) targetCalendar.style.display = '';

      // 스크랩뷰가 열려있으면 닫기 (양쪽 페이지 복원)
      hideScrapView();
    });
  });

  // === 정렬된 날짜 키 목록 (PREV/NEXT용) ===
  var dateKeys = [];
  document.querySelectorAll('[data-date-panel]').forEach(function(p) {
    var k = p.getAttribute('data-date-panel');
    if (k) dateKeys.push(k);
  });
  dateKeys.sort();

  // === 스크랩뷰 표시 헬퍼 ===
  function showScrapView(dateKey) {
    // 왼쪽 페이지 (위젯 컨테이너) 숨기기
    var widgetContainer = document.querySelector('[data-widget-container]');
    if (widgetContainer) widgetContainer.style.display = 'none';

    // 오른쪽 페이지 (달력) 숨기기
    document.querySelectorAll('[data-month-calendar]').forEach(function(el) {
      el.style.display = 'none';
    });

    // 왼쪽 페이지 전체 숨기기
    var leftPage = document.querySelector('[data-note-paper="left"]');
    if (leftPage) leftPage.style.display = 'none';

    // 오른쪽 페이지 전체 숨기기
    var rightPage = leftPage ? leftPage.nextElementSibling : null;
    if (rightPage) rightPage.style.display = 'none';

    // 스크랩뷰 표시
    var scrapView = document.querySelector('[data-scrap-view]');
    if (!scrapView) return;
    scrapView.style.display = '';

    // 모든 날짜 패널 숨기기, 해당 패널만 표시
    scrapView.querySelectorAll('[data-date-panel]').forEach(function(p) {
      p.style.display = 'none';
    });
    var panel = scrapView.querySelector('[data-date-panel="' + dateKey + '"]');
    if (panel) panel.style.display = '';
  }

  function hideScrapView() {
    // 스크랩뷰 숨기기
    var scrapView = document.querySelector('[data-scrap-view]');
    if (scrapView) scrapView.style.display = 'none';

    // 왼쪽 페이지 복원
    var leftPage = document.querySelector('[data-note-paper="left"]');
    if (leftPage) leftPage.style.display = '';
    var widgetContainer = document.querySelector('[data-widget-container]');
    if (widgetContainer) widgetContainer.style.display = '';

    // 오른쪽 페이지 복원
    var rightPage = leftPage ? leftPage.nextElementSibling : null;
    if (rightPage) rightPage.style.display = '';

    // 현재 활성 월의 달력 표시
    var activeTab = document.querySelector('[data-month-tab-active]');
    if (activeTab) {
      var monthKey = activeTab.getAttribute('data-tab-month');
      if (monthKey) {
        var cal = document.querySelector('[data-month-calendar="' + monthKey + '"]');
        if (cal) cal.style.display = '';
      }
    }
  }

  // === 달력 날짜 클릭 → 스크랩뷰 전환 ===
  document.querySelectorAll('[data-date-link]').forEach(function(cell) {
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', function() {
      var dateKey = this.getAttribute('data-date-link');
      if (!dateKey) return;
      showScrapView(dateKey);
    });
  });

  // === PREV 버튼 ===
  document.querySelectorAll('[data-prev-btn]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var current = this.getAttribute('data-current-date');
      var idx = dateKeys.indexOf(current);
      if (idx > 0) {
        showScrapView(dateKeys[idx - 1]);
      }
    });
  });

  // === NEXT 버튼 ===
  document.querySelectorAll('[data-next-btn]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var current = this.getAttribute('data-current-date');
      var idx = dateKeys.indexOf(current);
      if (idx >= 0 && idx < dateKeys.length - 1) {
        showScrapView(dateKeys[idx + 1]);
      }
    });
  });

  // === 뷰포트 맞춤 자동 스케일링 ===
  function fitToViewport() {
    var planner = document.querySelector('.dg-planner');
    if (!planner) return;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var scaleX = vw / ${scaleRefW};
    var scaleY = vh / 900;
    var s = Math.min(scaleX, scaleY, 1);
    planner.style.transform = 'scale(' + s + ')';
    planner.style.transformOrigin = 'center center';
  }
  window.addEventListener('resize', fitToViewport);
  fitToViewport();
})();
</script>`;
}

// ─── Twitter Widget Script ───────────────────────────────────────

function buildTwitterWidgetScript(items: ScrapItem[]): string {
  const hasTwitter = items.some(i => i.type === ScrapType.TWITTER);
  if (!hasTwitter) return '';

  return `<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`;
}

// ─── Tailwind Utilities CSS (CDN 대체 — 정적 CSS 규칙) ──────────

/**
 * DesktopSpreadView.tsx + 상호작용 JS에서 사용하는 Tailwind 유틸리티 클래스를
 * 순수 CSS 규칙으로 변환한 상수.
 *
 * Tailwind CDN은 런타임 JavaScript 컴파일러이므로, JS 없이 오프라인에서도
 * 정상 렌더링되려면 이 인라인 CSS가 필요합니다.
 *
 * ⚠️ DesktopSpreadView.tsx 변경 시 이 CSS도 함께 업데이트하세요.
 */
const TAILWIND_UTILS_CSS = `
/* ── Tailwind Preflight (minimal subset) ── */
*, ::before, ::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: currentColor;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
}
img, svg, video, canvas, audio, iframe, embed, object { display: block; vertical-align: middle; }
img, video { max-width: 100%; height: auto; }
button { cursor: pointer; background: transparent; padding: 0; }
h1, h2, h3, h4, h5, h6, p { margin: 0; }

/* ── Display ── */
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }

/* ── Position ── */
.relative { position: relative; }
.absolute { position: absolute; }

/* ── Inset / TRBL ── */
.inset-0 { inset: 0px; }
.inset-\\[40\\%\\] { inset: 40%; }
.top-0 { top: 0px; }
.bottom-0 { bottom: 0px; }
.top-8 { top: 2rem; }
.-right-8 { right: -2rem; }
.top-1\\/2 { top: 50%; }
.left-1\\/2 { left: 50%; }

/* ── Z-Index ── */
.z-0 { z-index: 0; }
.z-10 { z-index: 10; }
.z-20 { z-index: 20; }
.z-50 { z-index: 50; }
.z-\\[5\\] { z-index: 5; }

/* ── Flex Direction ── */
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }

/* ── Flex Wrap ── */
.flex-wrap { flex-wrap: wrap; }

/* ── Flex ── */
.flex-1 { flex: 1 1 0%; }
.flex-\\[2\\] { flex: 2; }
.flex-shrink-0 { flex-shrink: 0; }

/* ── Grid Template Columns ── */
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-7 { grid-template-columns: repeat(7, minmax(0, 1fr)); }
.grid-rows-1 { grid-template-rows: repeat(1, minmax(0, 1fr)); }

/* ── Alignment ── */
.items-center { align-items: center; }
.items-baseline { align-items: baseline; }
.justify-center { justify-content: center; }
.justify-start { justify-content: flex-start; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.content-start { align-content: flex-start; }

/* ── Gap ── */
.gap-0\\.5 { gap: 0.125rem; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }

/* ── Padding ── */
.p-0\\.5 { padding: 0.125rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-5 { padding: 1.25rem; }
.p-8 { padding: 2rem; }
.pb-2 { padding-bottom: 0.5rem; }
.px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-20 { padding-top: 5rem; padding-bottom: 5rem; }
.pl-4 { padding-left: 1rem; }

/* ── Margin ── */
.mb-1 { margin-bottom: 0.25rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-8 { margin-bottom: 2rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-auto { margin-top: auto; }
.-mt-0\\.5 { margin-top: -0.125rem; }
.ml-0\\.5 { margin-left: 0.125rem; }
.ml-1 { margin-left: 0.25rem; }

/* ── Width ── */
.w-full { width: 100%; }
.w-px { width: 1px; }
.w-1\\.5 { width: 0.375rem; }
.w-2 { width: 0.5rem; }
.w-2\\.5 { width: 0.625rem; }
.w-3 { width: 0.75rem; }
.w-4 { width: 1rem; }
.w-5 { width: 1.25rem; }
.w-7 { width: 1.75rem; }
.w-8 { width: 2rem; }
.w-12 { width: 3rem; }
.w-40 { width: 10rem; }
.w-\\[30\\%\\] { width: 30%; }

/* ── Height ── */
.h-full { height: 100%; }
.h-1\\.5 { height: 0.375rem; }
.h-2 { height: 0.5rem; }
.h-2\\.5 { height: 0.625rem; }
.h-3 { height: 0.75rem; }
.h-4 { height: 1rem; }
.h-5 { height: 1.25rem; }
.h-7 { height: 1.75rem; }
.h-8 { height: 2rem; }
.h-9 { height: 2.25rem; }
.h-10 { height: 2.5rem; }
.h-14 { height: 3.5rem; }
.h-16 { height: 4rem; }
.h-40 { height: 10rem; }
.h-\\[35\\%\\] { height: 35%; }

/* ── Min Width / Height ── */
.min-h-0 { min-height: 0px; }
.min-w-0 { min-width: 0px; }

/* ── Font Size ── */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-\\[8px\\] { font-size: 8px; }
.text-\\[9px\\] { font-size: 9px; }
.text-\\[10px\\] { font-size: 10px; }
.text-\\[11px\\] { font-size: 11px; }
.text-\\[12px\\] { font-size: 12px; }
.text-\\[13px\\] { font-size: 13px; }

/* ── Font Weight ── */
.font-normal { font-weight: 400; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.font-extrabold { font-weight: 800; }
.font-black { font-weight: 900; }

/* ── Font Family ── */
.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

/* ── Text Align ── */
.text-center { text-align: center; }
.text-left { text-align: left; }

/* ── Letter Spacing ── */
.tracking-tight { letter-spacing: -0.025em; }
.tracking-wide { letter-spacing: 0.025em; }
.tracking-widest { letter-spacing: 0.1em; }

/* ── Line Height ── */
.leading-none { line-height: 1; }
.leading-tight { line-height: 1.25; }

/* ── Background Color ── */
.bg-transparent { background-color: transparent; }
.bg-white { background-color: #ffffff; }
.bg-white\\/60 { background-color: rgba(255, 255, 255, 0.6); }
.bg-white\\/50 { background-color: rgba(255, 255, 255, 0.5); }
.bg-white\\/30 { background-color: rgba(255, 255, 255, 0.3); }
.bg-purple-400 { background-color: #c084fc; }
.bg-teal-500\\/5 { background-color: rgba(20, 184, 166, 0.05); }

/* ── Background Size / Position ── */
.bg-cover { background-size: cover; }
.bg-center { background-position: center; }

/* ── Gradient ── */
.bg-gradient-to-tr { background-image: linear-gradient(to top right, var(--tw-gradient-stops)); }
.from-white\\/10 {
  --tw-gradient-from: rgba(255, 255, 255, 0.1);
  --tw-gradient-to: rgba(255, 255, 255, 0);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
.to-transparent { --tw-gradient-to: transparent; }

/* ── Border Width ── */
.border { border-width: 1px; }
.border-r { border-right-width: 1px; }
.border-l-0 { border-left-width: 0px; }

/* ── Border Radius ── */
.rounded { border-radius: 0.25rem; }
.rounded-sm { border-radius: 0.125rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-full { border-radius: 9999px; }
.rounded-r-md { border-top-right-radius: 0.375rem; border-bottom-right-radius: 0.375rem; }

/* ── Opacity ── */
.opacity-30 { opacity: 0.3; }
.opacity-40 { opacity: 0.4; }
.opacity-50 { opacity: 0.5; }
.opacity-60 { opacity: 0.6; }
.opacity-70 { opacity: 0.7; }
.opacity-90 { opacity: 0.9; }

/* ── Backdrop Filter ── */
.backdrop-blur { -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
.backdrop-blur-\\[1px\\] { -webkit-backdrop-filter: blur(1px); backdrop-filter: blur(1px); }

/* ── Mix Blend Mode ── */
.mix-blend-multiply { mix-blend-mode: multiply; }

/* ── Overflow ── */
.overflow-hidden { overflow: hidden; }
.overflow-y-auto { overflow-y: auto; }
.overflow-visible { overflow: visible; }

/* ── Object Fit ── */
.object-cover { object-fit: cover; }

/* ── Transform ── */
.translate-x-0 {
  --tw-translate-x: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-translate-x-1 {
  --tw-translate-x: -0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-translate-x-1\\/2 {
  --tw-translate-x: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-translate-y-1\\/2 {
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

/* ── Transition ── */
.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* ── Pointer Events ── */
.pointer-events-none { pointer-events: none; }
.pointer-events-auto { pointer-events: auto; }

/* ── Select ── */
.select-none { user-select: none; -webkit-user-select: none; }

/* ── Whitespace ── */
.whitespace-nowrap { white-space: nowrap; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── Padding Extra ── */
.pt-1 { padding-top: 0.25rem; }
`;

// ─── Export-specific CSS (카드/레이아웃 보조 스타일) ──────────────

function buildExportCSS(compactMode?: boolean): string {
  const spreadWidth = compactMode ? 1100 : 1400;

  return `
/* === Export Page Layout (한 화면 맞춤) === */
.dg-export-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0;
  margin: 0;
}

/* === Planner Container (앱 DesktopApp.tsx 동일 — compactMode 반영) === */
.dg-planner {
  position: relative;
  width: ${spreadWidth}px;
  height: 820px;
  margin: 0 auto;
  transform-origin: center center;
}

/* === Item Cards (스크랩뷰 아이템) === */
.dg-card {
  background: var(--widget-surface-background, #ffffff);
  border: 1px solid var(--widget-border-color, #94a3b8);
  border-radius: 8px;
  overflow: hidden;
  font-size: 12px;
}
.dg-card__image-wrap { width: 100%; overflow: hidden; }
.dg-card__image-wrap img { width: 100%; display: block; }
.dg-card__body { padding: 8px 10px; }
.dg-card__title {
  font-size: 12px; font-weight: 600; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.dg-card__desc {
  font-size: 11px; opacity: 0.6; margin-top: 4px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.dg-card__link {
  display: block; padding: 6px 10px; font-size: 10px;
  color: var(--text-color-primary, #764737); opacity: 0.5;
  border-top: 1px solid var(--widget-border-color, #94a3b8);
}
.dg-card__link:hover { opacity: 0.8; }

/* Note Card — 앱: transparent bg, no border (TextNoteObject.tsx) */
.dg-card--note {
  background: transparent;
  border: none;
  padding: 0;
  border-radius: 0;
}
.dg-note__content {
  padding: 12px; font-size: 14px; line-height: 1.8;
  white-space: pre-wrap; word-break: break-word;
  min-width: 100px; min-height: 40px;
  font-family: var(--app-font, 'Noto Sans KR', sans-serif);
  color: var(--text-color-primary, #000);
}

/* YouTube Card */
.dg-card--youtube { padding: 0; }
.dg-youtube__container { position: relative; padding-top: 56.25%; width: 100%; }
.dg-youtube__container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }

/* Twitter Card */
.dg-card--twitter { padding: 8px; min-height: 80px; }
.dg-card--twitter .twitter-tweet { margin: 0 !important; }

/* Sticker Card */
.dg-card--sticker { background: transparent; border: none; display: inline-block; }
.dg-sticker__image { max-width: 80px; max-height: 80px; }
.dg-sticker__emoji { font-size: 40px; display: block; }

/* Link Card */
.dg-card--link { border-left: 4px solid #64748b; display: flex; flex-direction: column; }
.dg-link__thumbnail { width: 100%; max-height: 160px; overflow: hidden; }
.dg-link__thumbnail img { width: 100%; object-fit: cover; }

/* Placeholder Card */
.dg-card--placeholder { text-align: center; padding: 16px; }
.dg-placeholder__icon { font-size: 24px; margin-bottom: 4px; }
.dg-placeholder__text { font-size: 11px; opacity: 0.5; }
.dg-placeholder__type {
  display: inline-block; font-size: 9px; padding: 2px 8px;
  border-radius: 10px; background: var(--widget-input-background, #f8fafc); opacity: 0.5; margin-top: 4px;
}

/* === Checklist (위젯 내부) === */
.dg-checklist { display: flex; flex-direction: column; gap: 3px; }
.dg-checklist__item { display: flex; align-items: flex-start; gap: 6px; font-size: 11px; line-height: 1.4; }
.dg-checklist__item--done { opacity: 0.5; }
.dg-checklist__item--done .dg-checklist__text { text-decoration: line-through; }
.dg-checklist__box {
  width: 14px; height: 14px;
  border: 1.5px solid var(--widget-border-color, #94a3b8);
  border-radius: 3px; display: flex; align-items: center; justify-content: center;
  font-size: 9px; flex-shrink: 0; margin-top: 1px;
}
.dg-checklist__text { flex: 1; min-width: 0; }

/* === ScrapView (앱 FreeLayout 2페이지 스프레드 재현) === */
[data-scrap-view] { overflow: hidden; }
[data-date-panel] { position: relative; }
[data-prev-btn]:hover, [data-next-btn]:hover { opacity: 1 !important; }

/* === Link Dock Bar (앱 스타일) === */
.dg-linkdock-bar {
  display: flex; align-items: center; gap: 6px; flex-wrap: nowrap;
  border: 1px solid var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)));
  border-radius: 8px;
  background: var(--widget-surface-background, #ffffff);
  padding: 6px 12px;
  margin-top: 6px;
  height: 40px;
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
}
.dg-linkdock-bar__item {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 8px; border: 1px solid var(--widget-border-color, #94a3b8);
  border-radius: 6px; background: var(--widget-input-background, #f8fafc);
  font-size: 10px; white-space: nowrap; flex-shrink: 0;
  text-decoration: none; color: inherit;
}
.dg-linkdock-bar__item:hover { opacity: 0.7; }
.dg-linkdock-bar__url {
  max-width: 160px; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; opacity: 0.7;
}

/* === CD Player Dots === */
.dg-cd-dot {
  width: 8px; height: 8px; border-radius: 9999px;
}

/* === Keyring === */
.dg-keyring {
  display: flex; flex-direction: column; align-items: center;
  filter: drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.15));
}

/* === Marquee (전광판) === */
.dg-marquee {
  width: 100%; overflow: hidden; white-space: nowrap;
}
.dg-marquee__text {
  display: inline-block;
  font-size: 12px;
  opacity: 0.9;
  animation: dg-marquee-scroll 12s linear infinite;
}
@keyframes dg-marquee-scroll {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

/* === Print === */
@media print {
  [data-prev-btn], [data-next-btn] { display: none; }
  [data-month-tab] { pointer-events: none; }
  body { background: white; }
}
`; // end of buildExportCSS return
}
