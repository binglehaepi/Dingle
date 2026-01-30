/**
 * Electron 메인 프로세스
 * 
 * 역할:
 * - 브라우저 윈도우 생성
 * - 파일 시스템 접근
 * - IPC 핸들러 등록
 * - 메뉴 바 설정
 */

import { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut, screen } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

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
let overlayAlwaysOnTop = true;

let overlayAliveTimer: NodeJS.Timeout | null = null;
let overlayAwaitingRendererAlive = false; // "보이게 하는 트리거" 상태만 의미 (destroy 기준 아님)
let overlayGen = 0;
let overlayWinId: number | null = null;
let overlayWcId: number | null = null;
let overlayUiReadyTimer: NodeJS.Timeout | null = null;
let overlayUiReady = false;
let overlayRendererAliveSeen = false;
let displayMode: DisplayMode = 'background';
let currentDiaryId: string | null = null; // 현재 overlay에서 열린 다이어리 ID

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
      console.log('[overlay] created', { winId: overlayWinId, wcId: overlayWcId, gen: overlayGen });
    } else {
      try { overlayWin.showInactive(); } catch { try { overlayWin.show(); overlayWin.blur(); } catch { /* ignore */ } }
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

// overlay 기본 시작 크기(항상 이 값으로 시작)
// L사이즈 기준 (1400x860)
const OVERLAY_DEFAULT_W = 1400;
const OVERLAY_DEFAULT_H = 860;
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

function applyOverlayContentAspect(win: BrowserWindow, reason: string) {
  try {
    if (!win || win.isDestroyed()) return;
    const [w, h] = win.getSize();
    const [cw, ch] = win.getContentSize();
    const extra = { width: Math.max(0, w - cw), height: Math.max(0, h - ch) };
    win.setAspectRatio(OVERLAY_ASPECT, extra);
    console.log('[overlay] setAspectRatio', { reason, aspect: OVERLAY_ASPECT, extra });
  } catch (e) {
    console.log('[overlay] setAspectRatio failed', { reason, error: String(e) });
  }
}

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

function yyyymmddToIso(d: string): string {
  if (!/^\d{8}$/.test(d)) return d;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

async function fetchOhaasaJson(): Promise<any> {
  const res = await fetch(OHAASA_JSON_URL, { headers: { 'User-Agent': 'DigitalScrapDiary/1.0' } as any });
  if (!res.ok) throw new Error(`OhaAsa json fetch failed: ${res.status}`);
  return await res.json();
}

async function getOhaasaHoroscope(params: { date: string; sign: OhaasaSignId }) {
  // date is for cache key only (official json has its own onair_date)
  const raw = await fetchOhaasaJson();
  const entry = Array.isArray(raw) ? raw[0] : raw;
  const onair = String(entry?.onair_date || '');
  if (!onair) throw new Error('OhaAsa json missing onair_date');

  // cache raw by day
  if (!ohaasaCacheByDay.has(onair)) ohaasaCacheByDay.set(onair, entry);

  const cacheKey = `${onair}:${params.sign}`;
  const cached = ohaasaResultCache.get(cacheKey);
  if (cached) return cached;

  const st = OHAASA_SIGN_TO_ST[params.sign];
  const detail: any[] = entry?.detail || entry?.detail?.[0]?.detail || entry?.detail || [];
  const list = Array.isArray(detail) ? detail : [];
  const hit = list.find((x) => String(x?.horoscope_st) === st);
  if (!hit) throw new Error(`OhaAsa sign not found: ${params.sign}`);

  const result = {
    date: yyyymmddToIso(onair),
    sign: params.sign,
    rank: Number(hit?.ranking_no),
    textJa: typeof hit?.horoscope_text === 'string' ? hit.horoscope_text : undefined,
    sourceUrl: OHAASA_SOURCE_URL,
  };
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
  };

  // preload 적용 여부를 로그로 확정(overlay에서 hasOverlayAlive=false 원인 분리)
  try {
    if (mode === 'overlay') console.log('[overlay] webPreferences.preload=', String(commonWebPreferences.preload));
  } catch {
    // ignore
  }

  if (mode === 'overlay') {
    return {
      width: OVERLAY_DEFAULT_W,
      height: OVERLAY_DEFAULT_H,
      minWidth: 800,
      minHeight: 600,
      resizable: true,
      // Windows frameless 리사이즈 보강
      thickFrame: true,
      maximizable: false,
      transparent: true,
      frame: false,
      backgroundColor: '#00000000',
      autoHideMenuBar: true,
      hasShadow: false,
      skipTaskbar: true,
      alwaysOnTop: overlayAlwaysOnTop,
      webPreferences: commonWebPreferences,
      show: false,
    };
  }

  // app 모드: 서재 스타일 (컴팩트 + frameless)
  return {
    width: 1200,
    height: 700, // ✅ 800 → 700 (세로 길이 감소)
    minWidth: 900,
    minHeight: 500, // ✅ 600 → 500 (최소 높이도 감소)
    resizable: true,
    webPreferences: commonWebPreferences,
    frame: false, // ✅ 타이틀바/메뉴바 완전 제거
    backgroundColor: '#f9f7f4', // 따뜻한 베이지
    show: false,
    autoHideMenuBar: true,
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

  if (mode === 'overlay') {
    // overlay는 생성 시점부터 “현재 overlay 인스턴스” 정보를 세팅 (레이스 가드용)
    if (localOverlayGen != null) {
      overlayWin = win;
      overlayWinId = win.id;
      overlayWcId = wcId;
    }
  }

  if (mode === 'overlay') {
    // ✅ 긴급 수정: opacity=0 제거하여 창이 즉시 보이도록 함
    // try { win.setOpacity(0); } catch { /* ignore */ }
    try { win.setBackgroundColor('#00000000'); } catch { /* ignore */ }
    // 기본 잠금 상태는 OFF(이동/조작 가능). click-through는 locked=true일 때만 적용.
    try { win.setIgnoreMouseEvents(false); } catch { /* ignore */ }
    try { win.setFocusable(true); } catch { /* ignore */ }
    // 리사이즈 보험(환경/버전에 따라 옵션이 무시되는 케이스 방지)
    try { win.setResizable(true); } catch { /* ignore */ }
    // ✅ 시작 크기 보험: 항상 동일한 시작 크기로 강제(리사이즈는 가능)
    try { win.setSize(OVERLAY_DEFAULT_W, OVERLAY_DEFAULT_H, false); } catch { /* ignore */ }
    // ✅ 컨텐츠 비율 고정(best-effort). 프레임이 확정되면 ready-to-show 이후 1tick에서 재적용한다.
    applyOverlayContentAspect(win, 'createWindow:init');

    // ✅ “절대적으로 유지” 보험: 상태 변화(스냅/최대화/전체화면) 시 extraSize 재계산 후 재적용
    const reapply = (r: string) => {
      if (localOverlayGen != null && !isCurrentOverlayWin(win, localOverlayGen)) return;
      if (win.isDestroyed()) return;
      try { setTimeout(() => applyOverlayContentAspect(win, r), 0); } catch { /* ignore */ }
    };
    win.on('maximize', () => reapply('maximize'));
    win.on('unmaximize', () => reapply('unmaximize'));
    win.on('enter-full-screen', () => reapply('enter-full-screen'));
    win.on('leave-full-screen', () => reapply('leave-full-screen'));

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
      try { win.webContents.openDevTools({ mode: 'detach' }); } catch { /* ignore */ }
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
      // ✅ 프레임/컨텐츠 사이즈 확정 후 extraSize 재계산해서 “컨텐츠 비율” 고정
      try { setTimeout(() => applyOverlayContentAspect(win, 'ready-to-show:tick'), 0); } catch { /* ignore */ }
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
      // skipTaskbar 보강(옵션이 무시되는 케이스 대비)
      try { win.setSkipTaskbar(true); } catch { /* ignore */ }
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

    // taskbar 최소 존재감(옵션+메서드 2중)
    try { win.setSkipTaskbar(true); } catch { /* ignore */ }

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
    const metadataPath = path.join(getDiaryDir(), 'metadata.json');
    
    // metadata가 이미 있으면 마이그레이션 불필요
    const metadataExists = await fs.access(metadataPath).then(() => true).catch(() => false);
    if (metadataExists) {
      console.log('[migration] Metadata already exists, skipping');
      return;
    }

    // current.json이 있는지 확인
    const oldExists = await fs.access(oldPath).then(() => true).catch(() => false);
    if (!oldExists) {
      console.log('[migration] No existing diary to migrate');
      return;
    }

    console.log('[migration] Migrating existing diary...');

    // 기존 파일을 diary-default.json으로 복사
    const defaultId = 'default';
    const newPath = path.join(getDiaryDir(), `diary-${defaultId}.json`);
    
    const oldData = await fs.readFile(oldPath, 'utf-8');
    await fs.writeFile(newPath, oldData, 'utf-8');

    // metadata 생성
    const metadata = {
      diaries: [{
        id: defaultId,
        name: '내 다이어리',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        color: '#ff6b6b',
      }]
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    console.log('[migration] ✅ Migration complete! Created diary-default.json');
    
    // current.json은 백업으로 이름 변경
    const backupPath = path.join(getDiaryDir(), 'current.json.backup');
    await fs.rename(oldPath, backupPath).catch(() => {});
    console.log('[migration] ✅ Backed up current.json');
  } catch (error) {
    console.error('[migration] ❌ Migration failed:', error);
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

  appWin = await createWindow('app');

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
    console.log('[window] openNoteMode(alias): created');
    return { created: true };
  }
  overlayWin.show();
  overlayWin.focus();
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

ipcMain.handle('export:png', async () => {
  if (!appWin) return { success: false, error: 'No window' };

  try {
    // 저장 다이얼로그
    const { filePath, canceled } = await dialog.showSaveDialog(appWin, {
      defaultPath: path.join(getDiaryDir(), `diary-${Date.now()}.png`),
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // 현재 페이지 캡처
    const image = await appWin.webContents.capturePage();
    await fs.writeFile(filePath, image.toPNG());

    return { success: true, filePath };
  } catch (error) {
    console.error('PNG export failed:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('export:pdf', async () => {
  if (!appWin) return { success: false, error: 'No window' };

  try {
    // 저장 다이얼로그
    const { filePath, canceled } = await dialog.showSaveDialog(appWin, {
      defaultPath: path.join(getDiaryDir(), `diary-${Date.now()}.pdf`),
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // PDF 생성
    const pdfData = await appWin.webContents.printToPDF({
      pageSize: 'A4',
      landscape: true,
      printBackground: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

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
  try {
    const metadataPath = path.join(getDiaryDir(), 'metadata.json');
    const exists = await fs.access(metadataPath).then(() => true).catch(() => false);
    
    if (!exists) {
      return { success: true, diaries: [] };
    }

    const data = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(data);
    return { success: true, diaries: metadata.diaries || [] };
  } catch (error) {
    console.error('diary:list failed:', error);
    return { success: false, error: String(error), diaries: [] };
  }
});

ipcMain.handle('diary:create', async (_event, name: string, color: string, coverPattern?: string) => {
  try {
    console.log('[diary:create] Starting...', { name, color, coverPattern });
    
    const timestamp = Date.now();
    const diaryId = `${timestamp}`;
    
    // 디렉토리 확인 및 생성
    const diaryDir = getDiaryDir();
    console.log('[diary:create] Diary directory:', diaryDir);
    
    try {
      await fs.access(diaryDir);
    } catch {
      console.log('[diary:create] Creating diary directory...');
      await fs.mkdir(diaryDir, { recursive: true });
    }
    
    // metadata 로드
    const metadataPath = path.join(diaryDir, 'metadata.json');
    console.log('[diary:create] Metadata path:', metadataPath);
    
    let metadata: any = { diaries: [] };
    
    const exists = await fs.access(metadataPath).then(() => true).catch(() => false);
    if (exists) {
      console.log('[diary:create] Loading existing metadata...');
      const data = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(data);
    } else {
      console.log('[diary:create] No existing metadata, will create new');
    }

    // 새 다이어리 추가
    const newDiary = {
      id: diaryId,
      name,
      color,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      coverPattern: coverPattern || 'solid',
      keyring: '🔑', // 기본 키링
    };
    metadata.diaries.push(newDiary);
    console.log('[diary:create] New diary added to metadata:', newDiary);

    // metadata 저장
    console.log('[diary:create] Saving metadata...');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    // 빈 다이어리 파일 생성
    const diaryPath = path.join(diaryDir, `diary-${diaryId}.json`);
    console.log('[diary:create] Creating diary file:', diaryPath);
    
    const emptyData = {
      version: '2.0.0',
      appVersion: '1.0.0',
      savedAt: timestamp,
      items: [],
      textData: {},
      stylePref: {
        coverColor: color,
        coverPattern: 'quilt',
        keyring: '🔑',
        backgroundImage: '',
      },
      linkDockItems: [],
    };
    await fs.writeFile(diaryPath, JSON.stringify(emptyData, null, 2), 'utf-8');

    console.log('[diary:create] ✅ Success! Created diary:', diaryId, name);
    return { success: true, diaryId };
  } catch (error) {
    console.error('[diary:create] ❌ Failed:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('diary:delete', async (_event, diaryId: string) => {
  try {
    // metadata 로드
    const metadataPath = path.join(getDiaryDir(), 'metadata.json');
    const data = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(data);

    // 다이어리 제거
    metadata.diaries = metadata.diaries.filter((d: any) => d.id !== diaryId);

    // metadata 저장
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    // 파일 삭제
    const diaryPath = path.join(getDiaryDir(), `diary-${diaryId}.json`);
    await fs.unlink(diaryPath).catch(() => {}); // 파일이 없어도 무시

    console.log('[diary] Deleted:', diaryId);
    return { success: true };
  } catch (error) {
    console.error('diary:delete failed:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('diary:load', async (_event, diaryId: string) => {
  try {
    const diaryPath = path.join(getDiaryDir(), `diary-${diaryId}.json`);
    const data = await fs.readFile(diaryPath, 'utf-8');
    const diaryData = JSON.parse(data);
    
    console.log('[diary] Loaded:', diaryId, 'Items:', diaryData.items?.length || 0);
    return { success: true, data: diaryData };
  } catch (error) {
    console.error('diary:load failed:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('diary:save', async (_event, diaryId: string, data: any) => {
  try {
    const diaryPath = path.join(getDiaryDir(), `diary-${diaryId}.json`);
    await fs.writeFile(diaryPath, JSON.stringify(data, null, 2), 'utf-8');

    // metadata의 modified 시간 업데이트
    const metadataPath = path.join(getDiaryDir(), 'metadata.json');
    const metadataExists = await fs.access(metadataPath).then(() => true).catch(() => false);
    
    if (metadataExists) {
      const metadataData = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataData);
      const diary = metadata.diaries.find((d: any) => d.id === diaryId);
      if (diary) {
        diary.modified = new Date().toISOString();
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
      }
    }

    console.log('[diary] Saved:', diaryId, 'Items:', data.items?.length || 0);
    return { success: true };
  } catch (error) {
    console.error('diary:save failed:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('diary:openInOverlay', async (_event, diaryId: string) => {
  console.log('[IPC] diary:openInOverlay called', { diaryId, currentMode: overlayWin ? 'has overlay' : 'no overlay' });
  
  try {
    currentDiaryId = diaryId;
    console.log('[IPC] Set currentDiaryId:', currentDiaryId);
    
    // mini 모드로 전환 (overlay 열기)
    console.log('[IPC] Calling setDisplayModeInternal("mini")...');
    const result = await setDisplayModeInternal('mini');
    console.log('[IPC] setDisplayModeInternal result:', { 
      mode: result.mode, 
      hasAppWin: !!(appWin && !appWin.isDestroyed()),
      hasOverlayWin: !!(overlayWin && !overlayWin.isDestroyed())
    });
    
    if (overlayWin) {
      try {
        console.log('[IPC] overlayWin state:', {
          id: overlayWin.id,
          isVisible: overlayWin.isVisible(),
          isDestroyed: overlayWin.isDestroyed(),
          isMinimized: overlayWin.isMinimized(),
          bounds: overlayWin.getBounds(),
          alwaysOnTop: overlayAlwaysOnTop
        });
      } catch (stateError) {
        console.error('[IPC] Failed to get overlayWin state:', stateError);
      }
    } else {
      console.error('[IPC] ❌ overlayWin is null after setDisplayModeInternal!');
    }
    
    console.log('[IPC] ✅ diary:openInOverlay completed successfully');
    return { success: true, mode: result.mode };
  } catch (error) {
    console.error('[IPC] ❌ diary:openInOverlay failed:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('diary:getCurrentId', async () => {
  return { success: true, diaryId: currentDiaryId };
});

// ═══════════════════════════════════════════════════════
// 정적 HTML 내보내기
// ═══════════════════════════════════════════════════════

ipcMain.handle('diary:exportToStaticHTML', async (_event, diaryId: string, options: {
  includeMonthlyCover?: boolean;
  includeEmbeds?: boolean;
}) => {
  try {
    console.log('[diary:exportToStaticHTML] Starting export...', { diaryId, options });

    // 1. 다이어리 데이터 로드
    const diaryPath = path.join(getDiaryDir(), `diary-${diaryId}.json`);
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
          ? `${indexPath}?windowMode=overlay&diaryId=${diaryId}&date=${monthDate}&layout=monthly`
          : `${indexPath}?windowMode=overlay&diaryId=${diaryId}&date=${monthDate}&layout=monthly`;

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
          ? `${indexPath}?windowMode=overlay&diaryId=${diaryId}&date=${date}`
          : `${indexPath}?windowMode=overlay&diaryId=${diaryId}&date=${date}`;

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
    win.minimize();
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


