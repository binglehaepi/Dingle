# 🖥️ Digital Scrap Diary - Electron 마이그레이션 계획

**작성일시**: 2025-12-18 13:05 KST  
**목표**: Vite + React 웹앱 → Electron 데스크톱 앱 전환  
**현재 상태**: 리팩토링 완료 (App.tsx 1024줄 → 227줄)

---

## 1️⃣ 저장 구조 전환 설계

### 📁 현재 구조 (localStorage)

```typescript
// 현재 키 구조
localStorage {
  "smart_scrap_diary_layout_v2": ScrapItem[],     // 4.5MB (이미지 포함)
  "smart_scrap_text_data": LayoutTextData,         // ~50KB
  "smart_scrap_style_pref": DiaryStyle,            // ~100KB
  "smart_scrap_layout_pref": LayoutType            // ~10B
}
```

**문제점**:
- ❌ 5MB 제한 (브라우저마다 다름)
- ❌ 백업 불가
- ❌ 버전 관리 없음
- ❌ 멀티 디바이스 동기화 불가
- ❌ 파일 탐색기에서 관리 불가

---

### 🎯 새로운 구조 (파일 기반)

#### Option A: `.sdiary` 파일 (✅ **추천**)

```
MyDiary_2025.sdiary  (실제로는 ZIP)
├─ manifest.json         # 메타데이터
├─ items.json            # ScrapItem[] (이미지 URL 제외)
├─ text.json             # LayoutTextData
├─ style.json            # DiaryStyle
└─ assets/
   ├─ images/
   │  ├─ abc123.jpg      # 압축된 이미지
   │  ├─ def456.png
   │  └─ ...
   └─ videos/
      └─ video1.mp4
```

**manifest.json**:
```json
{
  "version": "2.0.0",
  "created": "2025-12-18T13:05:00.000Z",
  "modified": "2025-12-18T15:30:00.000Z",
  "appVersion": "1.0.0",
  "itemCount": 145,
  "totalSize": 12500000,
  "checksum": "sha256:abc..."
}
```

**items.json** (이미지 URL → 로컬 경로):
```json
[
  {
    "id": "abc-123",
    "type": "general",
    "metadata": {
      "title": "Image",
      "imageUrl": "assets/images/abc123.jpg"  // ✅ 로컬 경로
    },
    "position": { "x": 350, "y": 410 }
  }
]
```

**장점**:
- ✅ 단일 파일 = 쉬운 백업/이동
- ✅ ZIP 압축 = 용량 절약
- ✅ 파일 탐색기에서 드래그 앤 드롭 가능
- ✅ 이메일/클라우드 공유 가능
- ✅ 버전 히스토리 구현 용이

**단점**:
- ⚠️ 저장 시 전체 ZIP 재생성 필요
- ⚠️ 대용량 파일 (100MB+) 시 느림

---

#### Option B: 폴더 기반 (❌ 추천 안 함)

```
MyDiary_2025/
├─ metadata.json
├─ items.json
├─ text.json
├─ style.json
└─ assets/
   └─ images/
```

**단점**:
- ❌ 여러 파일 = 관리 어려움
- ❌ 공유 시 폴더 압축 필요
- ❌ 파일 유실 위험

---

### 🔄 마이그레이션 전략

#### 1단계: localStorage → .sdiary 자동 변환

