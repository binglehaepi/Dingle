/**
 * Electron 메인 프로세스
 * 
 * 역할:
 * - 브라우저 윈도우 생성
 * - 파일 시스템 접근
 * - IPC 핸들러 등록
 * - 메뉴 바 설정
 */

import { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut, screen, Tray, Menu, nativeImage } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs/promises';
import fsSync, { existsSync, mkdirSync } from 'fs';

// 개발 모드 체크
const isDev = !app.isPackaged;

// ✅ 로그 파일 저장 설정
const logPath = path.join(app.getPath('userData'), 'debug.log');
let logStream: fsSync.WriteStream | null = null;

function initLogStream() {
  try {
    logStream = fsSync.createWriteStream(logPath, { flags: 'a' });
    console.log('[log] Log file initialized:', logPath);
  } catch (err) {
    console.error('[log] Failed to initialize log file:', err);
  }
}

function log(...args: any[]) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ')}\n`;
  
  // 콘솔에도 출력
  console.log(...args);
  
  // 파일에도 저장
  if (logStream && !logStream.destroyed) {
    try {
      logStream.write(message);
    } catch (err) {
      console.error('[log] Failed to write to log file:', err);
    }
  }
}

type WindowMode = 'app' | 'overlay';
type DisplayMode = 'background' | 'mini';

let appWin: BrowserWindow | null = null;
let overlayWin: BrowserWindow | null = null;
let isQuitting = false;
let forceCloseOverlayWin = false;
const modeByWebContentsId = new Map<number, WindowMode>();
let overlayLocked = false;
let overlayAlwaysOnTop = false; // 기본적으로 일반 창처럼 동작

let overlayAliveTimer: NodeJS.Timeout | null = null;
let overlayAwaitingRendererAlive = false; // "보이게 하는 트리거" 상태만 의미 (destroy 기준 아님)
let overlayGen = 0;
let overlayWinId: number | null = null;
let overlayWcId: number | null = null;
let overlayUiReadyTimer: NodeJS.Timeout | null = null;
let overlayUiReady = false;
let overlayRendererAliveSeen = false;
let displayMode: DisplayMode = 'background';
let currentDiaryId: string = 'default'; // 단일 다이어리 ID (고정)
let tray: Tray | null = null; // 시스템 트레이

async function setDisplayModeInternal(nextMode: DisplayMode) {
  const next: DisplayMode = nextMode === 'mini' ? 'mini' : 'background';
  displayMode = next;

  if (next === 'mini') {
    // mini = overlay only (appWin은 최소 hide)
    if (appWin && !appWin.isDestroyed()) {
      try { appWin.hide(); } catch { /* ignore */ }
    }

    if (overlayWin && overlayWin.isDestroyed()) overlayWin = null;
    if (!overlayWin) {
      overlayLocked = false;
      overlayAwaitingRendererAlive = true;
      overlayRendererAliveSeen = false;
      overlayUiReady = false;
      clearOverlayUiReadyTimer();
      overlayGen += 1;
      const localGen = overlayGen;
      overlayWin = await createWindow('overlay', { overlayGen: localGen });
      overlayWinId = overlayWin.id;
      overlayWcId = overlayWin.webContents.id;
      // ✅ Force center immediately after creation
      centerOverlayWindow(overlayWin);
      console.log('[overlay] created and centered', { winId: overlayWinId, wcId: overlayWcId, gen: overlayGen });
    } else {
      try { 
        centerOverlayWindow(overlayWin);
        overlayWin.showInactive();
        // ✅ Double-check position after show
        setTimeout(() => {
          try {
            if (overlayWin && !overlayWin.isDestroyed()) {
              centerOverlayWindow(overlayWin);
            }
          } catch {}
        }, 100);
      } catch { 
        try { 
          centerOverlayWindow(overlayWin);
          overlayWin.show(); 
          overlayWin.blur();
          // ✅ Double-check position after show
          setTimeout(() => {
            try {
              if (overlayWin && !overlayWin.isDestroyed()) {
                centerOverlayWindow(overlayWin);
              }
            } catch {}
          }, 100);
        } catch { /* ignore */ } 
      }
    }

    console.log('[mode] setDisplayMode -> mini', {
      appWin: appWin && !appWin.isDestroyed() ? { id: appWin.id, visible: appWin.isVisible?.() } : null,
      overlayWin: overlayWin && !overlayWin.isDestroyed() ? { id: overlayWin.id, visible: overlayWin.isVisible?.() } : null,
    });
    return { mode: 'mini' as const };
  }

  // background = appWin only (overlay는 destroy)
  if (overlayWin && !overlayWin.isDestroyed()) {
    try {
      console.log('[overlay] destroyed', { winId: overlayWin.id, wcId: overlayWcId, gen: overlayGen });
      forceCloseOverlayWin = true;
      overlayWin.destroy();
    } catch {
      // ignore
    }
  }
  overlayWin = null;
  overlayWinId = null;
  overlayWcId = null;
  overlayAwaitingRendererAlive = false;
  overlayUiReady = false;
  overlayRendererAliveSeen = false;
  clearOverlayAliveTimer();
  clearOverlayUiReadyTimer();

  if (!appWin || appWin.isDestroyed()) {
    appWin = await createWindow('app');
  }
  try { appWin.show(); } catch { /* ignore */ }
  // 포커스 훔침 최소화 (가능하면 inactive)
  try { appWin.showInactive(); } catch { /* ignore */ }

  console.log('[mode] setDisplayMode -> background', {
    appWin: appWin && !appWin.isDestroyed() ? { id: appWin.id, visible: appWin.isVisible?.() } : null,
    overlayWin: null,
  });
  return { mode: 'background' as const };
}

function clearOverlayAliveTimer() {
  if (overlayAliveTimer) {
    try { clearTimeout(overlayAliveTimer); } catch { /* ignore */ }
    overlayAliveTimer = null;
  }
}

function clearOverlayUiReadyTimer() {
  if (overlayUiReadyTimer) {
    try { clearTimeout(overlayUiReadyTimer); } catch { /* ignore */ }
    overlayUiReadyTimer = null;
  }
}

function isCurrentOverlayWin(win: BrowserWindow, localGen: number) {
  if (localGen !== overlayGen) return false;
  if (overlayWinId == null) return false;
  if (overlayWinId !== win.id) return false;
  return true;
}

console.log('[main] pid=', process.pid);

// ✅ 화면 크기에 맞는 최적 Overlay 크기 계산
// 목표: 모든 해상도에서 1100px 콘텐츠가 "작은 다이어리"처럼 보이게
function getOptimalOverlaySize() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // 1100px 모드가 항상 여유있게 보이도록 화면의 60%로 설정
  // 1366x768 노트북: 820x461 윈도우 → 1100px 콘텐츠가 0.745배 축소
  // 1920x1080 모니터: 1152x648 윈도우 → 1100px 콘텐츠가 1.0배 (여유있음)
  const targetWidth = Math.floor(width * 0.6);
  const targetHeight = Math.floor(height * 0.6);
  
  const finalWidth = Math.max(targetWidth, 820);   // 최소 820px
  const finalHeight = Math.max(targetHeight, 490);  // 최소 490px
  
  console.log('[overlay] Screen:', width, 'x', height, '→ Window:', finalWidth, 'x', finalHeight, `(${Math.round(finalWidth/width*100)}% x ${Math.round(finalHeight/height*100)}%)`);
  
  return { 
    width: finalWidth,
    height: finalHeight
  };
}

// ✅ Overlay 윈도우를 화면 중앙에 배치 (작업표시줄 고려)
function centerOverlayWindow(win: BrowserWindow) {
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const { x: workAreaX, y: workAreaY } = primaryDisplay.workArea;
    
    const [windowWidth, windowHeight] = win.getSize();
    
    // Calculate center position
    const x = workAreaX + Math.floor((screenWidth - windowWidth) / 2);
    const y = workAreaY + Math.floor((screenHeight - windowHeight) / 2);
    
    // Force position update
    win.setPosition(x, y, false);
    
    console.log('[overlay] Centered at', { x, y, windowWidth, windowHeight, screenWidth, screenHeight });
  } catch (err) {
    console.error('[overlay] Failed to center window:', err);
  }
}

// overlay 기본 시작 크기(항상 이 값으로 시작)
// L사이즈 기준 (1500x920) - 택이 잘리지 않도록 크기 증가
const OVERLAY_DEFAULT_W = 1500;
const OVERLAY_DEFAULT_H = 920;
const OVERLAY_ASPECT = OVERLAY_DEFAULT_W / OVERLAY_DEFAULT_H;
const OVERLAY_MIN_W = 930;
const OVERLAY_MIN_H = Math.round(OVERLAY_MIN_W / OVERLAY_ASPECT);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeOverlayBounds(args: {
  lastBounds: Electron.Rectangle;
  proposed: Electron.Rectangle;
  edge?: string;
}): Electron.Rectangle {
  const { lastBounds, proposed } = args;
  const edge = String(args.edge || '');

  // base workArea
  const wa = screen.getDisplayMatching(lastBounds).workArea;

  // decide driver axis
  const dw = proposed.width - lastBounds.width;
  const dh = proposed.height - lastBounds.height;
  let drive: 'w' | 'h' = Math.abs(dw) >= Math.abs(dh) ? 'w' : 'h';
  if (edge.includes('top') || edge.includes('bottom')) drive = edge.includes('left') || edge.includes('right') ? drive : 'h';
  if (edge.includes('left') || edge.includes('right')) drive = edge.includes('top') || edge.includes('bottom') ? drive : 'w';

  let width = Math.round(proposed.width);
  let height = Math.round(proposed.height);

  if (drive === 'w') {
    width = clamp(width, OVERLAY_MIN_W, wa.width);
    height = Math.round(width / OVERLAY_ASPECT);
  } else {
    height = clamp(height, OVERLAY_MIN_H, wa.height);
    width = Math.round(height * OVERLAY_ASPECT);
  }

  // after ratio, clamp again if overflowing workArea
  if (width > wa.width) {
    width = wa.width;
    height = Math.round(width / OVERLAY_ASPECT);
  }
  if (height > wa.height) {
    height = wa.height;
    width = Math.round(height * OVERLAY_ASPECT);
  }
  width = Math.max(OVERLAY_MIN_W, width);
  height = Math.max(OVERLAY_MIN_H, height);

  // anchor based on edge
  let x = proposed.x;
  let y = proposed.y;
  if (edge.includes('left')) {
    x = lastBounds.x + lastBounds.width - width;
  }
  if (edge.includes('top')) {
    y = lastBounds.y + lastBounds.height - height;
  }
  if (!edge) {
    // default: keep top-left
    x = lastBounds.x;
    y = lastBounds.y;
  }

  // clamp position into workArea
  x = clamp(x, wa.x, wa.x + wa.width - width);
  y = clamp(y, wa.y, wa.y + wa.height - height);
  return { x, y, width, height };
}

