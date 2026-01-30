# UI 컬러 토큰 1:1 정확 매핑 완료 보고서

## 🎯 작업 목표
UI 컬러 토큰을 1:1 정확 매핑으로 고정하고, 서로 연쇄 변경/공유를 전부 제거

---

## ✅ 완료 항목

### 1. 토큰 삭제 (불필요한 토큰 제거)
다음 토큰들이 모든 파일에서 완전히 제거되었습니다:

- ❌ `textColorMuted` - 삭제 (textColorPrimary로 통일)
- ❌ `accentColor` - 삭제 (textColorPrimary로 통일)
- ❌ `widgetItemBackground` - 삭제 (widgetSurfaceBackground 사용)
- ❌ `calendarHeaderTextColor` - 삭제 (textColorPrimary 사용)
- ❌ `calendarWeekdayTextColor` - 삭제 (textColorPrimary 사용)
- ❌ `calendarDateTextColor` - 삭제 (textColorPrimary 사용)

### 2. 토큰 유지 (필수) + 의미 고정
각 토큰은 고유한 영역만 담당하며, 다른 토큰과 공유되지 않습니다:

#### 📄 앱 / 노트 구조
- `appBackground` - 노트 바깥 배경(데스크), 독립적
- `notePaperBackground` - 노트 페이지 종이 바탕 (위젯/달력 내부와 독립)
- `noteOuterBorderColor` - 노트 외곽선만
- `noteCenterFoldLineColor` - 중앙 접힘선만

#### 📦 위젯 공통
- `widgetBorderColor` - 모든 위젯 박스 외곽선만 (CD위젯 포함)
- `widgetSurfaceBackground` - 위젯 박스 내부 바탕만 (항목 카드 배경에도 사용)
- `widgetInputBackground` - input/textarea 배경만

#### 🎀 위젯 상단 바 (각각 독립)
- `profileHeaderBarBg` - 프로필 위젯 상단 바만
- `goalsHeaderBarBg` - Monthly Goals 상단 바만
- `ddayHeaderBarBg` - D-day 위젯 상단 바만
- `ohaasaHeaderBarBg` - 오하아사 위젯 상단 바만
- `bucketHeaderBarBg` - Bucket List 상단 바만

#### 📅 달력 (정확 분리)
- `calendarDateHeaderBg` - 상단 날짜/월 네비 헤더 배경 (구버전 호환: weekday로 fallback)
- `calendarWeekdayHeaderBg` - 요일 헤더 줄 배경만
- `calendarGridLineColor` - 달력 선 (겹침 없이 1줄)
- `calendarCellBackground` - 모든 날짜 칸 기본 배경 (일반 날짜 포함)
- `calendarTodayHighlightBg` - 오늘 칸 하이라이트 배경

#### 📑 월 탭 (RGBA 지원)
- `monthTabBg` - 기본 탭 배경 (rgba 알파 지원)
- `monthTabBgActive` - 활성 탭 배경
- `monthTabBorderColor` - 탭 테두리
- `monthTabTextColor` - 탭 텍스트(활성/비활성 동일)

#### 🔑 키링
- `keyringMetalColor` - 키링 체인/금속만
- `keyringFrameBorderColor` - 프레임 테두리만

#### 💿 CD 플레이어
- `cdWidgetBackground` - CD 위젯 배경 (외부 컨테이너)
- `cdDiscColor` - 디스크 색
- `cdScreenBg` - 스크린 배경
- `cdButtonBg` - 버튼 배경
- `cdDotColor` - 하단 점 색

#### ✍️ 글로벌 텍스트
- `textColorPrimary` - 모든 텍스트 통일 (헤더/요일/탭/버튼 포함)

### 3. 컴포넌트 적용 원칙 (강제 적용 완료)

#### ✅ MonthlySpread.tsx
- ✅ `notePaperBackground`는 위젯/달력 내부에서 절대 참조하지 않음
- ✅ `noteOuterBorderColor`는 위젯 테두리에 사용되지 않음
- ✅ `widgetSurfaceBackground`는 input 배경에 사용되지 않음 (input은 `widgetInputBackground`)
- ✅ Goals/Bucket 항목 카드는 `widgetSurfaceBackground` 사용 (전용 토큰 삭제됨)
- ✅ 달력 `.calendar-cell` 기본 배경은 `calendarCellBackground`로 통일
- ✅ 달력 선: border-collapse 사용 금지, border-right/border-bottom만 사용
- ✅ 모든 텍스트는 `textColorPrimary` 사용 (달력 헤더, 요일, 날짜 포함)

#### ✅ PaletteEditorModal.tsx
- ✅ 삭제된 토큰 항목 제거
- ✅ 설명 업데이트 (독립성 강조)

#### ✅ cssVariables.ts
- ✅ 삭제된 토큰의 CSS 변수 매핑 제거
- ✅ 1:1 정확 매핑 유지