```typescript
// services/migration.ts
export async function migrateFromLocalStorage(): Promise<void> {
  // 1. localStorage 읽기
  const items = loadFromStorage(STORAGE_KEY);
  const textData = JSON.parse(localStorage.getItem(TEXT_DATA_KEY) || '{}');
  const style = JSON.parse(localStorage.getItem(STYLE_PREF_KEY) || '{}');

  // 2. Base64 이미지 → Blob 추출
  const assets: Map<string, Blob> = new Map();
  const cleanedItems = items.map(item => {
    if (item.metadata.imageUrl?.startsWith('data:')) {
      const assetId = crypto.randomUUID();
      const blob = dataURLtoBlob(item.metadata.imageUrl);
      assets.set(`images/${assetId}.${getExtension(blob.type)}`, blob);
      
      return {
        ...item,
        metadata: {
          ...item.metadata,
          imageUrl: `assets/images/${assetId}.${getExtension(blob.type)}`
        }
      };
    }
    return item;
  });

  // 3. ZIP 생성
  const zip = new JSZip();
  
  // Manifest
  zip.file('manifest.json', JSON.stringify({
    version: '2.0.0',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    appVersion: '1.0.0',
    itemCount: cleanedItems.length,
  }, null, 2));

  // Data
  zip.file('items.json', JSON.stringify(cleanedItems, null, 2));
  zip.file('text.json', JSON.stringify(textData, null, 2));
  zip.file('style.json', JSON.stringify(style, null, 2));

  // Assets
  for (const [path, blob] of assets) {
    zip.file(`assets/${path}`, blob);
  }

  // 4. 다운로드 (웹) 또는 저장 (Electron)
  const blob = await zip.generateAsync({ type: 'blob' });
  
  if (isElectron()) {
    // Electron: 파일 저장 다이얼로그
    const { filePath } = await window.electron.showSaveDialog({
      defaultPath: `MyDiary_${new Date().getFullYear()}.sdiary`,
      filters: [{ name: 'Scrap Diary', extensions: ['sdiary'] }]
    });
    if (filePath) {
      await window.electron.writeFile(filePath, await blob.arrayBuffer());
    }
  } else {
    // Web: 브라우저 다운로드
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MyDiary_${new Date().getFullYear()}.sdiary`;
    a.click();
  }
}
```

#### 2단계: 자동 저장 (Auto-save)

```typescript
// hooks/useFileSync.ts
export function useFileSync(items: ScrapItem[], textData: LayoutTextData, diaryStyle: DiaryStyle) {
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 변경 감지
  useEffect(() => {
    setIsDirty(true);
  }, [items, textData, diaryStyle]);

  // 자동 저장 (5초 디바운스)
  useEffect(() => {
    if (!isDirty || !currentFilePath) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveToFile(currentFilePath, { items, textData, diaryStyle });
        setIsDirty(false);
        console.log('✅ Auto-saved to', currentFilePath);
      } catch (err) {
        console.error('❌ Auto-save failed:', err);
      }
    }, 5000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, currentFilePath, items, textData, diaryStyle]);

  return {
    currentFilePath,
    setCurrentFilePath,
    isDirty,
    saveManually: () => saveToFile(currentFilePath!, { items, textData, diaryStyle })
  };
}
```

#### 3단계: 버전 히스토리

```typescript
// 자동 백업 (1시간마다)
MyDiary_2025.sdiary
MyDiary_2025.sdiary.backup/
├─ 2025-12-18_10-00.sdiary   # 10시 백업
├─ 2025-12-18_11-00.sdiary   # 11시 백업
├─ 2025-12-18_12-00.sdiary   # 12시 백업
└─ ... (최근 10개만 유지)
```

**구현**:
```typescript
async function createBackup(filePath: string): Promise<void> {
  const backupDir = `${filePath}.backup`;
  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const backupPath = path.join(backupDir, `${timestamp}.sdiary`);

  await fs.copyFile(filePath, backupPath);

  // 오래된 백업 삭제 (10개 초과 시)
  const backups = await fs.readdir(backupDir);
  if (backups.length > 10) {
    const sorted = backups.sort();
    for (let i = 0; i < backups.length - 10; i++) {
      await fs.unlink(path.join(backupDir, sorted[i]));
    }
  }
}
```

#### 4단계: UX 설계

**메뉴 바**:
```
File
├─ New Diary              (Ctrl+N)
├─ Open Diary...          (Ctrl+O)
├─ Save                   (Ctrl+S)
├─ Save As...             (Ctrl+Shift+S)
├─ ───────────────────
├─ Import from Browser    (localStorage 마이그레이션)
├─ Export to Web          (브라우저용 백업)
├─ ───────────────────
├─ Recent Files           ▶
│  ├─ MyDiary_2025.sdiary
│  ├─ WorkDiary.sdiary
│  └─ ...
└─ Exit
```

**상태 표시**:
```
┌─────────────────────────────────────────┐
│ 📁 MyDiary_2025.sdiary  ● (unsaved)     │  ← 타이틀바
└─────────────────────────────────────────┘

