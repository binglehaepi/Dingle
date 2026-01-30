import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DiaryStyle, LayoutTextData, ScrapItem } from '../types';
import { ScrapType } from '../types';
import { DEFAULT_UI_TOKENS, LAYOUT_PREF_KEY, STORAGE_KEY, STYLE_PREF_KEY, TEXT_DATA_KEY } from '../constants/appConstants';
import type { BackupData } from '../services/backup';
import { restoreBackup } from '../services/backup';
import { migrateDiaryStyle } from '../utils/theme';
import { formatMonthKey } from '../utils/dateHelpers';
import { syncStrokeToBorders } from './PaletteEditorModal';
import { detectPlatform, normalizeUrl } from '../shared/urlPlatform';
import { parseUrlType } from '../services/urlParser';

type LogLevel = 'PASS' | 'FAIL' | 'INFO';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitUntil(fn: () => boolean, timeoutMs: number, intervalMs = 100): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fn()) return true;
    // eslint-disable-next-line no-await-in-loop
    await sleep(intervalMs);
  }
  return false;
}

function rgbOf(hex: string): string {
  // expects #rrggbb
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

const TINY_PNG =
  // 1x1 PNG (green-ish) - small and deterministic
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axlX7cAAAAASUVORK5CYII=';

function logLine(level: LogLevel, msg: string) {
  const line = `[SELFTEST] ${level} ${msg}`;
  // eslint-disable-next-line no-console
  console.log(line);
  return line;
}

export default function SelfTestRunner(props: {
  items: ScrapItem[];
  textData: LayoutTextData;
  diaryStyle: DiaryStyle;
  setItems: React.Dispatch<React.SetStateAction<ScrapItem[]>>;
  setTextData: React.Dispatch<React.SetStateAction<LayoutTextData>>;
  setDiaryStyle: React.Dispatch<React.SetStateAction<DiaryStyle>>;
}) {
  const { items, textData, diaryStyle, setItems, setTextData, setDiaryStyle } = props;
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const phase = useMemo(() => Number(sessionStorage.getItem('__selftest_phase') || '0'), []);
  const push = (level: LogLevel, msg: string) => {
    setLines((prev) => [...prev, logLine(level, msg)]);
  };

  useEffect(() => {
    // 월간 화면 고정(달력/위젯/노트 테스트를 위해)
    try {
      localStorage.setItem(LAYOUT_PREF_KEY, JSON.stringify('monthly'));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // React StrictMode(DEV)에서 effect 중복 실행 방지
        const guardKey = `__selftest_guard_phase_${phase}`;
        if (sessionStorage.getItem(guardKey) === '1') return;
        sessionStorage.setItem(guardKey, '1');

        push('INFO', `phase=${phase} start`);
        await sleep(250);

        // Utility query helpers
        const qs = (sel: string) => document.querySelector(sel) as HTMLElement | null;
        const bg = (el: Element | null) => (el ? getComputedStyle(el).backgroundColor : '');

        const primaryBtn = () => qs('[data-selftest="primary-btn"]');
        const noteShell = () => qs('[data-note-shell]');
        const paperLeft = () => qs('[data-note-paper="left"]');
        const paperRight = () => qs('[data-note-paper="right"]');
        const widgetProfile = () => qs('[data-widget="profile"]');
        const weekdayHeader = () => qs('[data-calendar-weekday-header]');
        const todayCell = () => qs('[data-ui="calendar-cell"][data-today-cell]');
        const anyOtherCell = () => document.querySelector('[data-ui="calendar-cell"]:not([data-today-cell])') as HTMLElement | null;

        // =========================================================
        // Platform detect smoke test (single source)
        // - 딱 1회만 실행 (UI/기능 테스트 확대 금지)
        // =========================================================
        try {
          const smokeKey = '__selftest_platform_detect_smoke_v1';
          if (sessionStorage.getItem(smokeKey) !== '1') {
            sessionStorage.setItem(smokeKey, '1');
            push('INFO', 'PLATFORM) detectPlatform(normalizeUrl(url)) 스모크 테스트');
            const cases: Array<{ url: string; expect: ReturnType<typeof detectPlatform> }> = [
              { url: 'https://twitter.com/user/status/1234567890', expect: 'twitter' },
              { url: 'https://x.com/user/status/1234567890?utm_source=x', expect: 'twitter' },
              { url: 'https://www.instagram.com/p/ABCDEFG/', expect: 'instagram' },
              { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_campaign=test', expect: 'youtube' },
              { url: 'https://youtu.be/dQw4w9WgXcQ', expect: 'youtube' },
              { url: 'https://open.spotify.com/track/123', expect: 'spotify' },
              { url: 'https://www.tiktok.com/@user/video/123', expect: 'tiktok' },
              { url: 'https://vimeo.com/123456', expect: 'vimeo' },
              { url: 'https://www.pinterest.com/pin/123/', expect: 'pinterest' },
              { url: 'https://www.pinterest.co.kr/pin/123/', expect: 'pinterest' },
              { url: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=123', expect: 'aladin' },
              { url: 'https://www.yes24.com/Product/Goods/123', expect: 'book' },
              { url: 'https://www.amazon.com/dp/B000000', expect: 'book' },
              { url: 'https://www.google.com/maps/place/Seoul', expect: 'googlemap' },
              { url: 'https://goo.gl/maps/abcdef', expect: 'googlemap' },
              { url: 'https://example.com/clip.mp4', expect: 'moving_photo' },
              { url: 'https://example.com/anim.webp', expect: 'moving_photo' },
              { url: 'https://www.musinsa.com/app/goods/123', expect: 'fashion' },
              { url: 'https://example.com/?q=1', expect: 'general' },
            ];
            for (const c of cases) {
              const got = detectPlatform(normalizeUrl(c.url));
              push(got === c.expect ? 'PASS' : 'FAIL', `PLATFORM) ${c.url} => ${got} expected=${c.expect}`);
            }
          }
        } catch {
          // ignore
        }

        // =========================================================
        // Conflict-case regression tests (current rules baseline)
        // - 규칙/동작 변경 금지: "현재 규칙이 무엇인지"를 고정하는 목적
        // - normalizeUrl / detectPlatform / urlParser(parseUrlType) / server effectiveType(추정) / apiClient unfurl 조건(재현)
        // =========================================================
        try {
          const conflictKey = '__selftest_url_pipeline_conflicts_v1';
          if (sessionStorage.getItem(conflictKey) !== '1') {
            sessionStorage.setItem(conflictKey, '1');
            push('INFO', 'CONFLICT) URL 파이프라인 회귀 테스트(현재 규칙 고정)');

            const computeServerEffectiveType = (requestType: unknown, detected: ReturnType<typeof detectPlatform>) => {
              const t = typeof requestType === 'string' ? requestType : '';
              if (t === 'twitter' || t === 'instagram' || t === 'pinterest' || t === 'youtube') return t;
              if (detected === 'twitter' || detected === 'instagram' || detected === 'pinterest' || detected === 'youtube') return detected;
              return 'general';
            };

            const assertNormalize = (raw: string, normalized: string, expect: { host?: string; removedParams?: string[] }) => {
              try {
                const u = new URL(normalized);
                if (expect.host && u.hostname !== expect.host) return `host=${u.hostname} expected=${expect.host}`;
                for (const p of expect.removedParams || []) {
                  if (u.searchParams.has(p)) return `param-not-removed=${p}`;
                }
                return '';
              } catch {
                return 'invalid-url';
              }
            };

            const cases: Array<{
              url: string;
              requestType: unknown;
              expect: {
                normalize: { host?: string; removedParams?: string[] };
                platform: ReturnType<typeof detectPlatform>;
                scrapType: ScrapType;
                serverEffectiveType: string;
                apiClientUsesUnfurl: boolean;
              };
            }> = [
              {
                url: 'https://x.com/user/status/1?utm_source=a&ref=b',
                requestType: 'twitter',
                expect: {
                  normalize: { host: 'twitter.com', removedParams: ['utm_source', 'ref'] },
                  platform: 'twitter',
                  scrapType: ScrapType.TWITTER,
                  serverEffectiveType: 'twitter',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://mobile.twitter.com/user/status/1',
                requestType: 'twitter',
                expect: {
                  normalize: { host: 'mobile.twitter.com' },
                  platform: 'twitter',
                  scrapType: ScrapType.TWITTER,
                  serverEffectiveType: 'twitter',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://twitter.com/user/status/1?s=20&t=abc',
                requestType: 'twitter',
                expect: {
                  normalize: { host: 'twitter.com', removedParams: ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'fbclid'] },
                  platform: 'twitter',
                  scrapType: ScrapType.TWITTER,
                  serverEffectiveType: 'twitter',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://twitter.com/user/statuses/1',
                requestType: 'twitter',
                expect: {
                  normalize: { host: 'twitter.com' },
                  platform: 'twitter',
                  scrapType: ScrapType.TWITTER,
                  serverEffectiveType: 'twitter',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://www.instagram.com/reel/XYZ/?igshid=1',
                requestType: 'instagram',
                expect: {
                  normalize: { host: 'www.instagram.com', removedParams: ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'fbclid'] },
                  platform: 'instagram',
                  scrapType: ScrapType.INSTAGRAM,
                  serverEffectiveType: 'instagram',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://www.instagram.com/stories/user/123',
                requestType: 'instagram',
                expect: {
                  normalize: { host: 'www.instagram.com' },
                  platform: 'instagram',
                  scrapType: ScrapType.INSTAGRAM,
                  serverEffectiveType: 'instagram',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://youtu.be/dQw4w9WgXcQ?si=abc',
                requestType: 'youtube',
                expect: {
                  normalize: { host: 'youtu.be', removedParams: ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'fbclid'] },
                  platform: 'youtube',
                  scrapType: ScrapType.YOUTUBE,
                  serverEffectiveType: 'youtube',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
                requestType: 'youtube',
                expect: {
                  normalize: { host: 'www.youtube.com' },
                  platform: 'youtube',
                  scrapType: ScrapType.YOUTUBE,
                  serverEffectiveType: 'youtube',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
                requestType: 'youtube',
                expect: {
                  normalize: { host: 'm.youtube.com' },
                  platform: 'youtube',
                  scrapType: ScrapType.YOUTUBE,
                  serverEffectiveType: 'youtube',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://www.pinterest.co.kr/pin/123/',
                requestType: 'pinterest',
                expect: {
                  normalize: { host: 'www.pinterest.co.kr' },
                  platform: 'pinterest',
                  scrapType: ScrapType.PINTEREST,
                  serverEffectiveType: 'pinterest',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://pin.it/abcd',
                requestType: 'pinterest',
                expect: {
                  normalize: { host: 'pin.it' },
                  platform: 'general',
                  scrapType: ScrapType.GENERAL,
                  serverEffectiveType: 'pinterest', // requestType이 정상인 경우 서버는 그대로 pinterest로 처리(현행)
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1',
                requestType: 'book',
                expect: {
                  normalize: { host: 'www.aladin.co.kr' },
                  platform: 'aladin',
                  scrapType: ScrapType.BOOK,
                  serverEffectiveType: 'general',
                  apiClientUsesUnfurl: true,
                },
              },
              {
                url: 'https://www.yes24.com/Product/Goods/1?utm_medium=x',
                requestType: 'book',
                expect: {
                  normalize: { host: 'www.yes24.com', removedParams: ['utm_medium'] },
                  platform: 'book',
                  scrapType: ScrapType.BOOK,
                  serverEffectiveType: 'general',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://www.amazon.com/dp/B000000?fbclid=1',
                requestType: 'book',
                expect: {
                  normalize: { host: 'www.amazon.com', removedParams: ['fbclid'] },
                  platform: 'book',
                  scrapType: ScrapType.BOOK,
                  serverEffectiveType: 'general',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://www.google.com/maps/place/Seoul?utm_campaign=x',
                requestType: 'general',
                expect: {
                  normalize: { host: 'www.google.com', removedParams: ['utm_campaign'] },
                  platform: 'googlemap',
                  scrapType: ScrapType.GENERAL, // urlParser는 googlemap 전용 분류가 없으므로 GENERAL 유지
                  serverEffectiveType: 'general',
                  apiClientUsesUnfurl: true,
                },
              },
              {
                url: 'https://maps.google.com/?q=Seoul',
                requestType: 'general',
                expect: {
                  normalize: { host: 'maps.google.com' },
                  platform: 'googlemap',
                  scrapType: ScrapType.GENERAL,
                  serverEffectiveType: 'general',
                  apiClientUsesUnfurl: true,
                },
              },
              {
                url: 'https://goo.gl/maps/abcdef',
                requestType: 'general',
                expect: {
                  normalize: { host: 'goo.gl' },
                  platform: 'googlemap',
                  scrapType: ScrapType.GENERAL,
                  serverEffectiveType: 'general',
                  apiClientUsesUnfurl: true,
                },
              },
              {
                url: 'https://example.com/video.mp4?utm_source=x',
                requestType: 'general',
                expect: {
                  normalize: { host: 'example.com', removedParams: ['utm_source'] },
                  platform: 'moving_photo',
                  scrapType: ScrapType.MOVING_PHOTO,
                  serverEffectiveType: 'general',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://example.com/download?file=video.mp4',
                requestType: 'general',
                expect: {
                  normalize: { host: 'example.com' },
                  platform: 'general',
                  scrapType: ScrapType.GENERAL,
                  serverEffectiveType: 'general',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://www.musinsa.com/app/goods/1',
                requestType: 'fashion',
                expect: {
                  normalize: { host: 'www.musinsa.com' },
                  platform: 'fashion',
                  scrapType: ScrapType.FASHION,
                  serverEffectiveType: 'general',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://example.com/shop/about',
                requestType: 'fashion',
                expect: {
                  normalize: { host: 'example.com' },
                  platform: 'fashion',
                  scrapType: ScrapType.FASHION,
                  serverEffectiveType: 'general',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://example.com/product/help',
                requestType: 'fashion',
                expect: {
                  normalize: { host: 'example.com' },
                  platform: 'fashion',
                  scrapType: ScrapType.FASHION,
                  serverEffectiveType: 'general',
                  apiClientUsesUnfurl: false,
                },
              },
              // server 보정 경로 확인(요청 type 이상)
              {
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                requestType: 'unknown',
                expect: {
                  normalize: { host: 'www.youtube.com' },
                  platform: 'youtube',
                  scrapType: ScrapType.YOUTUBE,
                  serverEffectiveType: 'youtube',
                  apiClientUsesUnfurl: false,
                },
              },
              {
                url: 'https://www.google.com/maps/place/Seoul',
                requestType: 'unknown',
                expect: {
                  normalize: { host: 'www.google.com' },
                  platform: 'googlemap',
                  scrapType: ScrapType.GENERAL,
                  serverEffectiveType: 'general', // 보정 대상(4종)에 없으므로 general
                  apiClientUsesUnfurl: true,
                },
              },
            ];

            for (const c of cases) {
              const norm = normalizeUrl(c.url);
              const normErr = assertNormalize(c.url, norm, c.expect.normalize);
              push(normErr ? 'FAIL' : 'PASS', `CONFLICT) normalize ${c.url} => ${normErr || 'ok'}`);

              const plat = detectPlatform(norm);
              push(plat === c.expect.platform ? 'PASS' : 'FAIL', `CONFLICT) platform ${c.url} => ${plat} expected=${c.expect.platform}`);

              const st = parseUrlType(c.url);
              push(st === c.expect.scrapType ? 'PASS' : 'FAIL', `CONFLICT) scrapType ${c.url} => ${st} expected=${c.expect.scrapType}`);

              const serverEff = computeServerEffectiveType(c.requestType, plat);
              push(serverEff === c.expect.serverEffectiveType ? 'PASS' : 'FAIL', `CONFLICT) serverEffectiveType type=${String(c.requestType)} url=${c.url} => ${serverEff} expected=${c.expect.serverEffectiveType}`);

              const usesUnfurl = plat === 'aladin' || plat === 'googlemap';
              push(usesUnfurl === c.expect.apiClientUsesUnfurl ? 'PASS' : 'FAIL', `CONFLICT) apiClientUnfurl ${c.url} => ${String(usesUnfurl)} expected=${String(c.expect.apiClientUsesUnfurl)}`);
            }
          }
        } catch {
          // ignore
        }

        // =========================================================
        // Phase 0: (1) 즉시 반영 + 리로드로 유지 확인 준비
        // =========================================================
        if (phase === 0) {
          const newPrimary = '#ff00ff';
          push('INFO', '1) --ui-primary-bg 변경 → 즉시 반영 확인');

          setDiaryStyle((prev) => ({
            ...prev,
            uiTokens: { ...(prev.uiTokens || DEFAULT_UI_TOKENS), '--ui-primary-bg': newPrimary },
          }));
          await sleep(250);

          const btn = primaryBtn();
          if (!btn) {
            push('FAIL', '1) primary 버튼 찾기 실패 (data-selftest="primary-btn")');
          } else {
            const got = bg(btn);
            const want = rgbOf(newPrimary);
            push(got === want ? 'PASS' : 'FAIL', `1) 즉시 반영 bg=${got} expected=${want}`);
          }

          sessionStorage.setItem('__selftest_expected_primary_rgb', rgbOf(newPrimary));
          sessionStorage.setItem('__selftest_phase', '1');
          location.reload();
          return;
        }

        // =========================================================
        // Phase 1: (1) 새로고침 후 유지 + (2) 백업 준비 → 초기화 → 리로드
        // =========================================================
        if (phase === 1) {
          const expected = sessionStorage.getItem('__selftest_expected_primary_rgb') || '';
          push('INFO', '1) 새로고침 후 유지 확인');
          // 로딩(useStorageSync)에서 diaryStyle을 적용하기까지 약간의 지연이 있을 수 있어 polling
          await waitUntil(() => bg(primaryBtn()) !== '', 2000, 100);
          const ok = await waitUntil(() => bg(primaryBtn()) === expected, 3000, 100);
          const got = bg(primaryBtn());
          push(got === expected ? 'PASS' : 'FAIL', `1) 새로고침 후 bg=${got} expected=${expected}`);
          if (!ok) push('INFO', '1) (참고) 로드 순서/지연으로 인해 기대값 도달 실패');

          push('INFO', '2) Backup export → 초기화/새로고침 → import/restore 시나리오 준비');
          const backup: BackupData = {
            version: '2.0.0',
            appVersion: 'selftest',
            createdAt: Date.now(),
            items,
            textData,
            stylePref: diaryStyle,
            itemCount: items.length,
            totalSize: 0,
          };
          sessionStorage.setItem('__selftest_backup', JSON.stringify(backup));

          // Reset (simulate "초기화")
          try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TEXT_DATA_KEY);
            localStorage.removeItem(STYLE_PREF_KEY);
          } catch {
            // ignore
          }
          setItems([]);
          setTextData({});
          setDiaryStyle((prev) => migrateDiaryStyle({ ...prev, uiTokens: DEFAULT_UI_TOKENS })); // keep valid shape
          await sleep(150);

          sessionStorage.setItem('__selftest_phase', '2');
          location.reload();
          return;
        }

        // =========================================================
        // Phase 2: (2) import/restore 실행 → 리로드
        // =========================================================
        if (phase === 2) {
          push('INFO', '2) 복원 실행');
          const raw = sessionStorage.getItem('__selftest_backup');
          if (!raw) {
            push('FAIL', '2) backup 세션 데이터 없음');
          } else {
            const backup = JSON.parse(raw) as BackupData;
            restoreBackup(backup, setItems, setTextData, setDiaryStyle);
            await sleep(300);
            push('PASS', '2) restoreBackup 호출 완료(상태+localStorage 저장)');
          }

          sessionStorage.setItem('__selftest_phase', '3');
          location.reload();
          return;
        }

        // =========================================================
        // Phase 3: (2) 새로고침 후 유지 + (3) 구버전 백업 준비 → 초기화 → 리로드
        // =========================================================
        if (phase === 3) {
          push('INFO', '2) 새로고침 후 유지 확인');
          const styleStr = localStorage.getItem(STYLE_PREF_KEY);
          push(styleStr ? 'PASS' : 'FAIL', `2) STYLE_PREF_KEY 존재=${!!styleStr}`);
          // (추가) 중앙 그림자 설정 키 저장 여부 확인
          const ok = await waitUntil(() => {
            const s = localStorage.getItem(STYLE_PREF_KEY);
            if (!s) return false;
            try {
              const parsed = JSON.parse(s);
              return (
                !!parsed &&
                typeof parsed.centerShadowEnabled === 'boolean' &&
                typeof parsed.centerShadowOpacity === 'number' &&
                typeof parsed.centerShadowWidth === 'number' &&
                typeof parsed.centerShadowColor === 'string'
              );
            } catch {
              return false;
            }
          }, 1500, 100);
          push(ok ? 'PASS' : 'FAIL', `2) centerShadow keys 저장=${ok}`);

          push('INFO', '3) uiTokens 없는 구버전 백업 import → DEFAULT_UI_TOKENS 보강');
          const raw = sessionStorage.getItem('__selftest_backup');
          if (!raw) {
            push('FAIL', '3) backup 세션 데이터 없음');
          } else {
            const backup = JSON.parse(raw) as BackupData;
            const legacy: BackupData = {
              ...backup,
              stylePref: { ...(backup.stylePref as any) },
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (legacy.stylePref as any).uiTokens;
            sessionStorage.setItem('__selftest_legacy_backup', JSON.stringify(legacy));
          }

          // Reset
          try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TEXT_DATA_KEY);
            localStorage.removeItem(STYLE_PREF_KEY);
          } catch {
            // ignore
          }
          setItems([]);
          setTextData({});
          await sleep(150);

          sessionStorage.setItem('__selftest_phase', '4');
          location.reload();
          return;
        }

        // =========================================================
        // Phase 4: (3) legacy restore 실행 → 리로드
        // =========================================================
        if (phase === 4) {
          push('INFO', '3) legacy restore 실행');
          const raw = sessionStorage.getItem('__selftest_legacy_backup');
          if (!raw) {
            push('FAIL', '3) legacy backup 세션 데이터 없음');
          } else {
            const legacy = JSON.parse(raw) as BackupData;
            restoreBackup(legacy, setItems, setTextData, setDiaryStyle);
            await sleep(300);
            const styleStr = localStorage.getItem(STYLE_PREF_KEY);
            const parsed = styleStr ? JSON.parse(styleStr) : null;
            const hasUiTokens = !!parsed?.uiTokens;
            push(hasUiTokens ? 'PASS' : 'FAIL', `3) uiTokens 자동 보강=${hasUiTokens}`);
          }

          sessionStorage.setItem('__selftest_phase', '5');
          location.reload();
          return;
        }

        // =========================================================
        // Phase 5: (4~7) 투명도/달력 검증
        // =========================================================
        if (phase === 5) {
          // 4) notePaperBackground alpha 0
          push('INFO', '4) notePaperBackground 알파 0 → 종이 투명');
          setDiaryStyle((prev) => ({
            ...prev,
            uiPalette: { ...(prev.uiPalette as any), appBackground: '#112233', notePaperBackground: 'rgba(0,0,0,0)' },
          }));
          await sleep(250);

          const paperL = bg(paperLeft());
          const paperR = bg(paperRight());
          const shellBg = bg(noteShell());
          push(paperL === 'rgba(0, 0, 0, 0)' ? 'PASS' : 'FAIL', `4) left paper bg=${paperL}`);
          push(paperR === 'rgba(0, 0, 0, 0)' ? 'PASS' : 'FAIL', `4) right paper bg=${paperR}`);
          push(shellBg === 'rgba(0, 0, 0, 0)' ? 'PASS' : 'FAIL', `4) note shell bg=${shellBg}`);

          // 글로벌 종이색을 다시 불투명으로 복원(이후 "대시보드만 override" 테스트를 위해)
          setDiaryStyle((prev) => ({
            ...prev,
            uiPalette: { ...(prev.uiPalette as any), notePaperBackground: '#f7f5ed' },
          }));
          await sleep(150);

          // 5) widgetSurfaceBackground alpha 0
          push('INFO', '5) widgetSurfaceBackground 알파 0 → 위젯 투명');
          setDiaryStyle((prev) => ({
            ...prev,
            uiPalette: { ...(prev.uiPalette as any), widgetSurfaceBackground: 'rgba(0,0,0,0)' },
          }));
          await sleep(250);
          const wBg = bg(widgetProfile());
          push(wBg === 'rgba(0, 0, 0, 0)' ? 'PASS' : 'FAIL', `5) profile widget bg=${wBg}`);

          // 6) weekday header transparency only
          push('INFO', '6) calendarWeekdayHeaderBg 투명화 → 요일 헤더만');
          setDiaryStyle((prev) => ({
            ...prev,
            uiPalette: {
              ...(prev.uiPalette as any),
              calendarWeekdayHeaderBg: 'rgba(0,0,0,0)',
              calendarCellBackground: '#ffffff',
              calendarDateHeaderBg: '#00ff00',
            },
          }));
          await sleep(250);
          const weekdayBg = bg(weekdayHeader());
          const cellBg = bg(anyOtherCell());
          push(weekdayBg === 'rgba(0, 0, 0, 0)' ? 'PASS' : 'FAIL', `6) weekday header bg=${weekdayBg}`);
          push(cellBg === rgbOf('#ffffff') ? 'PASS' : 'FAIL', `6) cell bg=${cellBg} expected=${rgbOf('#ffffff')}`);

          // 7) today highlight
          push('INFO', '7) calendarTodayHighlightBg 변경 → 오늘 칸만');
          setDiaryStyle((prev) => ({
            ...prev,
            uiPalette: { ...(prev.uiPalette as any), calendarTodayHighlightBg: '#ff0000' },
          }));
          await sleep(250);
          const todayBg = bg(todayCell());
          push(todayBg === rgbOf('#ff0000') ? 'PASS' : 'FAIL', `7) today cell bg=${todayBg} expected=${rgbOf('#ff0000')}`);

          // (추가) 구버전 팔레트 키 흡수 검증: calendarHeaderBannerBg / monthTabTextColorActive
          push('INFO', 'LEGACY) 구버전 팔레트 키 흡수 (calendarHeaderBannerBg, monthTabTextColorActive)');
          const legacy = migrateDiaryStyle({
            uiPalette: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              calendarHeaderBannerBg: '#00ff00',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              monthTabTextColorActive: '#010203',
            } as any,
          });
          setDiaryStyle((prev) => ({ ...prev, uiPalette: legacy.uiPalette }));
          await sleep(250);
          const rootStyle = getComputedStyle(document.documentElement);
          const dateHeaderVar = rootStyle.getPropertyValue('--calendar-date-header-bg').trim();
          const tabTextVar = rootStyle.getPropertyValue('--month-tab-text-color').trim();
          push(dateHeaderVar === '#00ff00' ? 'PASS' : 'FAIL', `LEGACY) calendarDateHeaderBg=${dateHeaderVar} expected=#00ff00`);
          push(tabTextVar === '#010203' ? 'PASS' : 'FAIL', `LEGACY) monthTabTextColor=${tabTextVar} expected=#010203`);

          // (8)(9) 날짜/월 네비 헤더 배경 이미지 적용 + 오버레이/그림자 제거 검증
          push('INFO', '8) calendar date header bg image 적용 확인');
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dashboardKey = `${yyyy}-${mm}-DASHBOARD`;
          setTextData((prev) => ({
            ...prev,
            [dashboardKey]: { ...(prev[dashboardKey] || {}), monthHeaderBg: TINY_PNG },
          }));
          await sleep(300);
          const headerEl = document.querySelector('[data-calendar-header]') as HTMLElement | null;
          const headerBgImg = headerEl ? getComputedStyle(headerEl).backgroundImage : '';
          push(headerBgImg && headerBgImg !== 'none' ? 'PASS' : 'FAIL', `8) header background-image=${headerBgImg || '(missing)'}`);

          push('INFO', '9) 이미지 적용 시 오버레이/그림자 제거 확인');
          const headerShadow = headerEl ? getComputedStyle(headerEl).boxShadow : '';
          const headerFilter = headerEl ? getComputedStyle(headerEl).filter : '';
          const overlayExists = !!document.querySelector('[data-calendar-header-overlay]');
          push(headerShadow === 'none' ? 'PASS' : 'FAIL', `9) header box-shadow=${headerShadow}`);
          push(headerFilter === 'none' ? 'PASS' : 'FAIL', `9) header filter=${headerFilter}`);
          push(!overlayExists ? 'PASS' : 'FAIL', `9) overlay element exists=${overlayExists}`);

          // (11) strokeColor 변경 → 최소 2군데 이상 선 색이 같이 변하는지(fallback) 확인
          push('INFO', '11) strokeColor(통일) → 노트/위젯/달력/탭 선 색 동시 변경');
          setDiaryStyle((prev) => ({
            ...prev,
            uiPalette: syncStrokeToBorders(
              { ...(prev.uiPalette as any), strokeColor: '#8c3636' },
              '#8c3636'
            ) as any,
          }));
          await sleep(250);
          const expectedStroke = 'rgb(140, 54, 54)';
          const noteShellEl = document.querySelector('[data-note-shell]') as HTMLElement | null;
          const profileWidgetEl = document.querySelector('[data-widget="profile"]') as HTMLElement | null;
          const calendarGridEl = document.querySelector('[data-calendar-grid]') as HTMLElement | null;
          const monthTabEl = document.querySelector('[data-month-tab]') as HTMLElement | null;
          const noteBorder = noteShellEl ? getComputedStyle(noteShellEl).borderColor : '';
          const profileBorder = profileWidgetEl ? getComputedStyle(profileWidgetEl).borderColor : '';
          const gridBorder = calendarGridEl ? getComputedStyle(calendarGridEl).borderColor : '';
          const tabBorder = monthTabEl ? getComputedStyle(monthTabEl).borderColor : '';
          push(noteBorder === expectedStroke ? 'PASS' : 'FAIL', `11) note outer border=${noteBorder}`);
          push(profileBorder === expectedStroke ? 'PASS' : 'FAIL', `11) profile widget border=${profileBorder}`);
          push(gridBorder === expectedStroke ? 'PASS' : 'FAIL', `11) calendar grid border=${gridBorder}`);
          push(tabBorder === expectedStroke ? 'PASS' : 'FAIL', `11) month tab border=${tabBorder}`);

          // (선택) 프로필 소개글 input 테두리도 strokeColor 동기화 반영되는지 확인
          const introEl = document.querySelector('input[placeholder="소개글을 입력하세요..."]') as HTMLElement | null;
          const introBorder = introEl ? getComputedStyle(introEl).borderTopColor : '';
          push(introBorder === expectedStroke ? 'PASS' : 'FAIL', `11) intro input border=${introBorder}`);

          // (12) decoration → wrapper style 반영(getComputedStyle)
          push('INFO', '12) decoration preset 변경 → overlay 렌더/attr 반영 확인');
          const selftestUrl = 'https://example.com/selftest-decoration';
          const monthKey = formatMonthKey(new Date());
          const decoItem: ScrapItem = {
            id: '__selftest_decoration_item',
            type: ScrapType.SPOTIFY,
            diaryDate: monthKey,
            pageSide: 'left',
            createdAt: Date.now(),
            position: { x: 80, y: 120, z: 9999, rotation: 0, scale: 1 },
            metadata: {
              url: selftestUrl,
              title: 'SelfTest Decoration',
              subtitle: 'Spotify',
              decoration: { presetId: 'frame_pearl_border' as any },
            },
          };
          setItems((prev) => [...prev.filter((i) => i.id !== decoItem.id), decoItem]);
          await waitUntil(() => !!document.querySelector(`a[href="${selftestUrl}"]`), 2000, 100);
          const linkEl = document.querySelector(`a[href="${selftestUrl}"]`) as HTMLElement | null;
          if (!linkEl) {
            push('FAIL', '12) 링크 카드 element 찾기 실패');
          } else {
            const wrapper = linkEl.closest('[data-decoration-preset]') as HTMLElement | null;
            const preset = wrapper?.getAttribute('data-decoration-preset') || '';
            push(preset === 'frame_pearl_border' ? 'PASS' : 'FAIL', `12) data-decoration-preset=${preset} expected=frame_pearl_border`);
            const svg = wrapper?.querySelector('svg[data-decoration-overlay="1"]') as SVGElement | null;
            push(svg ? 'PASS' : 'FAIL', `12) overlay svg exists=${!!svg}`);
          }

          // (13) 더블클릭 → window.open 호출 없음 + 모달 DOM 존재 확인
          push('INFO', '13) 더블클릭 → 새 탭 금지(window.open=0) + 모달 표시');
          const origOpen = window.open;
          let openCalls = 0;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          window.open = ((...args: any[]) => {
            openCalls += 1;
            return null;
          }) as any;
          try {
            linkEl?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
            const modalOk = await waitUntil(() => !!document.querySelector('[data-embed-preview-modal]'), 2500, 100);
            push(openCalls === 0 ? 'PASS' : 'FAIL', `13) window.open calls=${openCalls}`);
            push(modalOk ? 'PASS' : 'FAIL', `13) modal exists=${modalOk}`);
            // 닫기(이후 테스트/리로드 방해 최소화)
            const overlay = document.querySelector('[data-embed-preview-modal]') as HTMLElement | null;
            overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            await sleep(150);
          } finally {
            window.open = origOpen;
          }

          // (14) 구버전 백업(items에 decoration 없음) 복원 시 자동 보강되어 깨지지 않는지 확인
          push('INFO', '14) legacy items(decoration 없음) restore → presetId=none 보강');
          const legacyUrl = 'https://example.com/selftest-legacy-item';
          const legacyItem: ScrapItem = {
            id: '__selftest_legacy_item',
            type: ScrapType.SPOTIFY,
            diaryDate: formatMonthKey(new Date()),
            pageSide: 'left',
            createdAt: Date.now(),
            position: { x: 120, y: 220, z: 10000, rotation: 0, scale: 1 },
            metadata: {
              url: legacyUrl,
              title: 'Legacy Item (no decoration)',
              subtitle: 'Spotify',
              // decoration/frameDecoration intentionally omitted
            } as any,
          };
          const legacyBackup: BackupData = {
            version: '2.0.0',
            appVersion: 'selftest',
            createdAt: Date.now(),
            items: [legacyItem],
            textData: {},
            stylePref: diaryStyle,
            itemCount: 1,
            totalSize: 0,
          };
          restoreBackup(legacyBackup, setItems, setTextData, setDiaryStyle);
          await sleep(250);
          try {
            const rawItems = localStorage.getItem(STORAGE_KEY);
            const parsedItems = rawItems ? (JSON.parse(rawItems) as ScrapItem[]) : [];
            const migrated = parsedItems.find((i) => i.metadata?.url === legacyUrl);
            const ok = migrated?.metadata?.decoration?.presetId === 'none';
            push(ok ? 'PASS' : 'FAIL', `14) migrated decoration presetId=${migrated?.metadata?.decoration?.presetId || '(missing)'}`);
          } catch (e) {
            push('FAIL', `14) exception: ${(e as Error)?.message || String(e)}`);
          }

          // (10) 대시보드(월간)에서만 notePaperBackground override 적용, weekly에서는 전역 유지
          push('INFO', '10) 대시보드 전용 note paper override (monthly만 투명, weekly는 불투명)');
          setDiaryStyle((prev) => ({
            ...prev,
            dashboardUseNotePaperOverride: true,
            dashboardNotePaperBackground: 'rgba(0,0,0,0)',
            uiPalette: { ...(prev.uiPalette as any), notePaperBackground: '#f7f5ed' }, // 전역은 불투명 유지
          }));
          await sleep(250);
          const dashPaperL = bg(paperLeft());
          push(dashPaperL === 'rgba(0, 0, 0, 0)' ? 'PASS' : 'FAIL', `10) monthly paper bg=${dashPaperL} expected=rgba(0, 0, 0, 0)`);

          // weekly로 전환 후 확인(초기 레이아웃 localStorage를 읽어야 함)
          try {
            localStorage.setItem(LAYOUT_PREF_KEY, JSON.stringify('weekly'));
          } catch {
            // ignore
          }
          sessionStorage.setItem('__selftest_phase', '6');
          location.reload();
          return;

          push('INFO', 'ALL DONE');
          setDone(true);
          sessionStorage.setItem('__selftest_done', '1');
          return;
        }

        // =========================================================
        // Phase 6: (10) weekly 화면에서 전역 notePaperBackground 유지 확인
        // =========================================================
        if (phase === 6) {
          push('INFO', '10) weekly 화면 전역 종이색 유지 확인');
          await sleep(300);
          const anyPaper = document.querySelector('.bg-custom-paper') as HTMLElement | null;
          const weeklyPaperBg = bg(anyPaper);
          push(weeklyPaperBg !== 'rgba(0, 0, 0, 0)' ? 'PASS' : 'FAIL', `10) weekly bg-custom-paper bg=${weeklyPaperBg}`);
          push('INFO', 'ALL DONE');
          setDone(true);
          sessionStorage.setItem('__selftest_done', '1');
          return;
        }

        push('FAIL', `unknown phase=${phase}`);
        setDone(true);
        sessionStorage.setItem('__selftest_done', '1');
      } catch (e) {
        if (!cancelled) {
          push('FAIL', `exception: ${(e as Error)?.message || String(e)}`);
          setDone(true);
          sessionStorage.setItem('__selftest_done', '1');
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Always-visible primary button for check (1)
  return (
    <div
      ref={rootRef}
      data-selftest-status={done ? 'done' : 'running'}
      className="fixed bottom-4 left-4 z-[9999] w-[420px] max-w-[92vw] rounded-xl border bg-white/90 backdrop-blur p-3 shadow-xl text-xs"
      style={{
        borderColor: 'var(--widget-border-color, rgba(148, 163, 184, 0.6))',
        color: 'var(--text-color-primary, #764737)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold">SelfTestRunner (7)</div>
        <div className="opacity-70">{done ? 'DONE' : 'RUNNING'}</div>
      </div>
      <div className="mb-2 flex gap-2">
        <button
          data-selftest="primary-btn"
          className="px-3 py-1.5 rounded font-bold bg-[var(--ui-primary-bg)] text-[var(--ui-primary-text)] hover:bg-[var(--ui-primary-hover)]"
        >
          PRIMARY
        </button>
      </div>
      <pre className="whitespace-pre-wrap max-h-48 overflow-auto rounded bg-black/5 p-2">
        {lines.join('\n')}
      </pre>
    </div>
  );
}


