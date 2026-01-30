# 📦 Phase 2 세팅 가이드 - Electron 환경 구축

**작성일시**: 2025-12-18 13:35 KST  
**목표**: Electron 데스크톱 앱 실행 환경 완성  
**상태**: ⏳ 패키지 설치 대기 중

---

## ✅ 완료된 파일

### 1. **`electron/main.ts`** (258줄)
- 메인 프로세스 코드
- 윈도우 생성, IPC 핸들러, 파일 시스템 접근

### 2. **`electron/preload.ts`** (115줄)
- Preload 스크립트
- 안전한 IPC 브릿지

### 3. **`electron/tsconfig.json`**
- Electron 전용 TypeScript 설정

### 4. **`vite.config.ts`** (수정)
- `base: './'` 추가 (Electron 상대 경로)
- `build.rollupOptions.external: ['electron']` 추가

### 5. **`package.json`** (수정)
- `main: "dist-electron/main.js"` 추가
- Electron 스크립트 추가:
  - `npm run electron:dev` - 개발 모드
  - `npm run electron:build` - 빌드 (전체)
  - `npm run electron:build:mac` - macOS만
  - `npm run electron:build:win` - Windows만

### 6. **`electron-builder.json`**
- 빌드 설정 (macOS, Windows, Linux)

### 7. **`src/types/electron.d.ts`**
- TypeScript 타입 정의

---

## 🚀 설치 방법

### ⚠️ npm 권한 문제 해결 (필수)

터미널에서 다음 명령어 실행:

```bash
cd "/Users/ieun-yeong/Desktop/digitalscrapdiary 2"

# 방법 1: 자동 스크립트 (추천)
./INSTALL_ELECTRON.sh

# 방법 2: 수동 설치
sudo chown -R $(whoami) "$HOME/.npm"
npm install --save-dev electron@^28.0.0 electron-builder@^24.9.1 concurrently@^8.2.2 wait-on@^7.2.0 --legacy-peer-deps
```

**설치 시간**: 약 2-3분

---

## 🧪 테스트 방법

### 1. 개발 모드 실행

```bash
npm run electron:dev
```

**예상 결과**:
- ✅ Vite dev server 시작 (http://localhost:3000)
- ✅ Electron 윈도우 열림
- ✅ 앱이 정상 작동
- ✅ DevTools 자동 열림 (F12로 토글 가능)

### 2. Electron 환경 확인

**브라우저 콘솔에서 테스트**:

```javascript
// Electron 환경인지 확인
console.log('Is Electron:', !!window.electron);

// 경로 확인
const paths = await window.electron.getPaths();
console.log('Paths:', paths);

// 버전 확인
const version = await window.electron.getVersion();
console.log('Version:', version);
```

**예상 출력**:
```
Is Electron: true
Paths: {
  documents: "/Users/ieun-yeong/Documents",
  userData: "/Users/ieun-yeong/Library/Application Support/digitalscrapdiary",
  diaryDir: "/Users/ieun-yeong/Documents/ScrapDiary"
}
Version: {
  app: "1.0.0",
  electron: "28.0.0",
  chrome: "120.0.6099.109",
  node: "18.18.0"
}
```

### 3. 빌드 테스트 (선택)

```bash
# macOS 빌드
npm run electron:build:mac

# Windows 빌드 (크로스 플랫폼)
npm run electron:build:win
```

**빌드 결과**:
- `release/` 폴더에 설치 파일 생성
- macOS: `.dmg`, `.zip`
- Windows: `.exe` (installer), `.exe` (portable)

---

## 📁 폴더 구조 (완성 후)

```
digitalscrapdiary/
├─ electron/
│  ├─ main.ts           ✅ 생성 완료
│  ├─ preload.ts        ✅ 생성 완료
│  └─ tsconfig.json     ✅ 생성 완료
│
├─ src/
│  ├─ types/
│  │  └─ electron.d.ts  ✅ 생성 완료
│  └─ ... (기존 React 코드)
│
├─ dist/                (vite build 결과)
├─ dist-electron/       (electron compile 결과)
├─ release/             (electron-builder 결과)
│
├─ vite.config.ts       ✅ 수정 완료
├─ package.json         ✅ 수정 완료
├─ electron-builder.json ✅ 생성 완료
└─ INSTALL_ELECTRON.sh  ✅ 생성 완료
```

---

## 🔧 문제 해결

### 1. npm 권한 오류
```
Error: EACCES: permission denied
```

**해결**:
```bash
sudo chown -R $(whoami) "$HOME/.npm"
```

### 2. Electron 윈도우가 안 열림
```
Failed to load URL: http://localhost:3000
```

**해결**:
- Vite dev server가 먼저 시작되었는지 확인
- `wait-on` 패키지가 설치되었는지 확인
- 포트 3000이 사용 중인지 확인

### 3. TypeScript 컴파일 오류
```
Cannot find module 'electron'
```

**해결**:
```bash
npm install --save-dev @types/node
```

### 4. 빌드 실패 (아이콘 없음)
```
Icon build/icon.icns not found
```

**해결**:
- Phase 2에서는 아이콘 없이도 빌드 가능
- Phase 5에서 아이콘 추가 예정
- 임시로 `electron-builder.json`에서 icon 라인 제거 가능

---

## 🎯 확인 체크리스트

- [ ] `INSTALL_ELECTRON.sh` 실행 완료
- [ ] 패키지 설치 성공 (electron, electron-builder, concurrently, wait-on)
- [ ] `npm run electron:dev` 실행 성공
- [ ] Electron 윈도우 열림
- [ ] 브라우저 콘솔에서 `window.electron` 접근 가능
- [ ] DevTools 열림 (F12)
- [ ] 앱이 정상 작동

---

## 📊 Phase 2 vs Phase 1 비교

| 항목 | Phase 1 (웹) | Phase 2 (Electron) |
|------|-------------|-------------------|
| **실행 환경** | 브라우저 | 데스크톱 앱 |
| **백업 저장** | 브라우저 다운로드 | 파일 시스템 |
| **데이터 제한** | 5MB (localStorage) | 무제한 |
| **파일 접근** | ❌ 불가능 | ✅ 가능 |
| **내보내기** | ❌ 불가능 | ✅ PNG/PDF |
| **오프라인** | ⚠️ 제한적 | ✅ 완전 지원 |
| **자동 저장** | ❌ 없음 | ✅ 가능 (Phase 3) |

---

## 🚀 다음 단계 (Phase 3)

**목표**: localStorage → 파일 저장 전환

**작업 내용**:
1. `services/electronStorage.ts` 생성
2. 자동 저장 구현 (5초 디바운스)
3. Atomic write (파일 깨짐 방지)
4. 백업 다이얼로그 수정 (파일 시스템 사용)

**예상 공수**: 2-3시간

---

## 💡 Phase 2 완료 조건

✅ **패키지 설치 완료**  
✅ **`npm run electron:dev` 실행 성공**  
✅ **Electron 윈도우 열림**  
✅ **`window.electron` API 접근 가능**

위 조건이 모두 만족되면 Phase 2 완료!

---

**작성자**: AI Assistant  
**검토자**: 사용자  
**상태**: ⏳ 사용자 설치 대기 중