하단 상태바:
┌─────────────────────────────────────────┐
│ ✅ Saved 2 seconds ago  │  145 items    │
└─────────────────────────────────────────┘
```

---

## 2️⃣ Electron 이식 플랜

### 📦 필요한 패키지

```json
{
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "concurrently": "^8.2.2",
    "wait-on": "^7.2.0"
  },
  "dependencies": {
    "jszip": "^3.10.1",           // ZIP 처리
    "electron-store": "^8.1.0"     // 설정 저장
  }
}
```

### 📁 폴더 구조

```
digitalscrapdiary/
├─ electron/
│  ├─ main.ts              # Electron 메인 프로세스
│  ├─ preload.ts           # IPC 브릿지 (보안)
│  └─ utils/
│     ├─ fileManager.ts    # 파일 CRUD
│     └─ menuTemplate.ts   # 메뉴 바
│
├─ src/                    # 기존 React 코드 (그대로)
│  ├─ App.tsx
│  ├─ hooks/
│  ├─ components/
│  └─ services/
│
├─ electron-builder.json   # 빌드 설정
├─ vite.config.ts          # Vite 설정 (Electron용)
└─ package.json
```

### 🔧 main/renderer/IPC 경계

```
┌──────────────────────────────────────────────────┐
│  Renderer Process (React)                        │
│  ├─ UI 렌더링                                    │
│  ├─ 사용자 이벤트 처리                           │
│  └─ IPC 호출 (window.electron.*)                │
└──────────────────────────────────────────────────┘
                    ↕ IPC
┌──────────────────────────────────────────────────┐
│  Preload Script (contextBridge)                  │
│  ├─ 안전한 API 노출                              │
│  └─ 보안 검증                                    │
└──────────────────────────────────────────────────┘
                    ↕ IPC
┌──────────────────────────────────────────────────┐
│  Main Process (Node.js)                          │
│  ├─ 파일 시스템 접근                             │
│  ├─ 네이티브 다이얼로그                          │
│  ├─ 메뉴 바 / 단축키                             │
│  └─ 자동 업데이트                                │
└──────────────────────────────────────────────────┘
```

### 📝 구현 코드

#### `electron/main.ts`

```typescript
import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import fs from 'fs/promises';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,      // ✅ 보안
      nodeIntegration: false,       // ✅ 보안
    },
    titleBarStyle: 'hidden',        // 커스텀 타이틀바
    backgroundColor: '#f4f1ea',
  });

  // Vite dev server (개발) 또는 빌드된 파일 (프로덕션)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 메뉴 설정
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

// IPC Handlers

// 파일 저장 다이얼로그
ipcMain.handle('dialog:save', async () => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: `MyDiary_${new Date().getFullYear()}.sdiary`,
    filters: [{ name: 'Scrap Diary', extensions: ['sdiary'] }]
  });
  return result;
});

// 파일 열기 다이얼로그
ipcMain.handle('dialog:open', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    filters: [{ name: 'Scrap Diary', extensions: ['sdiary'] }],
    properties: ['openFile']
  });
  return result;
});

// 파일 쓰기
ipcMain.handle('fs:write', async (event, filePath: string, data: ArrayBuffer) => {
  await fs.writeFile(filePath, Buffer.from(data));
  return { success: true };
});

// 파일 읽기
ipcMain.handle('fs:read', async (event, filePath: string) => {
  const buffer = await fs.readFile(filePath);
  return buffer;
});
```

#### `electron/preload.ts`

```typescript
import { contextBridge, ipcRenderer } from 'electron';