// ✅ aspectRatio 제거: 자유로운 크기 조절 허용
// function applyOverlayContentAspect(win: BrowserWindow, reason: string) {
//   try {
//     if (!win || win.isDestroyed()) return;
//     const [w, h] = win.getSize();
//     const [cw, ch] = win.getContentSize();
//     const extra = { width: Math.max(0, w - cw), height: Math.max(0, h - ch) };
//     win.setAspectRatio(OVERLAY_ASPECT, extra);
//     console.log('[overlay] setAspectRatio', { reason, aspect: OVERLAY_ASPECT, extra });
//   } catch (e) {
//     console.log('[overlay] setAspectRatio failed', { reason, error: String(e) });
//   }
// }

// 단일 인스턴스 잠금 (유령창/다중 프로세스 방지)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  console.log('[main] single instance lock failed -> exit(0)', { pid: process.pid });
  app.exit(0);
} else {
  app.on('second-instance', () => {
    try {
      const w = appWin && !appWin.isDestroyed() ? appWin : BrowserWindow.getAllWindows()[0];
      if (w) {
        if (w.isMinimized()) w.restore();
        w.show();
        w.focus();
      }
    } catch {
      // ignore
    }
  });
}

function forceCleanupAllWindows(reason: string) {
  try {
    console.log('[cleanup] forceCleanupAllWindows', { pid: process.pid, reason });
  } catch {
    // ignore
  }
  try {
    forceCloseOverlayWin = true;
  } catch {
    // ignore
  }
  try {
    const wins = BrowserWindow.getAllWindows();
    for (const w of wins) {
      try {
        w.destroy();
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  } finally {
    clearOverlayAliveTimer();
    clearOverlayUiReadyTimer();
    overlayAwaitingRendererAlive = false;
    overlayUiReady = false;
    overlayRendererAliveSeen = false;
    overlayWinId = null;
    overlayWcId = null;
    appWin = null;
    overlayWin = null;
    overlayLocked = false;
    modeByWebContentsId.clear();
  }
}

// ═══════════════════════════════════════════════════════
// 🔔 시스템 트레이
// ═══════════════════════════════════════════════════════

function createTray() {
  if (tray) {
    return; // 이미 생성됨
  }

  try {
    // 트레이 아이콘 경로 (개발/프로덕션 모두 지원)
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'icon.png')
      : path.join(__dirname, '../build/icon.png');

    // 아이콘 파일이 없으면 기본 아이콘 사용
    let icon: Electron.NativeImage;
    if (fsSync.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
    } else {
      // 기본 아이콘 (작은 빈 이미지)
      icon = nativeImage.createEmpty();
    }

    tray = new Tray(icon);
    tray.setToolTip('Dingle - 디지털 스크랩 다이어리');

    // 트레이 아이콘 클릭 → Overlay 토글
    tray.on('click', () => {
      toggleOverlayVisibility();
    });

    // 컨텍스트 메뉴
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '다이어리 표시',
        click: () => {
          showOverlay();
        }
      },
      {
        label: '다이어리 숨기기',
        click: () => {
          hideOverlay();
        }
      },
      { type: 'separator' },
      {
        label: '종료',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);

    console.log('[tray] System tray created');
  } catch (error) {
    console.error('[tray] Failed to create tray:', error);
  }
}

function toggleOverlayVisibility() {
  if (!overlayWin || overlayWin.isDestroyed()) {
    console.log('[tray] Overlay window not available');
    return;
  }

  if (overlayWin.isVisible()) {
    overlayWin.hide();
    console.log('[tray] Overlay hidden');
  } else {
    // Force recenter before showing
    centerOverlayWindow(overlayWin);
    overlayWin.show();
    overlayWin.focus();
    console.log('[tray] Overlay shown');
  }
}

function showOverlay() {
  if (!overlayWin || overlayWin.isDestroyed()) {
    console.log('[tray] Overlay window not available');
    return;
  }

  // Force recenter before showing
  centerOverlayWindow(overlayWin);
  overlayWin.show();
  overlayWin.focus();
  console.log('[tray] Overlay shown');
}

function hideOverlay() {
  if (!overlayWin || overlayWin.isDestroyed()) {
    console.log('[tray] Overlay window not available');
    return;
  }

  overlayWin.hide();
  console.log('[tray] Overlay hidden');
}

// ═══════════════════════════════════════════════════════
// 🔮 OhaAsa Horoscope (official)
// ═══════════════════════════════════════════════════════

type OhaasaSignId =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

const OHAASA_SOURCE_URL = 'https://www.asahi.co.jp/ohaasa/week/horoscope';
const OHAASA_JSON_URL = 'https://www.asahi.co.jp/data/ohaasa2020/horoscope.json';

// Asahi JSON "horoscope_st" seems to be 01..12 (Aries..Pisces)
const OHAASA_SIGN_TO_ST: Record<OhaasaSignId, string> = {
  aries: '01',
  taurus: '02',
  gemini: '03',
  cancer: '04',
  leo: '05',
  virgo: '06',
  libra: '07',
  scorpio: '08',
  sagittarius: '09',
  capricorn: '10',
  aquarius: '11',
  pisces: '12',
};

const ohaasaCacheByDay = new Map<string, any>(); // key: onair_date (YYYYMMDD) -> raw json object
const ohaasaResultCache = new Map<string, any>(); // key: `${onair_date}:${sign}` -> response
const ohaasaLuckyColorCache = new Map<string, Map<string, string>>(); // key: onair_date

function yyyymmddToIso(d: string): string {
  if (!/^\d{8}$/.test(d)) return d;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

async function fetchOhaasaJson(): Promise<any> {
  const res = await fetch(OHAASA_JSON_URL, { headers: { 'User-Agent': 'DigitalScrapDiary/1.0' } as any });
  if (!res.ok) throw new Error(`OhaAsa json fetch failed: ${res.status}`);
  return await res.json();
}

// HTML 페이지에서 행운 컬러 크롤링
async function fetchOhaasaLuckyColors(): Promise<Map<string, string>> {
  try {
    const res = await fetch(OHAASA_SOURCE_URL, {
      headers: { 'User-Agent': 'DigitalScrapDiary/1.0' } as any
    });
    if (!res.ok) throw new Error(`OhaAsa HTML fetch failed: ${res.status}`);
    
    const html = await res.text();
    const luckyColors = new Map<string, string>();
    
    // HTML 파싱: 각 별자리별 행운 컬러 추출
    // 예: <div class="lucky_color">ラッキーカラー：赤</div>
    const regex = /ラッキーカラー[：:]\s*([^\s<]+)/gi;
    let match;
    let signIndex = 1; // 01부터 12까지
    
    while ((match = regex.exec(html)) !== null && signIndex <= 12) {
      const jaColor = match[1].trim();
      const st = String(signIndex).padStart(2, '0');
      luckyColors.set(st, jaColor);
      signIndex++;
    }
    
    return luckyColors;
  } catch (error) {
    console.error('[ohaasa] Failed to fetch lucky colors:', error);
    return new Map(); // 실패 시 빈 맵 반환
  }
}

// 일본어 컬러명 → 한국어 번역
const COLOR_TRANSLATIONS: Record<string, string> = {
  '赤': '빨강',
  '青': '파랑',
  '黄色': '노랑',
  '緑': '초록',
  '白': '흰색',
  '黒': '검정',
  'ピンク': '분홍',
  'オレンジ': '주황',
  '紫': '보라',
  '茶色': '갈색',
  '金': '금색',
  '銀': '은색',
  'グレー': '회색',
  'ベージュ': '베이지',
  '水色': '하늘색',
  'レモンイエロー': '레몬색',
  'ラベンダー': '라벤더',
};

function translateColorJaToKo(jaColor: string): string {
  return COLOR_TRANSLATIONS[jaColor] || jaColor;
}

async function getOhaasaHoroscope(params: { date: string; sign: OhaasaSignId }) {
  console.log('🔮 [OhaAsa] 호출:', { requestDate: params.date, sign: params.sign });
  
  // date is for cache key only (official json has its own onair_date)
  const raw = await fetchOhaasaJson();
  const entry = Array.isArray(raw) ? raw[0] : raw;
  const onair = String(entry?.onair_date || '');
  
  console.log('📅 [OhaAsa] JSON onair_date:', onair);
  
  if (!onair) throw new Error('OhaAsa json missing onair_date');

  // cache raw by day
  if (!ohaasaCacheByDay.has(onair)) ohaasaCacheByDay.set(onair, entry);

  // 행운 컬러 가져오기 (날짜별로 한 번만)
  if (!ohaasaLuckyColorCache.has(onair)) {
    const colors = await fetchOhaasaLuckyColors();
    ohaasaLuckyColorCache.set(onair, colors);
  }

  const cacheKey = `${onair}:${params.sign}`;
  const cached = ohaasaResultCache.get(cacheKey);
  if (cached) {
    console.log('📦 [OhaAsa] 캐시 반환:', cached);
    return cached;
  }

  const st = OHAASA_SIGN_TO_ST[params.sign];
  const detail: any[] = entry?.detail || entry?.detail?.[0]?.detail || entry?.detail || [];
  const list = Array.isArray(detail) ? detail : [];
  
  // ⭐ 전체 순위 출력 (디버깅)
  console.log('📊 [OhaAsa] 전체 순위 데이터:', 
    list.map(x => ({
      st: x?.horoscope_st,
      rank: x?.ranking_no,
      sign: Object.entries(OHAASA_SIGN_TO_ST).find(([, v]) => v === x?.horoscope_st)?.[0]
    }))
  );
  
  const hit = list.find((x) => String(x?.horoscope_st) === st);
  
  console.log('🎯 [OhaAsa] 찾은 데이터:', {
    requestSign: params.sign,
    st: st,
    found: hit,
    rank: hit?.ranking_no
  });
  
  if (!hit) throw new Error(`OhaAsa sign not found: ${params.sign}`);

  // 행운 컬러 가져오기
  const luckyColors = ohaasaLuckyColorCache.get(onair) || new Map();
  const jaColor = luckyColors.get(st);
  const koColor = jaColor ? translateColorJaToKo(jaColor) : undefined;

  const result = {
    date: yyyymmddToIso(onair),
    sign: params.sign,
    rank: Number(hit?.ranking_no),
    textJa: typeof hit?.horoscope_text === 'string' ? hit.horoscope_text : undefined,
    luckyColor: koColor,
    luckyColorJa: jaColor,
    sourceUrl: OHAASA_SOURCE_URL,
  };
  
  console.log('✅ [OhaAsa] 결과 생성:', result);
  ohaasaResultCache.set(cacheKey, result);
  return result;
}

// ═══════════════════════════════════════════════════════
// 🗂️ 저장 경로
// ═══════════════════════════════════════════════════════

function getDiaryDir(): string {
  // Documents/ScrapDiary 폴더
  return path.join(app.getPath('documents'), 'ScrapDiary');
}

function getCurrentDiaryFile(): string {
  // 현재 작업 파일 (Phase 3에서 사용)
  return path.join(getDiaryDir(), 'current.json');
}

async function ensureDiaryDir(): Promise<void> {
  const dir = getDiaryDir();
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error('Failed to create diary directory:', error);
  }
}

