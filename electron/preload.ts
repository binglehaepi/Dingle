/**
 * Electron Preload 스크립트
 * 
 * 역할:
 * - Main 프로세스와 Renderer 프로세스 사이의 안전한 브릿지
 * - contextBridge로 제한된 API만 노출
 */

import { contextBridge, ipcRenderer } from 'electron';

// ═══════════════════════════════════════════════════════
// 🔒 안전한 API 노출
// ═══════════════════════════════════════════════════════

contextBridge.exposeInMainWorld('electron', {
  // --- 환경 감지 ---
  isElectron: true,
  
  // --- 앱 정보 ---
  getPaths: () => ipcRenderer.invoke('app:getPaths'),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // --- 다이얼로그 ---
  showSaveDialog: (options?: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => ipcRenderer.invoke('dialog:showSave', options),

  showOpenDialog: (options?: {
    filters?: { name: string; extensions: string[] }[];
    properties?: string[];
  }) => ipcRenderer.invoke('dialog:showOpen', options),

  // --- 파일 시스템 ---
  writeFile: (filePath: string, data: string | Buffer) => 
    ipcRenderer.invoke('fs:writeFile', filePath, data),

  readFile: (filePath: string) => 
    ipcRenderer.invoke('fs:readFile', filePath),

  exists: (filePath: string) => 
    ipcRenderer.invoke('fs:exists', filePath),

  listDirectory: (dirPath: string) =>
    ipcRenderer.invoke('fs:listDirectory', dirPath),

  // --- 내보내기 ---
  // exportPNG: () => ipcRenderer.invoke('export:png'), // Removed for MVP
  exportPDF: () => ipcRenderer.invoke('export:pdf'),
  
  // --- 폰트 ---
  fontUpload: () => ipcRenderer.invoke('font:upload'),

  // --- 스티커 ---
  stickerUpload: () => ipcRenderer.invoke('sticker:upload'),
  stickerDelete: (filePath: string) => ipcRenderer.invoke('sticker:delete', filePath),

  // --- OhaAsa Horoscope ---
  ohaasaHoroscope: (params: { date: string; sign: string }) => ipcRenderer.invoke('ohaasa:horoscope', params),

  // --- 외부 링크 열기 ---
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),

  // --- 다이어리 관리 ---
  diaryCreate: (name: string, color: string, coverPattern?: string) =>
    ipcRenderer.invoke('diary:create', name, color, coverPattern),
  diaryList: () => ipcRenderer.invoke('diary:list'),
  diaryDelete: (diaryId: string) => ipcRenderer.invoke('diary:delete', diaryId),
  diaryLoad: (diaryId: string) => ipcRenderer.invoke('diary:load', diaryId),
  diarySave: (diaryId: string, data: any) => ipcRenderer.invoke('diary:save', diaryId, data),
  diaryOpenInOverlay: (diaryId: string) => ipcRenderer.invoke('diary:openInOverlay', diaryId),
  diaryGetCurrentId: () => ipcRenderer.invoke('diary:getCurrentId'),
  diaryExportToStaticHTML: (diaryId: string, options: any) => ipcRenderer.invoke('diary:exportToStaticHTML', diaryId, options),

  // --- 윈도우 관리 ---
  windowSetDisplayMode: (mode: string) => ipcRenderer.invoke('window:setDisplayMode', mode),
  windowOpenOverlayMode: () => ipcRenderer.invoke('window:openOverlayMode'),
  windowCloseOverlayMode: () => ipcRenderer.invoke('window:closeOverlayMode'),
  windowOpenNoteMode: () => ipcRenderer.invoke('window:openNoteMode'),
  windowCloseNoteMode: () => ipcRenderer.invoke('window:closeNoteMode'),
  windowSetClickThrough: (enabled: boolean) => ipcRenderer.invoke('window:setClickThrough', enabled),
  windowFocusAppMode: () => ipcRenderer.invoke('window:focusAppMode'),
  getWindowMode: () => ipcRenderer.invoke('window:getMode'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  close: () => ipcRenderer.invoke('window:close'),

  // --- 오버레이 관리 ---
  overlayRendererAlive: () => ipcRenderer.send('overlay:rendererAlive'),
  sendOverlayUiReady: () => ipcRenderer.send('overlay:uiReady'),
  setOverlayLocked: (locked: boolean) => ipcRenderer.invoke('overlay:setLocked', locked),
  getOverlayState: () => ipcRenderer.invoke('overlay:getState'),
  overlaySetAlwaysOnTop: (on: boolean) => ipcRenderer.invoke('overlay:setAlwaysOnTop', on),
  overlayGetBounds: () => ipcRenderer.invoke('overlay:getBounds'),

  // --- dingel-media (No-Copy local media) ---
  registerMediaImportRoot: (params: { importId: string; importRoot: string }) =>
    ipcRenderer.invoke('dingelMedia:registerImportRoot', params),

  // --- 자동 업데이트 ---
  updateCheck: () => ipcRenderer.invoke('update:check'),
  updateDownload: () => ipcRenderer.invoke('update:download'),
  updateInstall: () => ipcRenderer.invoke('update:install'),
  
  // 업데이트 이벤트 리스너
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('update:checking', callback);
    return () => ipcRenderer.removeListener('update:checking', callback);
  },
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update:available', (_event, info) => callback(info));
    return () => ipcRenderer.removeListener('update:available', callback);
  },
  onUpdateNotAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update:not-available', (_event, info) => callback(info));
    return () => ipcRenderer.removeListener('update:not-available', callback);
  },
  onUpdateDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('update:download-progress', (_event, progress) => callback(progress));
    return () => ipcRenderer.removeListener('update:download-progress', callback);
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update:downloaded', (_event, info) => callback(info));
    return () => ipcRenderer.removeListener('update:downloaded', callback);
  },
  onUpdateError: (callback: (error: any) => void) => {
    ipcRenderer.on('update:error', (_event, error) => callback(error));
    return () => ipcRenderer.removeListener('update:error', callback);
  },
  
  // --- 이벤트 리스너 (범용) ---
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
  
  // --- IPC Send (창 드래그 등) ---
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },
  
  // --- 파일 대화상자 (추가) ---
  saveDialog: (options: any) => ipcRenderer.invoke('saveDialog', options),
  writeFile2: (filePath: string, content: string) => ipcRenderer.invoke('writeFile', filePath, content),
});
// ═══════════════════════════════════════════════════════
// 📝 TypeScript 타입 정의
// ═══════════════════════════════════════════════════════