// ✅ 안전한 API만 노출
contextBridge.exposeInMainWorld('electron', {
  // 다이얼로그
  showSaveDialog: () => ipcRenderer.invoke('dialog:save'),
  showOpenDialog: () => ipcRenderer.invoke('dialog:open'),

  // 파일 시스템
  writeFile: (path: string, data: ArrayBuffer) => ipcRenderer.invoke('fs:write', path, data),
  readFile: (path: string) => ipcRenderer.invoke('fs:read', path),

  // 앱 정보
  isElectron: () => true,
  getVersion: () => process.versions.electron,
});
```

#### `src/types/electron.d.ts`

```typescript
// TypeScript 타입 정의
export interface ElectronAPI {
  showSaveDialog: () => Promise<{ canceled: boolean; filePath?: string }>;
  showOpenDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  writeFile: (path: string, data: ArrayBuffer) => Promise<{ success: boolean }>;
  readFile: (path: string) => Promise<ArrayBuffer>;
  isElectron: () => boolean;
  getVersion: () => string;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
```

#### `vite.config.ts` (Electron용 수정)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',  // ✅ 상대 경로 (Electron 필수)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

#### `package.json` 스크립트

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "vite build && electron-builder",
    "electron:serve": "electron ."
  },
  "main": "electron/main.js"
}
```

#### `electron-builder.json`

```json
{
  "appId": "com.digitalscrapdiary.app",
  "productName": "Digital Scrap Diary",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "electron/**/*"
  ],
  "mac": {
    "category": "public.app-category.productivity",
    "icon": "build/icon.icns"
  },
  "win": {
    "icon": "build/icon.ico",
    "target": "nsis"
  },
  "linux": {
    "icon": "build/icon.png",
    "target": "AppImage"
  }
}
```

---

## 3️⃣ 내보내기 구현

### 🎨 내보내기 옵션

```typescript
export interface ExportOptions {
  format: 'png' | 'pdf';
  mode: 'safe' | 'full';           // safe: embed 제외, full: 전체
  pages: 'current' | 'all';         // 현재 페이지 or 전체
  watermark: boolean;               // 워터마크 추가
  quality: number;                  // 0.1 ~ 1.0
}
```

### 📸 PNG 내보내기 (capturePage 기반)

```typescript
// electron/main.ts에 추가
ipcMain.handle('export:png', async (event, options: ExportOptions) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: `diary-${Date.now()}.png`,
    filters: [{ name: 'PNG Image', extensions: ['png'] }]
  });

  if (!filePath) return { canceled: true };

  try {
    // Renderer에 "내보내기 모드" 알림
    mainWindow!.webContents.send('export:prepare', options);
    
    // 1초 대기 (CSS 적용 시간)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 캡처
    const image = await mainWindow!.webContents.capturePage();
    await fs.writeFile(filePath, image.toPNG());

    // 모드 복원
    mainWindow!.webContents.send('export:cleanup');

    return { success: true, filePath };
  } catch (error) {
    console.error('PNG export failed:', error);
    return { success: false, error: String(error) };
  }
});
```

### 🖼️ Renderer 측 (내보내기 모드)

```typescript
// App.tsx에 추가
useEffect(() => {
  if (!window.electron) return;

  // 내보내기 준비
  window.electron.on('export:prepare', (options: ExportOptions) => {
    if (options.mode === 'safe') {
      // 안전 모드: SNS embed 숨김
      document.body.classList.add('export-exclude-embeds');
    }

    if (options.watermark) {
      // 워터마크 추가
      const watermark = document.createElement('div');
      watermark.id = 'export-watermark';
      watermark.textContent = 'Digital Scrap Diary - Personal Use Only';
      watermark.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        font-size: 12px;
        color: rgba(0,0,0,0.3);
        pointer-events: none;
        z-index: 9999;
      `;
      document.body.appendChild(watermark);
    }
  });

  // 정리
  window.electron.on('export:cleanup', () => {
    document.body.classList.remove('export-exclude-embeds');
    document.getElementById('export-watermark')?.remove();
  });
}, []);
```

### 📄 PDF 내보내기

```typescript
// electron/main.ts
ipcMain.handle('export:pdf', async (event, options: ExportOptions) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: `diary-${Date.now()}.pdf`,
    filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
  });

  if (!filePath) return { canceled: true };

  try {
    mainWindow!.webContents.send('export:prepare', options);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // PDF로 출력
    const pdfData = await mainWindow!.webContents.printToPDF({
      pageSize: 'A4',
      landscape: true,
      printBackground: true,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    });

    await fs.writeFile(filePath, pdfData);
    mainWindow!.webContents.send('export:cleanup');

    return { success: true, filePath };
  } catch (error) {
    console.error('PDF export failed:', error);
    return { success: false, error: String(error) };
  }
});
```

### 🎛️ UI 구현

```typescript
// components/ExportDialog.tsx
const ExportDialog: React.FC = () => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'png',
    mode: 'safe',
    pages: 'current',
    watermark: true,
    quality: 0.9
  });

  const handleExport = async () => {
    if (!window.electron) return;

    const result = await window.electron.exportPage(options);
    if (result.success) {
      alert(`Exported to: ${result.filePath}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-lg p-6 w-[400px]">
        <h2 className="text-xl font-bold mb-4">내보내기</h2>

        {/* 포맷 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">포맷</label>
          <div className="flex gap-2">
            <button
              onClick={() => setOptions({ ...options, format: 'png' })}
              className={`flex-1 py-2 rounded ${options.format === 'png' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              PNG
            </button>
            <button
              onClick={() => setOptions({ ...options, format: 'pdf' })}
              className={`flex-1 py-2 rounded ${options.format === 'pdf' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              PDF
            </button>
          </div>
        </div>

        {/* 안전 모드 */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.mode === 'safe'}
              onChange={(e) => setOptions({ ...options, mode: e.target.checked ? 'safe' : 'full' })}
              className="mr-2"
            />
            <span className="text-sm">
              🛡️ 안전 모드 (SNS 임베드 제외)
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-6">
            트위터/인스타 임베드를 링크 카드로 대체
          </p>
        </div>

        {/* 워터마크 */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.watermark}
              onChange={(e) => setOptions({ ...options, watermark: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">워터마크 추가</span>
          </label>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            내보내기
          </button>
          <button
            onClick={() => {/* close */}}
            className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 4️⃣ 임베드 유지 정책 정리

### 📋 현재 정책 (V2)

```typescript
// ✅ 저장: URL + embed ID만
{
  url: "https://twitter.com/user/status/123",
  platform: "twitter",
  embed: { kind: "twitter", id: "123" },
  storeMode: "safe"
}

// ❌ 저장 안 함
{
  description: "트윗 원문",
  imageUrl: "https://pbs.twimg.com/...",
  twitterStats: { likes: 100 }
}
```

### 🛡️ 데스크톱에서도 동일 정책 유지

**장점**:
- ✅ 저작권 리스크 최소화
- ✅ 저장 용량 절약
- ✅ 최신 콘텐츠 항상 표시
- ✅ 플랫폼 ToS 준수

**단점**:
- ⚠️ 오프라인 사용 불가
- ⚠️ 원본 삭제 시 표시 안 됨
- ⚠️ 비공개 전환 시 접근 불가

---

### ⚠️ 리스크 & 예외 케이스

#### Case 1: 원본 삭제

**문제**:
```
User → 트윗 저장 (URL + ID)
Author → 트윗 삭제
App → 임베드 로드 실패
```

**Fallback**:
```typescript
// TwitterEmbedCard.tsx
const TwitterEmbedCard = ({ data }) => {
  const [embedFailed, setEmbedFailed] = useState(false);

  useEffect(() => {
    // 위젯 로드 시도
    const result = await window.twttr.widgets.createTweet(tweetId, container);
    if (!result) {
      setEmbedFailed(true);
    }
  }, []);

  if (embedFailed) {
    // ✅ 링크 카드로 대체
    return (
      <LinkCardFallback 
        data={{
          title: "트윗 (삭제됨)",
          subtitle: "Twitter",
          url: data.url,
          message: "⚠️ 원본 콘텐츠가 삭제되었거나 비공개로 전환되었습니다."
        }}
      />
    );
  }

  return <div ref={containerRef} />; // 공식 위젯
};
```

#### Case 2: 비공개 전환

**문제**:
```
User → 인스타 게시물 저장
Author → 계정 비공개로 전환
App → 임베드 로드 실패 (403 Forbidden)
```

**Fallback**:
```typescript
// InstagramEmbedCard.tsx
<blockquote
  className="instagram-media"
  data-instgrm-permalink={url}
  data-instgrm-version="14"
  onError={() => {
    // ✅ 로드 실패 시 링크 카드
    setEmbedFailed(true);
  }}
/>
```

#### Case 3: 임베드 차단 (플랫폼 정책 변경)

**문제**:
```
Platform → embed API 정책 변경 (예: X의 API 유료화)
App → 임베드 로드 실패
```

**Fallback**:
```typescript
// globalThis에서 위젯 스크립트 로드 실패 감지
if (!window.twttr) {
  // ✅ 서버 API로 기본 정보 가져오기
  const fallbackData = await fetch(`/api/twitter-fallback?url=${url}`);
  return <LinkCardFallback data={fallbackData} />;
}
```

#### Case 4: 유저 스냅샷 (선택 기능)

**사용자 요청 시 원본 저장 허용**:
```typescript
// components/ItemContextMenu.tsx
const ItemContextMenu = ({ item }) => {
  const handleSaveSnapshot = async () => {
    if (!window.confirm('⚠️ 원본 콘텐츠를 저장하시겠습니까?\n저작권 위반 가능성이 있습니다.')) {
      return;
    }

    // 현재 임베드 렌더링 상태를 캡처
    const element = document.getElementById(`item-${item.id}`);
    const canvas = await html2canvas(element);
    const snapshot = canvas.toDataURL('image/png');

    // 메타데이터에 저장
    onUpdateItem(item.id, {
      metadata: {
        ...item.metadata,
        snapshot: {
          coverAssetId: crypto.randomUUID(),
          coverText: '유저 스냅샷',
          createdAt: Date.now()
        },
        snapshotImage: snapshot  // Base64
      }
    });
  };

  return (
    <div className="context-menu">
      <button onClick={handleSaveSnapshot}>
        📸 스냅샷 저장 (오프라인 백업)
      </button>
      <p className="text-xs text-red-500">
        ⚠️ 개인 용도로만 사용하세요
      </p>
    </div>
  );
};
```

**렌더링 우선순위**:
```typescript
// 1순위: 유저 스냅샷 (있으면)
if (data.snapshotImage) {
  return <img src={data.snapshotImage} alt="snapshot" />;
}

// 2순위: 공식 임베드
try {
  return <TwitterEmbed tweetId={data.tweetId} />;
} catch {
  // 3순위: 링크 카드
  return <LinkCardFallback data={data} />;
}
```

---

### 📊 정책 요약표

| 상황 | 대응 | 사용자 경험 | 리스크 |
|------|------|------------|--------|
| **정상** | 공식 임베드 표시 | ✅ 최적 | - |
| **원본 삭제** | 링크 카드 + 경고 | ⚠️ 제한적 | 낮음 |
| **비공개 전환** | 링크 카드 + 경고 | ⚠️ 제한적 | 낮음 |
| **임베드 차단** | 서버 fallback API | ⚠️ 제한적 | 중간 |
| **유저 스냅샷** | 로컬 이미지 표시 | ✅ 오프라인 가능 | 높음 (저작권) |

---

## 5️⃣ 법적 안내문 (10줄)

### 🇰🇷 한국어

```markdown
### 📌 중요 안내

Digital Scrap Diary는 개인 북마크 도구입니다.

1. **원문 저장 안 함**: SNS 게시물의 텍스트/이미지는 저장하지 않습니다.
2. **공식 임베드 사용**: 트위터/인스타그램은 각 플랫폼의 공식 위젯으로 표시됩니다.
3. **링크만 보관**: URL과 레이아웃 정보만 저장됩니다.
4. **원본 삭제 시**: 원작자가 삭제한 콘텐츠는 표시되지 않습니다.
5. **내보내기 주의**: PNG/PDF 파일은 개인 용도로만 사용하세요.
6. **재배포 금지**: 내보낸 파일을 온라인에 공유하지 마세요.
7. **권리자 보호**: 저작권자의 요청 시 즉시 삭제됩니다.

**문의**: support@digitalscrapdiary.com (placeholder)
```

### 🇺🇸 English

```markdown
### 📌 Important Notice

Digital Scrap Diary is a personal bookmark tool.

1. **No Content Storage**: We don't store original text/images from social media.
2. **Official Embeds**: Twitter/Instagram posts are displayed via official widgets.
3. **Links Only**: We save URLs and layout data only.
4. **Deletion Policy**: Deleted content by authors won't be displayed.
5. **Export Caution**: PNG/PDF exports are for personal use only.
6. **No Redistribution**: Don't share exported files online.
7. **Copyright Respect**: Content will be removed upon rights holder request.

**Contact**: support@digitalscrapdiary.com (placeholder)
```

---

### 🖥️ 앱 내 표시 위치

#### About 다이얼로그

```typescript
// components/AboutDialog.tsx
const AboutDialog: React.FC = () => {
  const [lang, setLang] = useState<'ko' | 'en'>('ko');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">About</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setLang('ko')}
              className={`px-3 py-1 rounded ${lang === 'ko' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              한국어
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded ${lang === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              English
            </button>
          </div>
        </div>

        {/* Logo & Version */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">📖</div>
          <h3 className="text-xl font-bold">Digital Scrap Diary</h3>
          <p className="text-sm text-gray-500">Version 1.0.0</p>
        </div>

        {/* Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          {lang === 'ko' ? (
            <>
              <h4 className="font-bold mb-2">📌 중요 안내</h4>
              <p className="text-sm leading-relaxed">
                Digital Scrap Diary는 개인 북마크 도구입니다.
              </p>
              <ol className="text-sm mt-2 space-y-1 list-decimal list-inside">
                <li>원문 저장 안 함: SNS 게시물 텍스트/이미지 저장 안 함</li>
                <li>공식 임베드 사용: 각 플랫폼 공식 위젯으로 표시</li>
                <li>링크만 보관: URL과 레이아웃 정보만 저장</li>
                <li>원본 삭제 시: 원작자 삭제 시 표시 안 됨</li>
                <li>내보내기 주의: PNG/PDF는 개인 용도로만</li>
                <li>재배포 금지: 내보낸 파일 온라인 공유 금지</li>
                <li>권리자 보호: 저작권자 요청 시 즉시 삭제</li>
              </ol>
            </>
          ) : (
            <>
              <h4 className="font-bold mb-2">📌 Important Notice</h4>
              <p className="text-sm leading-relaxed">
                Digital Scrap Diary is a personal bookmark tool.
              </p>
              <ol className="text-sm mt-2 space-y-1 list-decimal list-inside">
                <li>No Content Storage: We don't store original text/images</li>
                <li>Official Embeds: Twitter/Instagram via official widgets</li>
                <li>Links Only: We save URLs and layout data only</li>
                <li>Deletion Policy: Deleted content won't be displayed</li>
                <li>Export Caution: PNG/PDF for personal use only</li>
                <li>No Redistribution: Don't share exported files online</li>
                <li>Copyright Respect: Removed upon rights holder request</li>
              </ol>
            </>
          )}
          <p className="text-xs text-gray-600 mt-3">
            <strong>Contact:</strong> support@digitalscrapdiary.com
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {/* close */}}
          className="w-full bg-gray-200 py-2 rounded hover:bg-gray-300"
        >
          닫기 / Close
        </button>
      </div>
    </div>
  );
};
```

#### 메뉴 바 (Help > About)

```typescript
// electron/menuTemplate.ts
const menuTemplate: MenuItemConstructorOptions[] = [
  {
    label: 'Help',
    submenu: [
      {
        label: 'About Digital Scrap Diary',
        click: () => {
          mainWindow?.webContents.send('show-about-dialog');
        }
      },
      {
        label: 'Privacy & Policy',
        click: () => {
          shell.openExternal('https://digitalscrapdiary.com/policy');
        }
      },
      { type: 'separator' },
      {
        label: 'Report Copyright Infringement',
        click: () => {
          shell.openExternal('mailto:dmca@digitalscrapdiary.com');
        }
      }
    ]
  }
];
```

---

## 📊 최종 요약

| 항목 | 추천 방안 | 예상 공수 |
|------|-----------|----------|
| **저장 구조** | `.sdiary` (ZIP) | 3-4일 |
| **Electron 이식** | 최소 변경 (IPC 레이어만) | 5-7일 |
| **내보내기** | capturePage + PDF | 2-3일 |
| **임베드 정책** | 현재 유지 + Fallback | 1-2일 |
| **법적 안내** | About 다이얼로그 | 1일 |
| **총 개발 기간** | - | **12-17일** |

---

**다음 단계**:
1. ✅ Electron 환경 세팅 (electron, electron-builder 설치)
2. ✅ main.ts, preload.ts 작성
3. ✅ IPC 브릿지 구현
4. ✅ 파일 저장/로드 기능
5. ✅ 내보내기 기능
6. ✅ About 다이얼로그

**시작할까요?** 🚀