// ═══════════════════════════════════════════════════════
// 🪟 윈도우 생성
// ═══════════════════════════════════════════════════════

function getWindowOptions(mode: WindowMode): Electron.BrowserWindowConstructorOptions {
  const commonWebPreferences: Electron.WebPreferences = {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true, // ✅ 보안: Renderer와 Main 격리
    nodeIntegration: false, // ✅ 보안: Node.js API 비활성화
    sandbox: false, // preload에서 Node.js 필요
    webSecurity: false, // ✅ SNS embed 스크립트 및 외부 리소스 허용 (Twitter, Instagram 등)
    allowRunningInsecureContent: true, // ✅ YouTube iframe 재생을 위한 혼합 콘텐츠 허용
    experimentalFeatures: true, // ✅ 실험적 기능 활성화 (YouTube 호환성)
  };

  // 아이콘 경로 설정
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '../build/icon.png');

  // preload 적용 여부를 로그로 확정(overlay에서 hasOverlayAlive=false 원인 분리)
  try {
    if (mode === 'overlay') console.log('[overlay] webPreferences.preload=', String(commonWebPreferences.preload));
  } catch {
    // ignore
  }

  if (mode === 'overlay') {
    // ✅ 화면 크기에 맞는 최적 크기 계산
    const { width, height } = getOptimalOverlaySize();
    
    // ✅ 화면 중앙에 배치 (작업표시줄 고려)
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const { x: workAreaX, y: workAreaY } = primaryDisplay.workArea;
    
    // 중앙 위치 계산
    const x = workAreaX + Math.floor((screenWidth - width) / 2);
    const y = workAreaY + Math.floor((screenHeight - height) / 2);
    
    return {
      width,
      height,
      x,  // ✅ 초기 x 위치 설정
      y,  // ✅ 초기 y 위치 설정
      minWidth: 820,    // 작은 노트북 최소 크기
      minHeight: 490,   // 작은 노트북 최소 크기
      resizable: false,
      // Windows frameless 리사이즈 보강
      thickFrame: false,
      maximizable: false,
      transparent: true,
      frame: false,
      backgroundColor: '#00000000',
      autoHideMenuBar: true,
      hasShadow: false,
      skipTaskbar: false,
      alwaysOnTop: overlayAlwaysOnTop,
      webPreferences: commonWebPreferences,
      show: false,
      icon: iconPath,
    };
  }

  // app 모드: 서재 스타일 (컴팩트 + frameless)
  // ✅ 화면 중앙에 배치
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const { x: workAreaX, y: workAreaY } = primaryDisplay.workArea;
  
  const appWidth = 1800;
  const appHeight = 800;
  const appX = workAreaX + Math.floor((screenWidth - appWidth) / 2);
  const appY = workAreaY + Math.floor((screenHeight - appHeight) / 2);
  
  return {
    width: appWidth,
    height: appHeight,
    x: appX,  // ✅ 초기 x 위치 설정
    y: appY,  // ✅ 초기 y 위치 설정
    minWidth: 1700,
    minHeight: 700,
    resizable: true,
    webPreferences: commonWebPreferences,
    frame: false, // ✅ 타이틀바/메뉴바 완전 제거
    backgroundColor: '#f9f7f4', // 따뜻한 베이지
    show: false,
    autoHideMenuBar: true,
    icon: iconPath,
  };
}

function getIndexHtmlPath(): string {
  return path.join(__dirname, '../dist/index.html');
}

function buildDevUrl(mode: WindowMode): string {
  return `http://localhost:3000/?windowMode=${mode}`;
}

function getOverlayDevUrlFromMainWindow(): { overlayUrl: string; source: 'mainWin' | 'fallback'; baseUrl?: string } {
  // 1) mainWindow(앱 기본 창)의 실제 로드 URL을 base로 사용
  try {
    if (appWin && !appWin.isDestroyed()) {
      const baseUrl = appWin.webContents.getURL();
      // 로드 전/비정상 URL 방지
      if (baseUrl && baseUrl !== 'about:blank') {
        const u = new URL(baseUrl);
        // 2) 기존 쿼리 유지 + windowMode만 overlay로 override
        u.searchParams.set('windowMode', 'overlay');
        return { overlayUrl: u.toString(), source: 'mainWin', baseUrl };
      }
    }
  } catch {
    // ignore
  }

  // 3) fallback(기존 devUrl) + 로그로 출처 확인 가능
  const overlayUrl = buildDevUrl('overlay');
  return { overlayUrl, source: 'fallback' };
}