export interface ElectronAPI {
  isElectron: boolean;
  
  // 앱 정보
  getPaths: () => Promise<{
    documents: string;
    userData: string;
    diaryDir: string;
  }>;
  
  getVersion: () => Promise<{
    app: string;
    electron: string;
    chrome: string;
    node: string;
  }>;

  // 다이얼로그
  showSaveDialog: (options?: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<{
    canceled: boolean;
    filePath?: string;
  }>;

  showOpenDialog: (options?: {
    filters?: { name: string; extensions: string[] }[];
    properties?: string[];
  }) => Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;

  // 파일 시스템
  writeFile: (filePath: string, data: string | Buffer) => Promise<{
    success: boolean;
    error?: string;
  }>;

  readFile: (filePath: string) => Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }>;

  exists: (filePath: string) => Promise<boolean>;

  listDirectory: (dirPath: string) => Promise<string[]>;

  // 내보내기
  exportPNG: () => Promise<{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }>;

  exportPDF: () => Promise<{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }>;
  
  // 폰트
  fontUpload: () => Promise<{
    success: boolean;
    fontPath?: string;
    fontName?: string;
    canceled?: boolean;
    error?: string;
  }>;

  // 스티커
  stickerUpload: () => Promise<{
    success: boolean;
    sticker?: {
      id: string;
      name: string;
      filePath: string;
      thumbnail?: string;
      createdAt: number;
    };
    canceled?: boolean;
    error?: string;
  }>;
  stickerDelete: (filePath: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // OhaAsa
  ohaasaHoroscope: (params: { date: string; sign: string }) => Promise<{
    date: string;
    sign: string;
    rank: number;
    textJa?: string;
    textKo?: string;
    sourceUrl: string;
  }>;

  // 외부 링크
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;

  // 다이어리 관리
  diaryCreate: (name: string, color: string, coverPattern?: string) => Promise<{
    success: boolean;
    diaryId?: string;
    error?: string;
  }>;
  diaryList: () => Promise<{ success: boolean; diaries?: any[]; error?: string }>;
  diaryDelete: (diaryId: string) => Promise<{ success: boolean; error?: string }>;
  diaryLoad: (diaryId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  diarySave: (diaryId: string, data: any) => Promise<{ success: boolean; error?: string }>;
  diaryOpenInOverlay: (diaryId: string) => Promise<{ success: boolean; error?: string }>;
  diaryGetCurrentId: () => Promise<{ success: boolean; diaryId: string | null }>;
  diaryExportToStaticHTML: (diaryId: string, options: any) => Promise<{ success: boolean; html?: string; error?: string }>;

  // 윈도우 관리
  windowSetDisplayMode: (mode: string) => Promise<void>;
  windowOpenOverlayMode: () => Promise<void>;
  windowCloseOverlayMode: () => Promise<void>;
  windowOpenNoteMode: () => Promise<void>;
  windowCloseNoteMode: () => Promise<void>;
  windowSetClickThrough: (enabled: boolean) => Promise<void>;
  windowFocusAppMode: () => Promise<void>;
  getWindowMode: () => Promise<string>;
  minimize: () => Promise<{ success: boolean }>;
  close: () => Promise<{ success: boolean }>;

  // 오버레이 관리
  overlayRendererAlive: () => void;
  sendOverlayUiReady: () => void;
  setOverlayLocked: (locked: boolean) => Promise<{ locked: boolean }>;
  getOverlayState: () => Promise<{ open: boolean; locked: boolean; alwaysOnTop: boolean }>;
  overlaySetAlwaysOnTop: (on: boolean) => Promise<{ alwaysOnTop: boolean }>;
  overlayGetBounds: () => Promise<{ x: number; y: number; width: number; height: number } | null>;

  // dingel-media
  registerMediaImportRoot: (params: { importId: string; importRoot: string }) => Promise<{ success: boolean; error?: string }>;

  // 자동 업데이트
  updateCheck: () => Promise<{ success: boolean; updateInfo?: any; message?: string; error?: string }>;
  updateDownload: () => Promise<{ success: boolean; message?: string; error?: string }>;
  updateInstall: () => Promise<{ success: boolean }>;
  
  onUpdateChecking: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (info: { version: string; releaseDate: string; releaseNotes?: string }) => void) => () => void;
  onUpdateNotAvailable: (callback: (info: { version: string }) => void) => () => void;
  onUpdateDownloadProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => () => void;
  onUpdateDownloaded: (callback: (info: { version: string; releaseNotes?: string }) => void) => () => void;
  onUpdateError: (callback: (error: { message: string }) => void) => () => void;
  
  // 범용 이벤트 리스너
  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  
  // 추가 파일 대화상자
  saveDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>;
  writeFile2: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}


