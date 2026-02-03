# 핸들 시스템 구현 보고서

**작성일**: 2026-01-31  
**프로젝트**: Digital Scrap Diary  
**목적**: 스티커 및 아이템 조작을 위한 핸들 시스템 구현 및 문제 해결 과정 기록

---

## 📋 목차

1. [개요](#개요)
2. [초기 요구사항](#초기-요구사항)
3. [발견된 문제들](#발견된-문제들)
4. [해결 과정](#해결-과정)
5. [최종 구현](#최종-구현)
6. [교훈 및 권장사항](#교훈-및-권장사항)

---

## 개요

### 배경
- 사용자가 스티커를 드래그 앤 드롭으로 추가할 수 있게 되면서, 스티커 조작을 위한 핸들 시스템 필요성 대두
- 기존에는 모든 아이템에 핸들이 항상 표시되어 있었으나, UX 개선을 위해 **클릭 시에만 핸들 표시** 요구사항 추가

### 핵심 컴포넌트
- **`DraggableItem.tsx`**: 모든 스크랩 아이템(스티커, 링크카드, 이미지 등)에 대한 드래그, 리사이즈, 회전, 삭제 기능 제공
- **`DesktopApp.tsx`**: 메인 컨테이너로, 아이템 선택 상태 관리 및 배경 클릭 처리
- **`useItemHandlers.ts`**: 아이템 생성 및 스폰 로직

---

## 초기 요구사항

### 기능 요구사항
1. ✅ **스티커 드래그 앤 드롭**: `UIPanel.tsx`에서 스티커를 드래그하여 캔버스에 추가
2. ✅ **핸들 표시/숨김**: 평소에는 숨김, 클릭 시 표시, 배경 클릭 시 숨김
3. ✅ **4개 핸들 제공**:
   - 드래그 핸들 (좌상단): 이동
   - 삭제 핸들 (우상단): 삭제
   - 회전 핸들 (좌하단): 회전
   - 리사이즈 핸들 (우하단): 크기 조절
4. ✅ **동적 핸들 크기**: 작은 아이템(150px 미만)은 작은 핸들(24px), 큰 아이템은 큰 핸들(40px)
5. ✅ **경계 제한**: 스티커/링크카드가 화면 밖으로 나가지 않도록 제한

---

## 발견된 문제들

### 1. 스티커 크기 문제 ❌

**증상**:
- 사용자: "스티커가 엄청 크게 붙어버려"
- 초기 스티커가 화면의 절반을 차지할 정도로 큼

**원인**:
```typescript
// hooks/useItemHandlers.ts (초기 코드)
const estimateBoxFor = (type: ScrapType) => {
  if (type === ScrapType.STICKER) {
    return { w: 50, h: 50 }; // 기본 50x50
  }
  // ...
};

const spawnItem = (...) => {
  const scale = 0.5; // 모든 아이템에 0.5 스케일 적용
  // 실제 크기: 50 * 0.5 = 25px → 너무 작음
};
```

**해결**:
1. `estimateBoxFor`를 `60x60`으로 조정
2. 스티커 타입은 `scale: 1.0` 적용
3. `newItem` 객체에 `w`, `h` 속성 명시적 할당

```typescript
// 수정 후
const estimateBoxFor = (type: ScrapType) => {
  if (type === ScrapType.STICKER || type === ScrapType.TAPE) {
    return { w: 60, h: 60 };
  }
  // ...
};

const scale = type === ScrapType.STICKER || type === ScrapType.TAPE ? 1.0 : 0.5;

const newItem: ScrapItem = {
  // ...
  w: boxW, // ✅ 명시적 할당
  h: boxH,
};
```

---

### 2. 핸들이 작동하지 않음 ❌

**증상**:
- 사용자: "크기 조절이나 회전이 안돼"
- 핸들을 클릭해도 아무 반응 없음
- 콘솔에 `DesktopApp.tsx:729 📄 다이어리 배경 클릭` 로그만 나타남

**원인 분석**:

#### 2-1. 이벤트 버블링 문제
```typescript
// DesktopApp.tsx (문제 코드)
<div onMouseDown={(e) => {
  // ❌ 핸들 클릭도 여기서 가로챔
  const target = e.target as HTMLElement;
  
  // 배경 클릭 처리
  if (e.target === e.currentTarget) {
    setSelectedItemId(null);
  }
}}>
  {/* DraggableItem 렌더링 */}
</div>
```

**DraggableItem의 핸들 이벤트가 부모(`DesktopApp`)까지 전파되어 가로채짐**

#### 2-2. `onPointerDownCapture` 충돌
```typescript
// DraggableItem.tsx (문제 코드)
<div
  onPointerDownCapture={(e) => {
    // ❌ 이벤트 캡처 단계에서 가로챔
    handlePointerDown(e);
  }}
>
  <div 
    onPointerDown={(e) => {
      // ❌ 여기까지 도달하지 못함
      handleRotateDown(e);
    }}
  >
    {/* 회전 핸들 */}
  </div>
</div>
```

**부모의 `onPointerDownCapture`가 자식의 `onPointerDown`보다 먼저 실행되어 이벤트 차단**

**해결**:

1. **핸들에 `data-handle-type` 속성 추가**:
```typescript
// DraggableItem.tsx
<div
  data-handle-type="rotate"
  onMouseDown={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleRotateDown(e);
  }}
>
  {/* 회전 핸들 */}
</div>
```

2. **DesktopApp에서 핸들 클릭 감지 후 무시**:
```typescript
// DesktopApp.tsx
onMouseDown={(e) => {
  const target = e.target as HTMLElement;
  
  // ✅ 핸들 클릭인 경우 DesktopApp 핸들러 무시
  const handleType = target.closest('[data-handle-type]')?.getAttribute('data-handle-type');
  if (handleType === 'rotate' || handleType === 'resize') {
    return;
  }
  
  // 배경 클릭 처리
  // ...
}
```

3. **핸들 이벤트를 `onPointerDown` → `onMouseDown` + `onTouchStart`로 변경**:
```typescript
// DraggableItem.tsx
<div
  data-handle-type="resize"
  onMouseDown={(e) => { /* 마우스 */ }}
  onTouchStart={(e) => { /* 터치 */ }}
>
```

---

### 3. `setPointerCapture` 에러 ❌

**증상**:
```
Uncaught DOMException: Failed to execute 'setPointerCapture' on 'Element': 
No active pointer with the given id is found.
```

**원인**:
```typescript
// DraggableItem.tsx (문제 코드)
const handleResizeDown = (e: React.PointerEvent) => {
  // ...
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
  // ❌ MouseEvent에는 pointerId가 없음!
};
```

`onMouseDown`은 `MouseEvent`를 전달하는데, `MouseEvent`에는 `pointerId` 속성이 없음 (`PointerEvent`에만 존재)

**해결**:
```typescript
// 수정 후
const handleResizeDown = (e: React.MouseEvent | React.TouchEvent) => {
  // ...
  try {
    if ('pointerId' in e && e.pointerId != null) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  } catch (err) {
    console.warn("Failed to setPointerCapture:", err);
  }
};
```

---

### 4. 핸들이 클릭해도 나타나지 않음 ❌

**증상**:
- 사용자: "클릭해도 핸들이 나타나지 않아"
- 콘솔: `isSelected: false` (항상 false)

**원인**:

#### 4-1. `onClick` 이벤트 전파 차단
```typescript
// DraggableItem.tsx (문제 코드)
<div
  onPointerDownCapture={(e) => {
    // ❌ 이벤트를 여기서 소비
    handlePointerDown(e);
  }}
>
  {/* onClick이 실행되지 않음 */}
</div>
```

#### 4-2. 배경 클릭이 선택을 즉시 해제
```typescript
// DesktopApp.tsx (문제 코드)
onMouseDown={(e) => {
  // ✅ DraggableItem onClick: onSelect(itemId) 실행
  // ❌ 즉시 DesktopApp onMouseDown 실행: setSelectedItemId(null)
  
  if (e.target === e.currentTarget) {
    setSelectedItemId(null); // 즉시 해제!
  }
}
```

**이벤트 순서**:
1. `DraggableItem onClick` → `onSelect(itemId)` 호출
2. 이벤트 버블링 → `DesktopApp onMouseDown` 실행
3. `setSelectedItemId(null)` → 선택 해제
4. **결과**: 선택되자마자 해제됨

**해결**:

1. **`onClick` 핸들러 명시적 추가**:
```typescript
// DraggableItem.tsx
<div
  onClick={(e) => {
    e.stopPropagation(); // ✅ 버블링 차단
    onSelect?.(item.id);
  }}
>
```

2. **배경 클릭 조건 수정**:
```typescript
// DesktopApp.tsx
onMouseDown={(e) => {
  const target = e.target as HTMLElement;
  const isScrapItem = !!target.closest('[data-scrap-item]');
  
  // ✅ 스크랩 아이템이 아닌 곳 클릭 시만 선택 해제
  if (!isScrapItem && selectedItemId) {
    setSelectedItemId(null);
  }
}
```

---

### 5. 리사이즈 핸들이 스티커에 나타나지 않음 ❌

**증상**:
- 회전, 삭제 핸들은 작동하지만 리사이즈 핸들만 보이지 않음

**원인**:
```typescript
// DraggableItem.tsx (문제 코드)
{/* Resize Handle (Bottom Right) - 스티커는 숨김 */}
{!isStickerType && ( // ❌ 스티커는 리사이즈 핸들 제외
  <div data-handle-type="resize">
    {/* 리사이즈 핸들 */}
  </div>
)}
```

이전에 스티커는 리사이즈가 필요 없다고 판단하여 조건부 렌더링을 추가했던 것으로 추정

**해결**:
```typescript
// 수정 후
{/* Resize Handle (Bottom Right) */}
<div data-handle-type="resize">
  {/* 모든 아이템에 리사이즈 핸들 표시 */}
</div>
```

---

### 6. 배경 클릭 시 핸들이 사라지지 않음 ❌

**증상**:
- 다른 스티커 클릭 시 이전 핸들은 사라지지만, 배경 클릭 시에는 핸들이 남아있음

**원인**:
```typescript
// DesktopApp.tsx (문제 코드)
if (!isScrapItem && isBackground) { // ❌ isBackground 조건이 너무 엄격
  setSelectedItemId(null);
}

// isBackground = e.target === e.currentTarget || target.closest('.flex-1.relative') === e.currentTarget
// → 특정 요소만 "배경"으로 인정
```

**로그 분석**:
```
🖱️ 클릭 체크: { isScrapItem: false, isBackground: false }
// isBackground가 false라서 선택 해제 안 됨
```

**해결**:
```typescript
// 수정 후
if (!isScrapItem && selectedItemId) {
  // ✅ 스크랩 아이템이 아닌 모든 곳 클릭 시 선택 해제
  setSelectedItemId(null);
}
```

---

### 7. 경계 제한 문제 (진행 중) ⚠️

**증상**:
- 스티커는 오른쪽으로만 화면 밖으로 나감
- 링크카드는 상하좌우 모두 화면 밖으로 나감

**원인 분석**:

#### 7-1. `w`, `h`가 `undefined`
```
🔲 일반 모드 경계: { w: undefined, h: undefined, actualW: 90.5 }
```
링크카드의 `w`, `h` 속성이 `newItem` 생성 시 할당되지 않음

#### 7-2. `scale()` 중앙 기준 확대 미고려
```typescript
// 문제 코드
const maxX = 1400 - itemWidth; // ❌ 좌상단 기준으로만 계산
```

**CSS `transform: scale()`의 동작 방식**:
- 중앙(`transform-origin: center center`)을 기준으로 확대/축소
- 예: 60px 아이템을 `scale(1.76)` → 실제 크기 105.6px
  - 좌측으로 `(105.6 - 60) / 2 = 22.8px` 확장
  - 우측으로도 `22.8px` 확장
  - **좌상단 position은 변하지 않음!**

**따라서**:
```
position.x = 1300 (좌상단 좌표)
baseWidth = 60
scale = 1.76
scaledWidth = 105.6

실제 왼쪽 끝: 1300 - 22.8 = 1277.2
실제 오른쪽 끝: 1300 + 60 + 22.8 = 1382.8 → 화면 밖! (1400px 초과)
```

**해결 (구현 중)**:
```typescript
// DraggableItem.tsx
const scaleOffsetX = (scaledWidth - baseWidth) / 2;
const scaleOffsetY = (scaledHeight - baseHeight) / 2;

const minX = -scaleOffsetX; // 좌측으로 확장된 만큼 허용
const maxX = canvasWidth - baseWidth - scaleOffsetX; // 우측 경계 보정

newX = Math.max(minX, Math.min(maxX, newX));
```

---

## 해결 과정

### Phase 1: 스티커 크기 조정 (완료 ✅)
1. `estimateBoxFor` 수정: `50x50` → `60x60`
2. `spawnItem`의 `scale` 수정: `0.5` → `1.0` (스티커/테이프만)
3. `newItem` 객체에 `w`, `h` 명시적 할당

### Phase 2: 핸들 이벤트 수정 (완료 ✅)
1. 핸들에 `data-handle-type` 속성 추가
2. `DesktopApp`에서 핸들 클릭 감지 및 무시 로직 추가
3. `onPointerDown` → `onMouseDown` + `onTouchStart` 변경
4. `setPointerCapture` 안전 처리 (`try-catch` + `pointerId` 체크)

### Phase 3: 핸들 표시/숨김 로직 수정 (완료 ✅)
1. `DraggableItem`에 `onClick` 핸들러 추가
2. `DesktopApp`의 배경 클릭 조건 단순화 (`isScrapItem` 체크만)
3. `showHandles` 조건: `isSelected`만 사용

### Phase 4: 동적 핸들 크기 (완료 ✅)
1. `itemWidth`, `itemHeight`, `actualWidth`, `actualHeight` 계산
2. `isSmallItem` 조건: `actualWidth < 150 && actualHeight < 150`
3. `handleSize`: 작은 아이템 `6` (24px), 큰 아이템 `10` (40px)

### Phase 5: 경계 제한 (진행 중 ⚠️)
1. `w`, `h` undefined 처리 (링크카드 `420x360` 추정)
2. `scale()` offset 계산 로직 추가
3. 경계 조건 수정 (테스트 대기 중)

---

## 최종 구현

### 핸들 시스템 아키텍처

```
┌─────────────────────────────────────────┐
│          DesktopApp.tsx                 │
│  - selectedItemId: string | null       │
│  - onMouseDown: 배경 클릭 감지         │
│    └─> !isScrapItem → setSelectedId(null)│
└─────────────────────────────────────────┘
                  │
                  │ props
                  ↓
┌─────────────────────────────────────────┐
│        DraggableItem.tsx                │
│  - isSelected: boolean (prop)           │
│  - onClick: onSelect(item.id)           │
│  - showHandles = isSelected             │
│                                         │
│  [Handles] (4개)                        │
│  ├─ Drag (좌상단)                       │
│  ├─ Delete (우상단)                     │
│  ├─ Rotate (좌하단) - data-handle-type  │
│  └─ Resize (우하단) - data-handle-type  │
└─────────────────────────────────────────┘
```

### 이벤트 흐름

```
사용자 클릭 (스티커)
    │
    ↓
DraggableItem onClick
    │
    ├─> e.stopPropagation() ✅
    └─> onSelect(item.id)
         │
         ↓
    DesktopApp: setSelectedItemId(id)
         │
         ↓
    DraggableItem 리렌더: isSelected = true
         │
         ↓
    showHandles = true → 핸들 표시
```

```
사용자 클릭 (배경)
    │
    ↓
DesktopApp onMouseDown
    │
    ├─> isScrapItem? → false ✅
    └─> setSelectedItemId(null)
         │
         ↓
    DraggableItem 리렌더: isSelected = false
         │
         ↓
    showHandles = false → 핸들 숨김
```

```
사용자 클릭 (핸들)
    │
    ↓
DesktopApp onMouseDown
    │
    ├─> data-handle-type 체크 ✅
    └─> return (무시)
         │
         ↓
DraggableItem 핸들 이벤트
    │
    ├─> onMouseDown
    ├─> e.preventDefault()
    ├─> e.stopPropagation()
    └─> handleRotateDown() / handleResizeDown()
```

### 주요 코드 스니펫

#### 1. DraggableItem.tsx - 핸들 렌더링
```typescript
// 핸들 표시 조건
const showHandles = isSelected;

// 동적 핸들 크기
const itemScale = item.position.scale || 1;
const actualWidth = itemWidth * itemScale;
const actualHeight = itemHeight * itemScale;
const isSmallItem = actualWidth < 150 && actualHeight < 150;
const handleSize = isSmallItem ? 6 : 10;

// 회전 핸들
<div 
  data-handle-type="rotate"
  onMouseDown={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleRotateDown(e as any);
  }}
  onTouchStart={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleRotateDown(e as any);
  }}
  className={`... ${showHandles ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
  style={{ 
    pointerEvents: showHandles ? 'auto' : 'none',
    width: `${handleSize * 4}px`,
    height: `${handleSize * 4}px`,
    // ...
  }}
>
  {/* SVG 아이콘 */}
</div>
```

#### 2. DesktopApp.tsx - 배경 클릭 처리
```typescript
onMouseDown={(e) => {
  const target = e.target as HTMLElement;
  
  // 핸들 클릭 무시
  const handleType = target.closest('[data-handle-type]')?.getAttribute('data-handle-type');
  if (handleType === 'rotate' || handleType === 'resize') {
    return;
  }
  
  // 스크랩 아이템이 아닌 곳 클릭 시 선택 해제
  const isScrapItem = !!target.closest('[data-scrap-item]');
  if (!isScrapItem && selectedItemId) {
    setSelectedItemId(null);
  }
  
  // ...
}}
```

#### 3. DraggableItem.tsx - 경계 체크 (진행 중)
```typescript
// w, h undefined 처리
let baseWidth = item.w;
let baseHeight = item.h;

if (!baseWidth || !baseHeight) {
  const isLinkCard = ['twitter', 'instagram', 'youtube', ...].includes(item.type);
  baseWidth = baseWidth || (isLinkCard ? 420 : 100);
  baseHeight = baseHeight || (isLinkCard ? 360 : 100);
}

// scale offset 계산
const currentScale = item.position.scale || 1;
const scaledWidth = baseWidth * currentScale;
const scaledHeight = baseHeight * currentScale;
const scaleOffsetX = (scaledWidth - baseWidth) / 2;
const scaleOffsetY = (scaledHeight - baseHeight) / 2;

// 경계 제한
const minX = -scaleOffsetX;
const maxX = canvasWidth - baseWidth - scaleOffsetX;

newX = Math.max(minX, Math.min(maxX, newX));
```

---

## 교훈 및 권장사항

### 1. 이벤트 전파 관리의 중요성 ⚠️

**문제**: 부모와 자식 컴포넌트에서 동일한 이벤트를 처리할 때, 의도하지 않은 동작 발생

**교훈**:
- `e.stopPropagation()`을 명시적으로 호출하여 이벤트 버블링 제어
- `onPointerDownCapture` 대신 `onPointerDown` 사용 (필요한 경우만 캡처 단계 사용)
- 부모에서 자식 요소를 감지할 때는 `closest()` 활용

**권장사항**:
```typescript
// ❌ 나쁜 예
<Parent onMouseDown={handleParent}>
  <Child onMouseDown={handleChild} />
</Parent>

// ✅ 좋은 예
<Parent onMouseDown={(e) => {
  if (e.target.closest('[data-child]')) return; // 자식 요소 무시
  handleParent(e);
}}>
  <Child data-child onMouseDown={(e) => {
    e.stopPropagation(); // 부모로 전파 차단
    handleChild(e);
  }} />
</Parent>
```

---

### 2. PointerEvent vs MouseEvent vs TouchEvent 🖱️

**문제**: `onPointerDown`에서 `onMouseDown`으로 변경 후 `setPointerCapture` 에러 발생

**교훈**:
- `PointerEvent`만 `pointerId` 속성 보유
- `MouseEvent`, `TouchEvent`는 `pointerId` 없음
- 이벤트 타입에 따라 사용 가능한 API 다름

**권장사항**:
```typescript
// ✅ 안전한 setPointerCapture 사용
const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
  try {
    if ('pointerId' in e && e.pointerId != null) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  } catch (err) {
    console.warn("setPointerCapture failed:", err);
  }
};
```

---

### 3. CSS Transform과 위치 계산 📐

**문제**: `transform: scale()`이 중앙 기준이라는 점을 고려하지 않아 경계 계산 오류

**교훈**:
- `transform: scale()`은 `transform-origin` 기준으로 확대/축소
- `position` 좌표는 변하지 않음 (좌상단 기준)
- 경계 계산 시 스케일 offset 반드시 고려

**권장사항**:
```typescript
// ✅ 올바른 경계 계산
const scaleOffset = (scaledSize - baseSize) / 2;
const minPos = -scaleOffset; // 좌측/상단으로 확장된 만큼 허용
const maxPos = canvasSize - baseSize - scaleOffset; // 우측/하단 경계 보정
```

---

### 4. 타입 안전성과 Fallback 값 🛡️

**문제**: `item.w`, `item.h`가 `undefined`인 경우 경계 계산 실패

**교훈**:
- Optional 속성은 항상 fallback 값 제공
- 타입 추론만 믿지 말고 런타임에서도 검증

**권장사항**:
```typescript
// ✅ 안전한 fallback
const baseWidth = item.w || (isLinkCard ? 420 : 100);

// 또는 타입 가드 사용
if (!item.w || !item.h) {
  // 추정 로직
}
```

---

### 5. 디버깅 로그의 중요성 🔍

**문제**: 사용자가 "작동하지 않아"라고만 말하면 원인 파악 어려움

**교훈**:
- 핵심 로직에는 디버그 로그 추가
- 로그에는 충분한 컨텍스트 포함 (변수 값, 조건 결과 등)
- 문제 해결 후 불필요한 로그는 제거

**권장사항**:
```typescript
// ✅ 유용한 디버그 로그
console.log('🔲 경계 체크:', { 
  itemType: item.type, 
  baseW: baseWidth, 
  scale: currentScale, 
  actualW: scaledWidth, 
  maxX, 
  beforeX: newX 
});
```

---

### 6. 점진적 구현과 테스트 🧪

**문제**: 한 번에 여러 기능을 수정하면 어디서 문제가 생겼는지 파악 어려움

**교훈**:
- 한 번에 하나의 문제만 해결
- 각 수정 후 즉시 테스트
- 이전 수정 사항이 새로운 문제를 일으키는지 확인

**권장사항**:
1. 문제 정의 → 가설 수립
2. 최소한의 코드 수정
3. 테스트 및 검증
4. 다음 문제로 진행

---

### 7. 캐싱 문제 대응 💾

**문제**: 코드 수정이 반영되지 않아 사용자 혼란 초래

**교훈**:
- Electron 앱은 브라우저보다 aggressive caching
- 개발 모드에서는 캐시 비활성화 필수
- HMR(Hot Module Replacement) 신뢰하지 말고 전체 리로드

**해결책**:
```typescript
// electron/main.ts
if (!app.isPackaged) {
  overlayWin.webContents.session.clearCache();
  overlayWin.webContents.session.clearStorageData({
    storages: ['cookies', 'localstorage', 'sessionstorage']
  });
}

// vite.config.mts
export default {
  server: {
    headers: {
      'Cache-Control': 'no-store'
    }
  }
}
```

---

## 결론

### 성과 ✅
- ✅ 스티커 크기 정상화 (60x60)
- ✅ 4개 핸들 모두 정상 작동 (드래그, 삭제, 회전, 리사이즈)
- ✅ 핸들 표시/숨김 로직 완성 (클릭 시 표시, 배경 클릭 시 숨김)
- ✅ 동적 핸들 크기 구현 (작은 아이템 24px, 큰 아이템 40px)
- ⚠️ 경계 제한 (테스트 대기 중)

### 남은 작업 📋
1. 경계 제한 테스트 및 최종 검증
2. 디버그 로그 제거 (프로덕션 배포 전)
3. 다른 아이템 타입(이미지, 텍스트 등)에도 동일 로직 적용 확인
4. 모바일 환경에서 터치 이벤트 테스트

### 향후 개선사항 💡
1. **핸들 애니메이션**: 페이드 인/아웃 효과 추가
2. **키보드 단축키**: `Delete` 키로 삭제, 화살표 키로 미세 조정
3. **다중 선택**: `Shift` + 클릭으로 여러 아이템 동시 선택
4. **스냅 가이드**: 다른 아이템과 정렬 시 가이드 라인 표시
5. **실행 취소/다시 실행**: 히스토리 스택 구현

---

**문서 버전**: 1.0  
**최종 수정**: 2026-01-31  
**작성자**: AI Assistant (Claude Sonnet 4.5)