async function createWindow(mode: WindowMode, opts?: { overlayGen?: number }) {
  const win = new BrowserWindow(getWindowOptions(mode));
  const wcId = win.webContents.id;
  modeByWebContentsId.set(wcId, mode);
  const localOverlayGen = mode === 'overlay' ? (opts?.overlayGen ?? overlayGen) : null;

  // 🔧 개발 모드에서 캐시 완전 비활성화 (HMR 반영 문제 해결)
  if (!app.isPackaged) {
    console.log('[dev] isPackaged:', app.isPackaged, 'mode:', mode, '- attempting cache clear...');
    try {
      win.webContents.session.clearCache().then(() => {
        console.log('[dev] ✅ Cache cleared for', mode, 'window');
      }).catch((err) => {
        console.warn('[dev] ❌ Failed to clear cache:', err);
      });
      win.webContents.session.clearStorageData({
        storages: ['filesystem', 'indexdb', 'localstorage', 
                   'shadercache', 'websql', 'serviceworkers', 'cachestorage']
      }).then(() => {
        console.log('[dev] ✅ Storage cleared for', mode, 'window');
      }).catch((err) => {
        console.warn('[dev] ❌ Failed to clear storage:', err);
      });
    } catch (err) {
      console.warn('[dev] ❌ Exception during cache clear:', err);
    }
  }

  // ✅ YouTube iframe 재생을 위한 User Agent 설정
  win.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['*://www.youtube.com/*', '*://youtube.com/*', '*://*.youtube.com/*'] },
    (details, callback) => {
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  if (mode === 'overlay') {
    // overlay는 생성 시점부터 "현재 overlay 인스턴스" 정보를 세팅 (레이스 가드용)
    if (localOverlayGen != null) {
      overlayWin = win;
      overlayWinId = win.id;
      overlayWcId = wcId;
    }
    
    // ✅ Force correct position on ready-to-show event
    win.once('ready-to-show', () => {
      try {
        centerOverlayWindow(win);
        console.log('[overlay] Position corrected on ready-to-show');
      } catch (err) {
        console.error('[overlay] Failed to center on ready-to-show:', err);
      }
    });
    
    // ✅ Force position immediately after creation
    try {
      centerOverlayWindow(win);
      console.log('[overlay] Position set immediately after creation');
    } catch (err) {
      console.error('[overlay] Failed to center after creation:', err);
    }
  }

  if (mode === 'overlay') {
    // ✅ 긴급 수정: opacity=0 제거하여 창이 즉시 보이도록 함
    // try { win.setOpacity(0); } catch { /* ignore */ }
    try { win.setBackgroundColor('#00000000'); } catch { /* ignore */ }
    // 기본 잠금 상태는 OFF(이동/조작 가능). click-through는 locked=true일 때만 적용.
    try { win.setIgnoreMouseEvents(false); } catch { /* ignore */ }
    try { win.setFocusable(true); } catch { /* ignore */ }
    // 리사이즈 비활성화
    try { win.setResizable(false); } catch { /* ignore */ }
    // ✅ 시작 크기 보험: 항상 동일한 시작 크기로 강제(리사이즈는 가능)
    try { win.setSize(OVERLAY_DEFAULT_W, OVERLAY_DEFAULT_H, false); } catch { /* ignore */ }
    // ✅ aspectRatio 제거: 자유로운 크기 조절 허용
    // applyOverlayContentAspect(win, 'createWindow:init');

    // ✅ aspectRatio 관련 이벤트 리스너 제거
    // const reapply = (r: string) => {
    //   if (localOverlayGen != null && !isCurrentOverlayWin(win, localOverlayGen)) return;
    //   if (win.isDestroyed()) return;
    //   try { setTimeout(() => applyOverlayContentAspect(win, r), 0); } catch { /* ignore */ }
    // };
    // win.on('maximize', () => reapply('maximize'));
    // win.on('unmaximize', () => reapply('unmaximize'));
    // win.on('enter-full-screen', () => reapply('enter-full-screen'));
    // win.on('leave-full-screen', () => reapply('leave-full-screen'));

    // ✅ “절대 비율 유지” (1550:860) - OS 리사이즈도 강제 보정 (resize 루프 방지 가드 포함)
    let lastBounds = win.getBounds();
    let inResizeGuard = false;
    let boundsSendTimer: NodeJS.Timeout | null = null;
    win.on('will-resize', (e: any, newBounds: Electron.Rectangle, details: any) => {
      if (inResizeGuard) return;
      if (win.isDestroyed()) return;
      try {
        inResizeGuard = true;
        e.preventDefault();
        const next = normalizeOverlayBounds({
          lastBounds,
          proposed: newBounds,
          edge: details?.edge,
        });
        lastBounds = next;
        win.setBounds(next, false);
      } catch {
        // ignore
      } finally {
        inResizeGuard = false;
      }
    });
    win.on('resize', () => {
      try {
        if (win.isDestroyed()) return;
        lastBounds = win.getBounds();
        // overlay UI 스케일 계산용 bounds push (debounce로 IPC 과다 방지)
        if (localOverlayGen != null && !isCurrentOverlayWin(win, localOverlayGen)) return;
        if (boundsSendTimer) return;
        boundsSendTimer = setTimeout(() => {
          boundsSendTimer = null;
          try {
            if (win.isDestroyed()) return;
            win.webContents.send('overlay:boundsChanged', win.getBounds());
          } catch {
            // ignore
          }
        }, 50);
      } catch {
        // ignore
      }
    });

    // ✅ 디버깅 보조(dev only): overlay renderer 콘솔을 main 터미널로 미러링
    if (!app.isPackaged) {
      try {
        win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
          // destroyed 레이스 방지
          if (localOverlayGen != null && !isCurrentOverlayWin(win, localOverlayGen)) return;
          console.log('[overlay:console]', { level, message, line, sourceId });
        });
      } catch {
        // ignore
      }
      // 필요 시 detach devtools로 overlay 콘솔/에러를 직접 확인 가능
      // 개발 환경에서만 자동으로 DevTools 열기
      if (!app.isPackaged) {
        try { win.webContents.openDevTools({ mode: 'detach' }); } catch { /* ignore */ }
      }
    }
  }

  // ✅ 최소 계측: overlay 로딩 실패/성공/ready-to-show 확인
  win.webContents.on('did-fail-load', (_e, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (mode !== 'overlay') return;
    if (!isMainFrame) return;
    if (localOverlayGen != null && !isCurrentOverlayWin(win, localOverlayGen)) return;
    console.log('[window] overlay did-fail-load', {
      errorCode,
      errorDescription,
      url: validatedURL,
    });

    // ✅ watchdog 단순화: 로드 실패(main frame)면 조용히 파괴(overlay는 opacity=0 기본이라 안전)
    try {
      if (win.isDestroyed()) return;
      console.log('[overlay] did-fail-load -> destroy');
      forceCloseOverlayWin = true;
      try { win.destroy(); } catch { /* ignore */ }
    } catch {
      // ignore
    } finally {
      if (overlayWin === win) overlayWin = null;
      if (overlayWinId === win.id) overlayWinId = null;
      if (overlayWcId === wcId) overlayWcId = null; // wcId는 생성 직후 캡처값
      overlayAwaitingRendererAlive = false;
      clearOverlayAliveTimer();
    }
  });

  win.webContents.on('did-finish-load', () => {
    if (mode !== 'overlay') return;
    if (localOverlayGen != null && !isCurrentOverlayWin(win, localOverlayGen)) return;
    console.log('[window] overlay did-finish-load');
  });

  // Ready-to-show 이벤트에서 윈도우 표시 (깜빡임 방지)
  if (mode !== 'overlay') {
    win.once('ready-to-show', () => {
      win.show();
    });
  } else {
    win.once('ready-to-show', () => {
      console.log('[window] overlay ready-to-show');
      if (localOverlayGen != null && !isCurrentOverlayWin(win, localOverlayGen)) return;
      if (win.isDestroyed()) return;
      // 포커스 최소화: overlay는 inactive로
      try {
        win.showInactive();
      } catch {
        try {
          win.show();
          win.blur();
        } catch {
          // ignore
        }
      }
      // ✅ aspectRatio 제거: 자유로운 크기 조절 허용
      // try { setTimeout(() => applyOverlayContentAspect(win, 'ready-to-show:tick'), 0); } catch { /* ignore */ }
    });
  }

  // 모드 전달은 “query + IPC fallback”으로 2중 안전장치:
  // - dev: loadURL(`${DEV_URL}?windowMode=${mode}`)
  // - prod: loadFile(indexPath, { query: { windowMode: mode } })
  if (!app.isPackaged) {
    if (mode === 'overlay') {
      const r = getOverlayDevUrlFromMainWindow();
      const queryApplied = r.overlayUrl.includes('windowMode=');
      console.log('[window] create overlay', { urlOrFile: r.overlayUrl, queryApplied, source: r.source, baseUrl: r.baseUrl });
      console.log('[overlay] loadURL', r.overlayUrl);
      await win.loadURL(r.overlayUrl);
    } else {
      const url = buildDevUrl(mode);
      const queryApplied = url.includes('windowMode=');
      await win.loadURL(url);
    }
  } else {
    const indexPath = getIndexHtmlPath();
    const queryApplied = true;
    if (mode === 'overlay') console.log('[window] create overlay', { urlOrFile: indexPath, queryApplied });
    await win.loadFile(indexPath, { query: { windowMode: mode } });
  }

  win.webContents.on('did-finish-load', () => {
    try {
      const u = win.webContents.getURL();
      if (mode === 'overlay') console.log('[window] overlay did-finish-load url=', u);
    } catch (e) {
      if (mode === 'overlay') console.log('[window] overlay did-finish-load url= <error>', e);
    }

    if (mode === 'overlay') {
      if (localOverlayGen != null && !isCurrentOverlayWin(win, localOverlayGen)) return;
      if (win.isDestroyed()) return;
      // skipTaskbar 보강 제거 - 작업 표시줄에 표시하기 위해
      // try { win.setSkipTaskbar(true); } catch { /* ignore */ }
    }
  });

  if (!app.isPackaged && mode === 'app') {
    win.webContents.openDevTools();
  }

  // app 모드: 메뉴바 완전 제거
  if (mode === 'app') {
    try {
      win.setAutoHideMenuBar(true);
      win.setMenuBarVisibility(false);
      // @ts-ignore Electron allows null to remove menu
      win.setMenu(null);
      console.log('[window] app menu removed');
    } catch (e) {
      console.log('[window] app menu hide failed', e);
    }
  }

  if (mode === 'overlay') {
    if (localOverlayGen != null && !isCurrentOverlayWin(win, localOverlayGen)) {
      // 생성 도중 세대가 바뀐 경우: overlay 설정 적용 금지
    } else {
    // 선택: 워크스페이스/전체화면에서도 표시
    try { win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); } catch { /* ignore */ }
    // Windows: 메뉴바/앱 메뉴 제거(overlay에 File/Edit/View... 보이면 실패)
    try {
      win.setAutoHideMenuBar(true);
      win.setMenuBarVisibility(false);
      // @ts-ignore Electron allows null to remove menu
      win.setMenu(null);
    } catch (e) {
      console.log('[window] overlay menu hide failed', e);
    }

    // taskbar 표시 허용
    // try { win.setSkipTaskbar(true); } catch { /* ignore */ }

    // alwaysOnTop: 체감되게 level 지정
    try { win.setAlwaysOnTop(overlayAlwaysOnTop, 'screen-saver'); } catch { win.setAlwaysOnTop(overlayAlwaysOnTop); }

    // overlayWin: 닫기(X/Alt+F4)는 destroy 대신 hide로 처리(기본)
    win.on('close', (e) => {
      if (isQuitting || forceCloseOverlayWin) return;
      e.preventDefault();
      try {
        if (!win.isDestroyed()) win.hide();
      } finally {
        console.log('[window] overlay close -> preventDefault + hide');
      }
    });
    }
  }

  // 윈도우 닫기 이벤트
  win.on('closed', () => {
    // ❗️레이스 방지: destroyed 상태에서 webContents 접근 금지 (wcId 캡처값 사용)
    modeByWebContentsId.delete(wcId);
    if (mode === 'overlay') {
      if (overlayWin === win) overlayWin = null;
      clearOverlayAliveTimer();
      clearOverlayUiReadyTimer();
      overlayAwaitingRendererAlive = false;
      overlayUiReady = false;
      overlayRendererAliveSeen = false;
      if (overlayWinId === win.id) overlayWinId = null;
      if (overlayWcId === wcId) overlayWcId = null;
      forceCloseOverlayWin = false;
      overlayLocked = false;
      console.log('[window] overlay closed -> overlayWin=null');
    } else {
      appWin = null;
      // 기본 정책: mainWin 종료 시 overlayWin도 destroy해서 프로세스 종료가 자연스럽게 되도록
      if (overlayWin && !overlayWin.isDestroyed()) {
        try {
          forceCloseOverlayWin = true;
          console.log('[window] app closed -> destroying overlayWin');
          overlayWin.destroy();
        } catch (e) {
          console.log('[window] app closed -> destroy overlayWin failed', e);
        }
      }
    }
  });

  return win;
}

// ═══════════════════════════════════════════════════════
// 🚀 앱 라이프사이클
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// 🔄 기존 데이터 마이그레이션
// ═══════════════════════════════════════════════════════