### 4. 텍스트 컬러 정책
- ✅ 전체 텍스트는 `textColorPrimary` 하나로 통일
- ✅ placeholder는 `textColorPrimary`에 opacity만 적용
- ✅ 달력 헤더/요일/날짜 모두 `textColorPrimary` 사용
- ✅ 일요일만 하드코딩된 빨강 (#ef4444) 사용

---

## 🧪 검증용 "플래시 팔레트" 테스트

### 테스트 방법
1. 앱 실행
2. 팔레트 에디터 열기 (🎨 아이콘)
3. "불러오기" 버튼 클릭
4. 아래 JSON을 파일로 저장 후 불러오기
5. 각 토큰이 정확히 1:1 매핑되는지 확인

### 테스트 JSON (극단 색상)
```json
{
  "appBackground": "#ffffff",
  "notePaperBackground": "#fee16c",
  "noteOuterBorderColor": "#39190e",
  "noteCenterFoldLineColor": "#ffffff",
  "widgetBorderColor": "#006aff",
  "widgetSurfaceBackground": "#ffb8b8",
  "widgetInputBackground": "#000000",
  "profileHeaderBarBg": "#ff42d0",
  "goalsHeaderBarBg": "#f83220",
  "ddayHeaderBarBg": "#514d34",
  "ohaasaHeaderBarBg": "#916bef",
  "bucketHeaderBarBg": "#e8ed54",
  "calendarDateHeaderBg": "#000000",
  "calendarWeekdayHeaderBg": "#ff695c",
  "calendarGridLineColor": "#0066ff",
  "calendarCellBackground": "#8c40b5",
  "calendarTodayHighlightBg": "#000000",
  "monthTabBg": "#fe9f9f",
  "monthTabBgActive": "#f04c4c",
  "monthTabBorderColor": "#000000",
  "monthTabTextColor": "#000000",
  "keyringMetalColor": "#ff4405",
  "keyringFrameBorderColor": "#000000",
  "cdWidgetBackground": "#ffffff",
  "cdDiscColor": "#81b1fe",
  "cdScreenBg": "#487ed5",
  "cdButtonBg": "#843333",
  "cdDotColor": "#7daae8",
  "textColorPrimary": "#fe9876"
}
```

### 예상 결과 (성공 조건)
- ✅ `notePaperBackground` 변경 → 위젯 내부/달력 칸 배경은 변하지 않음
- ✅ `noteOuterBorderColor` 변경 → 위젯 테두리에 영향 없음
- ✅ `widgetSurfaceBackground` 변경 → 위젯 박스 내부만 변경 (input 제외)
- ✅ `widgetInputBackground` 변경 → input/textarea만 변경
- ✅ `calendarCellBackground` 변경 → 모든 날짜 칸 배경 변경 (일반 날짜 포함)
- ✅ `calendarGridLineColor` 변경 → 선이 2줄로 진해지지 않음 (1줄만)
- ✅ `monthTabBorderColor`/`monthTabTextColor` → 실제 탭에 반영
- ✅ `textColorPrimary` 변경 → 모든 텍스트 (헤더/요일/탭/버튼) 변경

### 실패 조건 (아래 현상 발생 시 실패)
- ❌ `notePaperBackground` 변경이 위젯/달력 칸에도 영향
- ❌ `noteOuterBorderColor` 변경이 위젯 테두리에도 영향
- ❌ `widgetSurfaceBackground` 변경이 input에만 영향
- ❌ `calendarGridLineColor` 변경 시 선이 2줄로 진해짐
- ❌ `calendarCellBackground` 변경이 일반 날짜 칸에 영향 없음

---

## 📝 수정된 파일 목록

1. `types.ts` - UIPalette 인터페이스에서 불필요한 토큰 제거
2. `constants/appConstants.ts` - DEFAULT_UI_PALETTE에서 불필요한 토큰 제거
3. `utils/cssVariables.ts` - CSS 변수 매핑에서 불필요한 토큰 제거
4. `components/PaletteEditorModal.tsx` - 팔레트 에디터에서 불필요한 토큰 항목 제거
5. `components/layouts/MonthlySpread.tsx` - 잘못된 토큰 참조 수정
   - Goals/Bucket 항목 카드: `widgetItemBackground` → `widgetSurfaceBackground`
   - 텍스트 색상: 하드코딩 → `textColorPrimary`
   - 달력 칸 배경: `notePaperBackground` → `calendarCellBackground`
   - 달력 헤더 텍스트: `calendarHeaderTextColor` → `textColorPrimary`
   - 요일 텍스트: `calendarWeekdayTextColor` → `textColorPrimary`
   - 날짜 텍스트: 하드코딩 → `textColorPrimary`

---

## 🎉 완료 요약

### 토큰 수
- **삭제**: 6개
- **유지**: 28개
- **총 토큰 수**: 28개 (깔끔하게 정리됨)

### 핵심 원칙
1. ✅ 1:1 정확 매핑 - 각 토큰은 하나의 영역만 담당
2. ✅ 연쇄 참조 제거 - 토큰 간 공유 완전 차단
3. ✅ 텍스트 통일 - `textColorPrimary` 하나로 통일
4. ✅ 독립성 보장 - notePaper/widget/calendar 완전 분리

### 검증 완료
- ✅ Linter 에러 없음
- ✅ 모든 컴포넌트에서 삭제된 토큰 참조 제거
- ✅ 1:1 매핑 원칙 준수

---

## 📌 다음 단계 (사용자 작업)

1. **플래시 팔레트 테스트 실행**
   - 위의 극단 색상 JSON 불러오기
   - 각 토큰이 독립적으로 작동하는지 육안 확인

2. **정상 동작 확인**
   - 위젯 배경과 달력 배경이 독립적으로 변하는지 확인
   - 텍스트가 모두 `textColorPrimary`로 통일되는지 확인
   - 달력 선이 1줄로만 표시되는지 확인

3. **문제 발견 시**
   - 어떤 토큰을 변경했을 때
   - 예상치 못한 영역이 함께 변하는지 보고

---

작업 완료! 🎉




