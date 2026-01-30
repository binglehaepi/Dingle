# Phase 4: PNG/PDF 내보내기 구현

**완료 일시**: 2025-12-18 14:20 KST  
**목표**: Electron 앱에서 다이어리를 PNG/PDF로 내보내기  
**상태**: ✅ 구현 완료, 테스트 대기

---

## 🎯 구현 기능

### 1. PNG 내보내기
- **메서드**: `window.electron.exportPNG()`
- **기능**: 
  - 파일 저장 다이얼로그 표시
  - 현재 페이지 캡처 (`webContents.capturePage()`)
  - PNG 파일로 저장
- **저장 위치**: 사용자 선택 (기본: `~/Documents/ScrapDiary/`)

### 2. PDF 내보내기
- **메서드**: `window.electron.exportPDF()`
- **기능**:
  - 파일 저장 다이얼로그 표시
  - 페이지를 PDF로 변환 (`webContents.printToPDF()`)
  - A4 가로 방향, 배경 포함
  - 여백 없음
- **저장 위치**: 사용자 선택 (기본: `~/Documents/ScrapDiary/`)

### 3. UI 버튼
- **위치**: 데스크톱 툴바 (우측)
- **표시 조건**: `window.electron` 존재 시 (Electron 모드에서만)
- **아이콘**:
  - PNG: 🖼️ 이미지 아이콘 (보라색 hover)
  - PDF: 📄 문서 아이콘 (빨간색 hover)

---

## 📦 수정된 파일

### 1. `components/DesktopApp.tsx` 🔄
**변경 사항**:
- PNG 내보내기 버튼 추가
- PDF 내보내기 버튼 추가
- Electron 감지 (`window.electron`)
- 성공/실패 toast 메시지

**코드**:
```typescript
{/* Export PNG (Electron only) */}
{window.electron && (
  <button 
    onClick={async () => {
      try {
        const result = await window.electron.exportPNG();
        if (result.success && result.filePath) {
          setToastMsg('✅ PNG exported!');
        }
      } catch (error) {
        setToastMsg('❌ Error');
      }
    }}
    // ... 스타일
  >
    {/* PNG 아이콘 */}
  </button>
)}
```

### 2. `components/items/EditableScrap.tsx` 🔧
**버그 수정**:
- 빈 `imageUrl` 처리
- 조건부 렌더링: `{localData.imageUrl && <img ... />}`

---

## 🧪 테스트 시나리오

### PNG 내보내기 테스트

```
1. Electron 앱 실행
2. 다이어리에 아이템 추가
3. 툴바에서 "PNG" 버튼 클릭 (보라색 이미지 아이콘)
4. 파일 저장 다이얼로그에서 위치 선택
5. ✅ PNG 파일 생성 확인
6. Toast 메시지: "✅ PNG exported!"
7. Finder에서 PNG 파일 열기
8. ✅ 화면이 정확히 캡처되었는지 확인
```

### PDF 내보내기 테스트

```
1. Electron 앱 실행
2. 다이어리에 아이템 추가
3. 툴바에서 "PDF" 버튼 클릭 (빨간색 문서 아이콘)
4. 파일 저장 다이얼로그에서 위치 선택
5. ✅ PDF 파일 생성 확인
6. Toast 메시지: "✅ PDF exported!"
7. Preview에서 PDF 파일 열기
8. ✅ A4 가로, 배경 포함, 여백 없음 확인
```

---

## 📊 Phase 4 통계

| 항목 | 값 |
|------|-----|
| **구현 시간** | ~30분 |
| **수정 파일** | 2개 |
| **추가 코드** | ~80줄 |
| **버그 수정** | 1개 (EditableScrap img) |
| **Linter 에러** | 0개 ✅ |

---

## 🚀 주요 개선 사항

### Before (Phase 3)
- ❌ 내보내기 기능 없음
- ❌ 스크린샷으로만 저장 가능
- ❌ 품질 저하

### After (Phase 4)
- ✅ PNG 고품질 내보내기
- ✅ PDF 문서 내보내기
- ✅ 파일 다이얼로그
- ✅ 사용자 친화적 UI

---

## ⚡ 기술 세부사항

### PNG 캡처 방식

```typescript
// Electron BrowserWindow API 사용
const image = await mainWindow.webContents.capturePage();
await fs.writeFile(filePath, image.toPNG());
```

**장점**:
- 고품질 캡처
- 화면 크기에 무관
- Retina 디스플레이 지원

### PDF 생성 방식

```typescript
// Electron printToPDF API 사용
const pdfData = await mainWindow.webContents.printToPDF({
  pageSize: 'A4',
  landscape: true,
  printBackground: true,
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
});
```

**장점**:
- 벡터 기반 (확대해도 선명)
- 인쇄 최적화
- 파일 크기 작음

---

## 🎯 다음 단계 (Phase 5)

**목표**: 고급 기능 (ZIP/버전 히스토리)

**작업 내용**:
1. `.sdiary` ZIP 포맷
   - `manifest.json` (메타데이터)
   - `layout.json` (아이템 배치)
   - `assets/` (이미지, 스티커)
   - `snapshots/` (백업 히스토리)

2. 버전 히스토리
   - 자동 스냅샷 (하루 1회)
   - 수동 백업
   - 복원 UI

3. 고급 내보내기 옵션
   - SNS 임베드 제외 "안전 모드"
   - 워터마크 추가
   - 해상도 선택

**예상 공수**: 2-3시간

---

**작성자**: AI Assistant  
**상태**: ✅ Phase 4 완료, Phase 5 대기 중