async function migrateExistingDiary() {
  try {
    const oldPath = path.join(getDiaryDir(), 'current.json');
    const newPath = path.join(getDiaryDir(), 'diary.json');
    
    // 이미 diary.json이 있으면 스킵
    const newExists = await fs.access(newPath).then(() => true).catch(() => false);
    if (newExists) {
      console.log('[migration] diary.json already exists');
      return;
    }
    
    // diary-default.json 확인 (이전 마이그레이션 버전)
    const oldDefaultPath = path.join(getDiaryDir(), 'diary-default.json');
    const oldDefaultExists = await fs.access(oldDefaultPath).then(() => true).catch(() => false);
    
    if (oldDefaultExists) {
      console.log('[migration] Migrating from diary-default.json...');
      const oldData = await fs.readFile(oldDefaultPath, 'utf-8');
      await fs.writeFile(newPath, oldData, 'utf-8');
      console.log('[migration] ✅ Migration complete! Created diary.json from diary-default.json');
      return;
    }
    
    // current.json 확인 (구버전)
    const oldExists = await fs.access(oldPath).then(() => true).catch(() => false);
    if (oldExists) {
      console.log('[migration] Migrating from current.json...');
      const oldData = await fs.readFile(oldPath, 'utf-8');
      await fs.writeFile(newPath, oldData, 'utf-8');
      
      // current.json은 백업으로 이름 변경
      const backupPath = path.join(getDiaryDir(), 'current.json.backup');
      await fs.rename(oldPath, backupPath).catch(() => {});
      
      console.log('[migration] ✅ Migration complete! Created diary.json from current.json');
      return;
    }
    
    console.log('[migration] No old data to migrate');
    
  } catch (error) {
    console.error('[migration] Migration failed:', error);
  }
}

// ═══════════════════════════════════════════════════════
// 🔄 자동 업데이트 (Auto Update)
// ═══════════════════════════════════════════════════════

// autoUpdater 설정
autoUpdater.autoDownload = false; // 자동 다운로드 비활성화 (사용자에게 먼저 알림)
autoUpdater.autoInstallOnAppQuit = true; // 앱 종료 시 자동 설치

// 개발 모드에서는 업데이트 체크 비활성화
if (!app.isPackaged) {
  autoUpdater.updateConfigPath = path.join(__dirname, '../dev-app-update.yml');
  console.log('[updater] Development mode - auto update disabled');
}

function setupAutoUpdater() {
  // 업데이트 확인 중
  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] Checking for updates...');
    if (appWin && !appWin.isDestroyed()) {
      appWin.webContents.send('update:checking');
    }
  });

  // 업데이트 사용 가능
  autoUpdater.on('update-available', (info) => {
    console.log('[updater] Update available:', info.version);
    if (appWin && !appWin.isDestroyed()) {
      appWin.webContents.send('update:available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    }
  });

  // 최신 버전 사용 중
  autoUpdater.on('update-not-available', (info) => {
    console.log('[updater] Update not available. Current version:', info.version);
    if (appWin && !appWin.isDestroyed()) {
      appWin.webContents.send('update:not-available', { version: info.version });
    }
  });

  // 다운로드 진행률
  autoUpdater.on('download-progress', (progress) => {
    console.log(`[updater] Download progress: ${progress.percent.toFixed(2)}%`);
    if (appWin && !appWin.isDestroyed()) {
      appWin.webContents.send('update:download-progress', {
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total,
      });
    }
  });

  // 다운로드 완료
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[updater] Update downloaded:', info.version);
    if (appWin && !appWin.isDestroyed()) {
      appWin.webContents.send('update:downloaded', {
        version: info.version,
        releaseNotes: info.releaseNotes,
      });
    }
  });

  // 에러 처리
  autoUpdater.on('error', (error) => {
    console.error('[updater] Error:', error);
    if (appWin && !appWin.isDestroyed()) {
      appWin.webContents.send('update:error', {
        message: error.message,
      });
    }
  });
}

// IPC 핸들러: 업데이트 확인
ipcMain.handle('update:check', async () => {
  if (!app.isPackaged) {
    return { success: false, message: 'Updates disabled in development mode' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (error) {
    console.error('[updater] Check failed:', error);
    return { success: false, error: String(error) };
  }
});

// IPC 핸들러: 업데이트 다운로드
ipcMain.handle('update:download', async () => {
  if (!app.isPackaged) {
    return { success: false, message: 'Updates disabled in development mode' };
  }
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error('[updater] Download failed:', error);
    return { success: false, error: String(error) };
  }
});

// IPC 핸들러: 지금 재시작하고 설치
ipcMain.handle('update:install', () => {
  setImmediate(() => {
    app.removeAllListeners('window-all-closed');
    autoUpdater.quitAndInstall(false, true);
  });
  return { success: true };
});

if (gotLock) app.whenReady().then(async () => {
  // ✅ 로그 파일 초기화
  initLogStream();
  log('[app] Application starting...', { 
    version: app.getVersion(),
    userData: app.getPath('userData'),
    isPackaged: app.isPackaged 
  });
  
  await ensureDiaryDir();
  
  // ✅ 기존 데이터 마이그레이션
  await migrateExistingDiary();
  
  // ✅ SNS embed 및 외부 리소스 로딩 허용 (Twitter, Instagram 등)
  const { session } = require('electron');
  
  try {
    session.defaultSession.webRequest.onBeforeSendHeaders((details: any, callback: any) => {
      // Twitter/Instagram embed 허용
      callback({ requestHeaders: { ...details.requestHeaders, Origin: '*' } });
    });

    session.defaultSession.webRequest.onHeadersReceived((details: any, callback: any) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"]
        }
      });
    });
    
    console.log('[CSP] Content Security Policy relaxed for SNS embeds');
  } catch (cspError) {
    console.error('[CSP] Failed to set CSP:', cspError);
  }

  // ✅ 단일 다이어리 모드: 바로 overlay 생성
  console.log('[app] Starting in single-diary mode (no library window)');
  
  // overlay 생성
  displayMode = 'mini';
  overlayLocked = false;
  overlayAwaitingRendererAlive = true;
  overlayRendererAliveSeen = false;
  overlayUiReady = false;
  clearOverlayUiReadyTimer();
  overlayGen += 1;
  const localGen = overlayGen;
  overlayWin = await createWindow('overlay', { overlayGen: localGen });
  overlayWinId = overlayWin.id;
  overlayWcId = overlayWin.webContents.id;
  console.log('[overlay] Single diary mode started', { winId: overlayWinId, wcId: overlayWcId, diaryId: currentDiaryId });

  // 🔔 시스템 트레이 생성
  createTray();

  // 🔄 자동 업데이트 설정 및 시작
  setupAutoUpdater();
  
  // 프로덕션 모드에서만 자동으로 업데이트 체크 (앱 시작 5초 후)
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error('[updater] Auto-check failed:', err);
      });
    }, 5000);
  }

  // 🧯 긴급 탈출키: 유령 오버레이/클릭통과 상태에서도 무조건 종료
  try {
    const ok = globalShortcut.register('Control+Alt+Shift+X', () => {
      console.log('[panic] Ctrl+Alt+Shift+X -> forceCleanupAllWindows + exit(0)', { pid: process.pid });
      forceCleanupAllWindows('panic-shortcut');
      app.exit(0);
    });
    console.log('[shortcut] register Ctrl+Alt+Shift+X =', ok);
  } catch (e) {
    console.log('[shortcut] register failed', e);
  }

  // 🔧 디버그 단축키: 모든 창의 개발자 도구 열기 및 표시
  try {
    const ok = globalShortcut.register('Control+Shift+F12', () => {
      console.log('[debug] Ctrl+Shift+F12 -> force open DevTools for all windows');
      
      const allWindows = BrowserWindow.getAllWindows();
      for (const win of allWindows) {
        try {
          if (!win.isDestroyed()) {
            win.webContents.openDevTools({ mode: 'detach' });
            win.setOpacity(1); // 혹시 숨겨져 있다면 표시
            win.show();
            console.log('[debug] Opened DevTools for window:', win.id);
          }
        } catch (err) {
          console.error('[debug] Failed to open DevTools for window:', win.id, err);
        }
      }
    });
    console.log('[shortcut] register Ctrl+Shift+F12 =', ok);
  } catch (e) {
    console.log('[shortcut] register Ctrl+Shift+F12 failed', e);
  }

  // macOS: 독에서 아이콘 클릭 시 윈도우 재생성
  app.on('activate', () => {
    if (!appWin) createWindow('app').then((w) => (appWin = w));
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  forceCleanupAllWindows('before-quit');
});

app.on('will-quit', () => {
  try {
    globalShortcut.unregisterAll();
  } catch {
    // ignore
  }
  
  // ✅ 로그 파일 스트림 닫기
  if (logStream && !logStream.destroyed) {
    try {
      log('[app] Application quitting...');
      logStream.end();
    } catch (err) {
      console.error('[log] Failed to close log stream:', err);
    }
  }
});

// 모든 윈도우 닫힘 (Windows에서도 무조건 종료 루트로)
app.on('window-all-closed', () => {
  forceCleanupAllWindows('window-all-closed');
  app.quit();
});

// ═══════════════════════════════════════════════════════
// 📡 IPC 핸들러
// ═══════════════════════════════════════════════════════

// --- 앱 정보 ---

ipcMain.handle('app:getPaths', () => {
  return {
    documents: app.getPath('documents'),
    userData: app.getPath('userData'),
    diaryDir: getDiaryDir(),
  };
});

ipcMain.handle('app:getVersion', () => {
  return {
    app: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  };
});

// --- OhaAsa Horoscope ---
ipcMain.handle('ohaasa:horoscope', async (_event, params: { date: string; sign: OhaasaSignId }) => {
  return await getOhaasaHoroscope(params);
});

ipcMain.handle('ohaasa:clearCache', async () => {
  console.log('🗑️ [OhaAsa] Electron 캐시 클리어');
  ohaasaCacheByDay.clear();
  ohaasaResultCache.clear();
  ohaasaLuckyColorCache.clear();
  return { success: true };
});

// --- 외부 링크 열기 (no SPA navigation) ---
ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { success: false, error: 'invalid protocol' };
    }
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// --- Window Mode (App/Note) ---
ipcMain.handle('window:setDisplayMode', async (_e, mode: DisplayMode) => {
  return await setDisplayModeInternal(mode);
});

ipcMain.handle('window:openOverlayMode', async () => {
  // legacy API: mini 모드로 전환
  return await setDisplayModeInternal('mini');
});

