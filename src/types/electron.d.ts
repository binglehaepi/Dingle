/**
 * Electron API TypeScript 타입 정의
 * 
 * window.electron에서 사용 가능한 API
 */

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

  // 내보내기
  // exportPNG removed for MVP
  // exportPNG: () => Promise<{
  //   success: boolean;
  //   filePath?: string;
  //   canceled?: boolean;
  //   error?: string;
  // }>;

  exportPDF: () => Promise<{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }>;

  // 외부 링크
  openExternal?: (url: string) => Promise<{ success: boolean; error?: string }>;

  // Window Mode (legacy)
  openNoteMode: () => Promise<{ created: boolean }>;
  closeNoteMode: () => Promise<{ success: boolean }>;
  setClickThrough: (enabled: boolean) => Promise<{ success: boolean }>;
  focusAppMode: () => Promise<{ success: boolean }>;
  getWindowMode: () => Promise<'app' | 'overlay'>;
  setDisplayMode: (mode: 'background' | 'mini') => Promise<{ mode: 'background' | 'mini' }>;

  // Desktop Overlay Mode
  openOverlayMode: () => Promise<{ created: boolean }>;
  closeOverlayMode: () => Promise<{ success: boolean }>;
  setOverlayLocked: (locked: boolean) => Promise<{ locked: boolean }>;
  setOverlayAlwaysOnTop: (on: boolean) => Promise<{ alwaysOnTop: boolean }>;
  getOverlayState: () => Promise<{ open: boolean; locked: boolean; alwaysOnTop: boolean }>;
  overlayRendererAlive: () => void;
  sendOverlayUiReady: () => void;
  getOverlayBounds: () => Promise<{ x: number; y: number; width: number; height: number } | null>;
  setOverlayBounds: (payload: { x: number; y: number; width: number; height: number; kind: 'move' | 'resize'; edge?: string; base?: { x: number; y: number; width: number; height: number } }) => Promise<{ success: boolean }>;
  onOverlayBoundsChanged: (cb: (b: { x: number; y: number; width: number; height: number }) => void) => () => void;

  // Diary Manager
  diaryList: () => Promise<{
    success: boolean;
    diaries: Array<{
      id: string;
      name: string;
      created: string;
      modified: string;
      color: string;
      thumbnail?: string;
    }>;
    error?: string;
  }>;
  diaryCreate: (name: string, color: string, coverPattern?: string) => Promise<{
    success: boolean;
    diaryId?: string;
    error?: string;
  }>;
  diaryDelete: (diaryId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  diaryLoad: (diaryId: string) => Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>;
  diarySave: (diaryId: string, data: any) => Promise<{
    success: boolean;
    error?: string;
  }>;
  diaryOpenInOverlay: (diaryId: string) => Promise<{
    success: boolean;
    mode?: 'background' | 'mini';
    error?: string;
  }>;
  diaryGetCurrentId: () => Promise<{
    success: boolean;
    diaryId: string | null;
  }>;
  listDirectory: (dirPath: string) => Promise<string[]>;
  
  // Window Controls
  minimize: () => Promise<{ success: boolean }>;
  close: () => Promise<{ success: boolean }>;
  
  // Manual drag for frameless windows
  dragStart: (mouseX: number, mouseY: number) => void;
  dragMove: (mouseX: number, mouseY: number) => void;
  dragEnd: () => void;
  
  // File Operations for Export
  saveDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<{
    canceled: boolean;
    filePath?: string;
  }>;
  
  // HTML Export (Static)
  diaryExportToStaticHTML: (
    diaryId: string,
    options: {
      includeMonthlyCover?: boolean;
      includeEmbeds?: boolean;
    }
  ) => Promise<{
    success: boolean;
    html?: string;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};