ipcMain.handle('window:closeOverlayMode', async () => {
  // legacy API: background 모드로 전환(overlay destroy)
  return await setDisplayModeInternal('background');
});

ipcMain.handle('overlay:setLocked', async (_e, locked: boolean) => {
  overlayLocked = !!locked;
  if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.setIgnoreMouseEvents(overlayLocked, { forward: true });
    try {
      overlayWin.setFocusable(!overlayLocked);
    } catch {
      // ignore
    }
    if (overlayLocked) {
      try { overlayWin.blur(); } catch { /* ignore */ }
    }
  }
  console.log('[window] overlay lock ->', overlayLocked);
  return { locked: overlayLocked };
});

ipcMain.handle('overlay:setAlwaysOnTop', async (_e, on: boolean) => {
  overlayAlwaysOnTop = !!on;
  if (overlayWin && !overlayWin.isDestroyed()) {
    try { overlayWin.setAlwaysOnTop(overlayAlwaysOnTop, 'screen-saver'); } catch { overlayWin.setAlwaysOnTop(overlayAlwaysOnTop); }
  }
  return { alwaysOnTop: overlayAlwaysOnTop };
});

ipcMain.handle('overlay:getState', async () => {
  return {
    open: !!overlayWin && !overlayWin.isDestroyed(),
    locked: overlayLocked,
    alwaysOnTop: overlayAlwaysOnTop,
  };
});

ipcMain.handle('overlay:getBounds', (e) => {
  if (!overlayWin || overlayWin.isDestroyed()) return null;
  if (overlayWcId != null && e.sender.id !== overlayWcId) return null;
  try {
    return overlayWin.getBounds();
  } catch {
    return null;
  }
});

ipcMain.handle(
  'overlay:setBounds',
  (e, payload: { x: number; y: number; width: number; height: number; kind: 'move' | 'resize'; edge?: string; base?: Electron.Rectangle }) => {
    if (!overlayWin || overlayWin.isDestroyed()) return { success: false };
    if (overlayWcId != null && e.sender.id !== overlayWcId) return { success: false };
    try {
      const current = overlayWin.getBounds();
      if (payload.kind === 'move') {
        // ✅ 멀티모니터 이동 허용: 전체 디스플레이 workArea 외곽 기준으로 "미아 방지"만 최소 클램프
        const displays = screen.getAllDisplays();
        const minX = Math.min(...displays.map((d) => d.workArea.x));
        const minY = Math.min(...displays.map((d) => d.workArea.y));
        const maxX = Math.max(...displays.map((d) => d.workArea.x + d.workArea.width));
        const maxY = Math.max(...displays.map((d) => d.workArea.y + d.workArea.height));
        const margin = 80;
        const x = clamp(Math.round(payload.x), minX - current.width + margin, maxX - margin);
        const y = clamp(Math.round(payload.y), minY, maxY - margin);
        overlayWin.setBounds({ x, y, width: current.width, height: current.height }, false);
        return { success: true };
      }

      // resize: ratio 고정 + workArea clamp
      const base = payload.base || current;
      const proposed: Electron.Rectangle = {
        x: base.x,
        y: base.y,
        width: Math.round(payload.width),
        height: Math.round(payload.height),
      };
      const next = normalizeOverlayBounds({ lastBounds: base, proposed, edge: payload.edge });
      overlayWin.setBounds(next, false);
      return { success: true };
    } catch {
      return { success: false };
    }
  }
);

// Backward compatible aliases (old note APIs)
ipcMain.handle('window:openNoteMode', async () => {
  // legacy note == overlay
  if (overlayWin && overlayWin.isDestroyed()) overlayWin = null;
  if (!overlayWin) {
    overlayLocked = false;
    overlayGen += 1;
    const localGen = overlayGen;
    overlayWin = await createWindow('overlay', { overlayGen: localGen });
    // ✅ Force center immediately after creation
    centerOverlayWindow(overlayWin);
    console.log('[window] openNoteMode(alias): created and centered');
    return { created: true };
  }
  centerOverlayWindow(overlayWin);
  overlayWin.show();
  overlayWin.focus();
  // ✅ Double-check after show
  setTimeout(() => {
    try {
      if (overlayWin && !overlayWin.isDestroyed()) {
        centerOverlayWindow(overlayWin);
      }
    } catch {}
  }, 100);
  console.log('[window] openNoteMode(alias): show/focus');
  return { created: false };
});

ipcMain.handle('window:closeNoteMode', async () => {
  // legacy note == overlay
  if (overlayWin && overlayWin.isDestroyed()) {
    overlayWin = null;
    return { success: true };
  }
  if (overlayWin) {
    overlayWin.hide();
    console.log('[window] closeNoteMode(alias): hide');
  }
  return { success: true };
});
ipcMain.handle('window:setClickThrough', async (_e, enabled: boolean) => {
  // legacy: click-through == locked
  overlayLocked = !!enabled;
  overlayWin?.setIgnoreMouseEvents(overlayLocked, { forward: true });
  console.log('[window] overlay lock ->', overlayLocked);
  return { success: true };
});

// 투명 영역 클릭 관통 (다이어리 영역은 클릭 가능)
// 개발 모드에서는 비활성화 (개발자 도구 사용을 위해)
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !isDev) {
    win.setIgnoreMouseEvents(ignore, options);
  }
});

ipcMain.handle('window:focusAppMode', async () => {
  if (appWin && !appWin.isDestroyed()) {
    appWin.show();
    appWin.focus();
    console.log('[window] focusAppMode');
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('window:getMode', (e) => {
  const id = e.sender.id;
  const mode = modeByWebContentsId.get(id) || 'app';
  return mode;
});

// renderer 생존 핸드셰이크: overlay를 보이게 만드는 유일한 경로
ipcMain.on('overlay:rendererAlive', (e) => {
  const senderId = e.sender.id;
  const currentId = overlayWin?.webContents?.id;
  console.log('[overlay] rendererAlive', { senderId, currentId, pid: process.pid });
  const win = overlayWin;
  const localGen = overlayGen;
  if (!win || win.isDestroyed()) return;
  if (overlayWcId != null && senderId !== overlayWcId) return;
  if (!isCurrentOverlayWin(win, localGen)) return;

  // 1단계: alive 수신은 “표시”와 분리. 여기서는 상태/로그만.
  overlayRendererAliveSeen = true;
  overlayAwaitingRendererAlive = false;
  // ✅ 긴급 수정: opacity 제거로 인해 타임아웃 로직 불필요
  clearOverlayUiReadyTimer();
  overlayUiReadyTimer = setTimeout(() => {
    if (localGen !== overlayGen) return;
    if (!isCurrentOverlayWin(win, localGen)) return;
    if (win.isDestroyed()) return;
    if (overlayUiReady) return;
    console.log('[overlay] uiReady timeout - window already visible', { pid: process.pid, overlayGen: localGen });
  }, 5000);
});

// 2단계: UI 준비됨(React 커밋 이후) → 이때만 opacity=1
ipcMain.on('overlay:uiReady', (e) => {
  const senderId = e.sender.id;
  const win = overlayWin;
  const localGen = overlayGen;
  console.log('[overlay] uiReady', { senderId, expected: overlayWcId, pid: process.pid });
  if (!win || win.isDestroyed()) return;
  if (overlayWcId != null && senderId !== overlayWcId) return;
  if (!isCurrentOverlayWin(win, localGen)) return;

  overlayUiReady = true;
  clearOverlayUiReadyTimer();

  // ✅ 긴급 수정: opacity 이미 1이므로 불필요
  // try { win.setOpacity(1); } catch { /* ignore */ }
  console.log('[overlay] uiReady confirmed - window already visible');
});

// --- 다이얼로그 ---

ipcMain.handle('dialog:showSave', async (_event, options) => {
  if (!appWin) return { canceled: true };

  const result = await dialog.showSaveDialog(appWin, {
    defaultPath: options?.defaultPath || path.join(getDiaryDir(), `export-${Date.now()}.json`),
    filters: options?.filters || [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
  });

  return result;
});

ipcMain.handle('dialog:showOpen', async (_event, options) => {
  if (!appWin) return { canceled: true };

  const result = await dialog.showOpenDialog(appWin, {
    filters: options?.filters || [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: options?.properties || ['openFile'],
  });

  return result;
});

// --- 파일 시스템 (Phase 3) ---

ipcMain.handle('fs:writeFile', async (_event, filePath: string, data: string | Buffer) => {
  try {
    // Atomic write: 임시 파일 → rename
    const tmpPath = filePath + '.tmp';
    await fs.writeFile(tmpPath, data, 'utf-8');
    await fs.rename(tmpPath, filePath);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to write file:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return { success: true, data };
  } catch (error) {
    console.error('Failed to read file:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('fs:exists', async (_event, filePath: string) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs:listDirectory', async (_event, dirPath: string) => {
  try {
    // 디렉토리 존재 확인
    const exists = await fs.access(dirPath).then(() => true).catch(() => false);
    if (!exists) {
      // 디렉토리가 없으면 생성
      await fs.mkdir(dirPath, { recursive: true });
      return [];
    }

    // 디렉토리 내용 읽기
    const files = await fs.readdir(dirPath);
    return files;
  } catch (error) {
    console.error('Failed to list directory:', error);
    return [];
  }
});

// --- 내보내기 (Phase 4) ---

// PNG export removed - not needed for MVP
// ipcMain.handle('export:png', async () => { ... });

ipcMain.handle('export:pdf', async () => {
  // overlayWin 사용 (사용자가 실제로 보는 다이어리 편집 화면)
  if (!overlayWin || overlayWin.isDestroyed()) {
    return { success: false, error: 'No overlay window available' };
  }

  try {
    // 1. 현재 윈도우 크기 저장
    const originalBounds = overlayWin.getBounds();
    console.log('[PDF Export] Original bounds:', originalBounds);
    
    // 2. 저장 다이얼로그
    const { filePath, canceled } = await dialog.showSaveDialog(overlayWin, {
      defaultPath: path.join(getDiaryDir(), `diary-${Date.now()}.pdf`),
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // 3. 윈도우 크기를 노트 크기(1100×820)로 변경
    overlayWin.setContentSize(1100, 820);
    console.log('[PDF Export] Resized to 1100x820');
    
    // 4. 렌더링 대기 (크기 변경 반영)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 5. PDF 생성 - 1100px × 820px 노트 영역만 내보내기
    // 픽셀을 마이크론(microns)으로 변환 (1px ≈ 264.583 microns at 96 DPI)
    const pdfData = await overlayWin.webContents.printToPDF({
      pageSize: {
        width: 1100 * 264.583, // 1100px in microns
        height: 820 * 264.583,  // 820px in microns
      },
      landscape: false,
      printBackground: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    // 6. 원래 크기로 복원
    overlayWin.setBounds(originalBounds);
    console.log('[PDF Export] Restored original size');

    // 7. 파일 저장
    await fs.writeFile(filePath, pdfData);

    return { success: true, filePath };
  } catch (error) {
    console.error('PDF export failed:', error);
    return { success: false, error: String(error) };
  }
});

// ═══════════════════════════════════════════════════════
// 📚 다이어리 관리자 (Multi-Diary Support)
// ═══════════════════════════════════════════════════════

ipcMain.handle('diary:list', async () => {
  // 단일 다이어리 모드: 항상 하나의 다이어리만 반환
  try {
    const diaryPath = path.join(getDiaryDir(), 'diary.json');
    const exists = await fs.access(diaryPath).then(() => true).catch(() => false);
    
    if (!exists) {
      return { success: true, diaries: [] };
    }

    // 단일 다이어리 정보 반환
    const singleDiary = {
      id: 'default',
      name: '나의 다이어리',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      color: '#ffc9d4',
      coverPattern: 'solid',
    };
    
    return { success: true, diaries: [singleDiary] };
  } catch (error) {
    console.error('diary:list failed:', error);
    return { success: false, error: String(error), diaries: [] };
  }
});

ipcMain.handle('diary:create', async (_event, name: string, color: string, coverPattern?: string) => {
  // 단일 다이어리 모드: 생성 불가 (이미 하나만 존재)
  console.log('[diary:create] Ignored - single diary mode');
  return { success: false, error: 'Single diary mode - creation not allowed' };
});

ipcMain.handle('diary:delete', async (_event, diaryId: string) => {
  // 단일 다이어리 모드: 삭제 불가
  console.log('[diary:delete] Ignored - single diary mode');
  return { success: false, error: 'Single diary mode - deletion not allowed' };
});

// 백업 기능
ipcMain.handle('diary:backup', async () => {
  if (!appWin) return { success: false, error: 'No window' };

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const { filePath, canceled } = await dialog.showSaveDialog(appWin, {
      defaultPath: path.join(app.getPath('documents'), `Dingle_Backup_${timestamp}.json`),
      filters: [{ name: 'JSON File', extensions: ['json'] }],
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // 모든 다이어리 데이터 수집
    const diaryDir = getDiaryDir();
    const metadataPath = path.join(diaryDir, 'metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    const backupData: any = {
      metadata,
      diaries: {},
      exportedAt: new Date().toISOString(),
    };

    // 각 다이어리 파일 읽기
    for (const diary of metadata.diaries || []) {
      const diaryPath = path.join(diaryDir, `diary-${diary.id}.json`);
      try {
        const diaryData = await fs.readFile(diaryPath, 'utf-8');
        backupData.diaries[diary.id] = JSON.parse(diaryData);
      } catch (err) {
        console.warn(`Diary ${diary.id} not found, skipping`);
      }
    }

    await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

    return { success: true, filePath };
  } catch (error) {
    console.error('Backup failed:', error);
    return { success: false, error: String(error) };
  }
});

// 복원 기능
ipcMain.handle('diary:restore', async () => {
  if (!appWin) return { success: false, error: 'No window' };

  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(appWin, {
      properties: ['openFile'],
      filters: [{ name: 'JSON File', extensions: ['json'] }],
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const backupData = JSON.parse(await fs.readFile(filePaths[0], 'utf-8'));

    if (!backupData.metadata || !backupData.diaries) {
      return { success: false, error: '유효하지 않은 백업 파일입니다.' };
    }

    const diaryDir = getDiaryDir();
    await fs.mkdir(diaryDir, { recursive: true });

    // 메타데이터 로드 또는 생성
    const metadataPath = path.join(diaryDir, 'metadata.json');
    let currentMetadata: any = { diaries: [] };
    try {
      currentMetadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    } catch {
      // 메타데이터가 없으면 새로 생성
    }

    // 백업된 다이어리들 복원
    let restoredCount = 0;
    for (const [diaryId, diaryData] of Object.entries(backupData.diaries)) {
      const diaryPath = path.join(diaryDir, `diary-${diaryId}.json`);
      await fs.writeFile(diaryPath, JSON.stringify(diaryData, null, 2), 'utf-8');
      restoredCount++;
    }

    // 메타데이터 병합 (중복 제거)
    const existingIds = new Set(currentMetadata.diaries.map((d: any) => d.id));
    for (const diary of backupData.metadata.diaries || []) {
      if (!existingIds.has(diary.id)) {
        currentMetadata.diaries.push(diary);
      }
    }

    await fs.writeFile(metadataPath, JSON.stringify(currentMetadata, null, 2), 'utf-8');

    return { success: true, restoredCount };
  } catch (error) {
    console.error('Restore failed:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('diary:load', async (_event, diaryId?: string) => {
  try {
    // 단일 다이어리 모드: 항상 diary.json 사용
    const diaryPath = path.join(getDiaryDir(), 'diary.json');
    const data = await fs.readFile(diaryPath, 'utf-8');
    const diaryData = JSON.parse(data);
    
    console.log('[diary] Loaded: diary.json, Items:', diaryData.items?.length || 0);
    return { success: true, data: diaryData };
  } catch (error) {
    console.error('diary:load failed:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('diary:save', async (_event, diaryIdOrData: string | any, dataOrUndefined?: any) => {
  try {
    // 단일 다이어리 모드: 항상 diary.json 사용
    // 호환성을 위해 (diaryId, data) 또는 (data) 둘 다 지원
    const data = dataOrUndefined !== undefined ? dataOrUndefined : diaryIdOrData;
    const diaryPath = path.join(getDiaryDir(), 'diary.json');
    await fs.writeFile(diaryPath, JSON.stringify(data, null, 2), 'utf-8');

    console.log('[diary] Saved: diary.json, Items:', data.items?.length || 0);
    return { success: true };
  } catch (error) {
    console.error('diary:save failed:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('diary:openInOverlay', async (_event, diaryId?: string) => {
  // 단일 다이어리 모드: 이미 시작 시 overlay가 열려있으므로 no-op
  console.log('[IPC] diary:openInOverlay - single diary mode, already open');
  
  if (overlayWin && !overlayWin.isDestroyed()) {
    // 이미 열려있으면 포커스만
    try {
      centerOverlayWindow(overlayWin);
      overlayWin.show();
      overlayWin.focus();
    } catch (e) {
      console.error('[IPC] Failed to focus overlay:', e);
    }
    return { success: true, mode: 'mini' };
  }
  
  return { success: false, error: 'Overlay not available' };
});

ipcMain.handle('diary:getCurrentId', async () => {
  return { success: true, diaryId: currentDiaryId };
});

// ═══════════════════════════════════════════════════════
// 정적 HTML 내보내기
// ═══════════════════════════════════════════════════════

// --- 폰트 업로드 ---
ipcMain.handle('font:upload', async () => {
  if (!appWin) return { success: false, error: 'No window' };
  
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(appWin, {
      filters: [{ name: 'Fonts', extensions: ['ttf', 'otf', 'woff', 'woff2'] }],
      properties: ['openFile']
    });
    
    if (canceled || !filePaths[0]) {
      return { success: false, canceled: true };
    }
    
    const fontPath = filePaths[0];
    const fontName = path.basename(fontPath);
    const fontDir = path.join(app.getPath('userData'), 'fonts');
    
    // 폰트 디렉토리 생성
    if (!existsSync(fontDir)) {
      mkdirSync(fontDir, { recursive: true });
    }
    
    // 폰트 파일 복사
    const destPath = path.join(fontDir, fontName);
    await fs.copyFile(fontPath, destPath);
    
    return { 
      success: true, 
      fontPath: destPath,
      fontName: fontName.replace(/\.[^/.]+$/, '') // 확장자 제거
    };
  } catch (error) {
    console.error('Font upload failed:', error);
    return { success: false, error: String(error) };
  }
});

// --- 스티커 업로드 ---
ipcMain.handle('sticker:upload', async () => {
  if (!overlayWin) return { success: false, error: 'No window' };
  
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(overlayWin, {
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] }],
      properties: ['openFile']
    });
    
    if (canceled || !filePaths[0]) {
      return { success: false, canceled: true };
    }
    
    const stickerPath = filePaths[0];
    const stickerName = path.basename(stickerPath);
    const stickerDir = path.join(app.getPath('userData'), 'stickers');
    
    if (!fsSync.existsSync(stickerDir)) {
      fsSync.mkdirSync(stickerDir, { recursive: true });
    }
    
    const destPath = path.join(stickerDir, `${Date.now()}-${stickerName}`);
    fsSync.copyFileSync(stickerPath, destPath);
    
    // 썸네일 생성 (data URL)
    const imageData = fsSync.readFileSync(destPath);
    const base64 = imageData.toString('base64');
    const ext = path.extname(stickerPath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' 
      : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' 
      : ext === '.gif' ? 'image/gif'
      : ext === '.webp' ? 'image/webp'
      : ext === '.svg' ? 'image/svg+xml'
      : 'image/png';
    const thumbnail = `data:${mimeType};base64,${base64}`;
    
    return { 
      success: true, 
      sticker: {
        id: Date.now().toString(),
        name: stickerName,
        filePath: destPath,
        thumbnail,
        createdAt: Date.now()
      }
    };
  } catch (error) {
    console.error('[IPC] ❌ sticker:upload failed:', error);
    return { success: false, error: String(error) };
  }
});

// --- 스티커 삭제 ---
ipcMain.handle('sticker:delete', async (_event, filePath: string) => {
  try {
    if (fsSync.existsSync(filePath)) {
      fsSync.unlinkSync(filePath);
    }
    return { success: true };
  } catch (error) {
    console.error('[IPC] ❌ sticker:delete failed:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('diary:exportToStaticHTML', async (_event, diaryIdOrOptions?: string | any, optionsOrUndefined?: any) => {
  try {
    // 단일 다이어리 모드: diaryId 무시, 항상 diary.json 사용
    const options = optionsOrUndefined !== undefined ? optionsOrUndefined : (typeof diaryIdOrOptions === 'object' ? diaryIdOrOptions : {});
    console.log('[diary:exportToStaticHTML] Starting export...', { options });

    // 1. 다이어리 데이터 로드
    const diaryPath = path.join(getDiaryDir(), 'diary.json');
    const data = await fs.readFile(diaryPath, 'utf-8');
    const diaryData = JSON.parse(data);
    const items = diaryData.items || [];

    console.log('[diary:exportToStaticHTML] Loaded diary data, items:', items.length);

    // 2. 날짜별로 아이템 그룹화
    const dateGroups: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const dateKey = item.diaryDate || '2024-01-01';
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(item);
    });

    const dates = Object.keys(dateGroups).sort();
    console.log('[diary:exportToStaticHTML] Dates found:', dates.length);

    // 3. 숨겨진 BrowserWindow 생성
    const isDev = !app.isPackaged;
    const indexPath = isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../../dist/index.html')}`;
    
    console.log('[diary:exportToStaticHTML] isDev:', isDev, 'indexPath:', indexPath);

    const hiddenWin = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      }
    });

    console.log('[diary:exportToStaticHTML] Hidden window created');

    // 4. 각 페이지의 HTML 추출
    const pages: any[] = [];

    // 4a. 월간 뷰 추출 (선택)
    if (options.includeMonthlyCover && dates.length > 0) {
      try {
        // 진행도 알림
        if (appWin) appWin.webContents.send('export:progress', { current: 0, total: dates.length + 1, status: '월간 뷰 추출 중...' });
        
        const firstDate = dates[0];
        const [year, month] = firstDate.split('-');
        const monthDate = `${year}-${month}-01`;
        
        const monthlyURL = isDev
          ? `${indexPath}?windowMode=overlay&date=${monthDate}&layout=monthly`
          : `${indexPath}?windowMode=overlay&date=${monthDate}&layout=monthly`;

        console.log('[diary:exportToStaticHTML] Loading monthly view:', monthlyURL);
        await hiddenWin.loadURL(monthlyURL);
        await new Promise(resolve => setTimeout(resolve, 2500)); // 대기 시간 증가

        const monthlyData = await hiddenWin.webContents.executeJavaScript(`
          (function() {
            const root = document.getElementById('root');
            if (!root) return { html: '', styles: '', cssVars: {}, debug: { error: 'No root' } };
            
            const styles = Array.from(document.querySelectorAll('style')).map(s => s.innerHTML).join('\\n');
            
            const computedStyle = getComputedStyle(document.documentElement);
            const cssVars = {};
            Array.from(computedStyle).filter(prop => prop.startsWith('--')).forEach(prop => {
              cssVars[prop] = computedStyle.getPropertyValue(prop);
            });
            
            // root의 outerHTML을 그대로 사용
            return {
              html: root.outerHTML,
              styles: styles,
              cssVars: cssVars,
              debug: {
                htmlLength: root.outerHTML.length,
                firstChild: root.firstElementChild?.tagName || 'none'
              }
            };
          })()
        `);

        console.log('[diary:exportToStaticHTML] Monthly view debug:', monthlyData.debug);

        pages.push({
          type: 'monthly',
          html: monthlyData.html,
          styles: monthlyData.styles,
          cssVars: monthlyData.cssVars,
          dates: dates
        });

        console.log('[diary:exportToStaticHTML] Monthly view extracted');
      } catch (error) {
        console.error('[diary:exportToStaticHTML] Failed to extract monthly view:', error);
      }
    }

    // 4b. 각 날짜의 스크랩북 페이지 추출
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      try {
        // 진행도 알림
        if (appWin) appWin.webContents.send('export:progress', { 
          current: i + 1, 
          total: dates.length + 1, 
          status: `스크랩북 추출 중... (${i + 1}/${dates.length})` 
        });
        
        const scrapURL = isDev
          ? `${indexPath}?windowMode=overlay&date=${date}`
          : `${indexPath}?windowMode=overlay&date=${date}`;

        console.log('[diary:exportToStaticHTML] Loading scrapbook for date:', date);
        await hiddenWin.loadURL(scrapURL);
        await new Promise(resolve => setTimeout(resolve, 2500)); // 대기 시간 증가

        const pageData = await hiddenWin.webContents.executeJavaScript(`
          (function() {
            const root = document.getElementById('root');
            if (!root) {
              return { html: '', styles: '', cssVars: {}, debug: { error: 'No root element' } };
            }
            
            const styles = Array.from(document.querySelectorAll('style')).map(s => s.innerHTML).join('\\n');
            
            const computedStyle = getComputedStyle(document.documentElement);
            const cssVars = {};
            Array.from(computedStyle).filter(prop => prop.startsWith('--')).forEach(prop => {
              cssVars[prop] = computedStyle.getPropertyValue(prop);
            });
            
            // 임베드 요소 확인
            const iframes = root.querySelectorAll('iframe').length;
            const embeds = root.querySelectorAll('[data-platform]').length;
            const images = root.querySelectorAll('img').length;
            const scrapItems = root.querySelectorAll('[data-scrap-id]').length;
            
            // root의 innerHTML을 그대로 사용 (wrapper 제거)
            const htmlContent = root.outerHTML;
            
            return {
              html: htmlContent,
              styles: styles,
              cssVars: cssVars,
              debug: {
                iframes,
                embeds,
                images,
                scrapItems,
                htmlLength: htmlContent.length,
                firstChild: root.firstElementChild?.tagName || 'none'
              }
            };
          })()
        `);

        console.log(`[diary:exportToStaticHTML] Debug info for ${date}:`, pageData.debug);

        console.log(`[diary:exportToStaticHTML] Extracted page data for ${date} - HTML: ${pageData.html.length} chars, Styles: ${pageData.styles.length} chars`);

        pages.push({
          type: 'scrapbook',
          date: date,
          html: pageData.html,
          styles: pageData.styles,
          cssVars: pageData.cssVars
        });

        console.log('[diary:exportToStaticHTML] Extracted page for:', date);
      } catch (error) {
        console.error('[diary:exportToStaticHTML] Failed to extract page for', date, error);
      }
    }

    // 5. 로컬 이미지를 Base64로 변환
    for (const page of pages) {
      page.html = await convertImagesToBase64HTML(page.html);
    }

    // 6. 단일 HTML 파일로 조합
    const { combinePages } = await import('./services/staticHTMLTemplate.js');
    const finalHTML = combinePages(pages, diaryData.stylePref, options.includeEmbeds !== false);

    // 7. 창 정리
    hiddenWin.close();

    console.log('[diary:exportToStaticHTML] ✅ Export completed, HTML size:', finalHTML.length);
    return { success: true, html: finalHTML };

  } catch (error) {
    console.error('[diary:exportToStaticHTML] ❌ Failed:', error);
    return { success: false, error: String(error) };
  }
});

async function convertImagesToBase64HTML(html: string): Promise<string> {
  const imgRegex = /<img[^>]+src=["']file:\/\/([^"']+)["']/g;
  let result = html;
  const matches = Array.from(html.matchAll(imgRegex));

  for (const match of matches) {
    try {
      const filePath = decodeURIComponent(match[1]);
      const base64 = await fs.readFile(filePath, { encoding: 'base64' });
      const ext = path.extname(filePath).slice(1) || 'png';
      const dataUrl = `data:image/${ext};base64,${base64}`;
      result = result.replace(match[0], match[0].replace(match[1], dataUrl).replace('file://', ''));
    } catch (error) {
      console.warn('[convertImagesToBase64HTML] Failed to convert image:', match[1], error);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════
// 🔧 개발 도구
// ═══════════════════════════════════════════════════════

// 개발 모드: F12로 DevTools 토글
app.on('browser-window-created', (_, window) => {
  window.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      window.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
});

// ═══════════════════════════════════════════════════════
// 윈도우 컨트롤 (최소화/닫기)
// ═══════════════════════════════════════════════════════

ipcMain.handle('window:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    // 트레이로 숨김 (minimize 대신 hide)
    win.hide();
    console.log('[window] Hidden to tray');
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
    return { success: true };
  }
  return { success: false };
});

// ✅ 수동 드래그 구현 (Windows frameless 대응)
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

ipcMain.on('window:dragStart', (event, mouseX: number, mouseY: number) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    const [winX, winY] = win.getPosition();
    dragOffset = {
      x: mouseX - winX,
      y: mouseY - winY,
    };
    isDragging = true;
  }
});

ipcMain.on('window:dragMove', (event, mouseX: number, mouseY: number) => {
  if (!isDragging) return;
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    const newX = mouseX - dragOffset.x;
    const newY = mouseY - dragOffset.y;
    win.setPosition(newX, newY, false);
  }
});

ipcMain.on('window:dragEnd', () => {
  isDragging = false;
});

// ═══════════════════════════════════════════════════════
// 파일 저장 다이얼로그
// ═══════════════════════════════════════════════════════

ipcMain.handle('saveDialog', async (_event, options: {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}) => {
  try {
    const result = await dialog.showSaveDialog({
      title: options.title || 'Save File',
      defaultPath: options.defaultPath,
      filters: options.filters || [],
    });
    return result;
  } catch (error) {
    console.error('saveDialog failed:', error);
    return { canceled: true, filePath: undefined };
  }
});

// ═══════════════════════════════════════════════════════
// 파일 쓰기
// ═══════════════════════════════════════════════════════

ipcMain.handle('writeFile', async (_event, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('writeFile failed:', error);
    return { success: false, error: String(error) };
  }
});


