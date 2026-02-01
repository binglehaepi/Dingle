# 스티커 크기 및 핸들 구현 보고서

## 날짜
2026-01-31

## 문제 상황
1. 스티커가 추가될 때 너무 크게 표시됨 (100px 고정 크기)
2. 회전/리사이즈 핸들이 작동하지 않음
3. 스티커가 캔버스 오른쪽으로 빠져나감
4. 스티커에 리사이즈 핸들이 표시됨 (불필요)

---

## 해결 과정

### 1단계: 스티커 크기 문제 진단

**문제 원인:**
- `hooks/useItemHandlers.ts`에서 스티커를 60x60으로 생성
- 하지만 `components/items/StickerObject.tsx`에서 100px 고정 크기로 렌더링

**파일 경로:**
```
hooks/useItemHandlers.ts (Line 407-415)
  └─> estimateBoxFor() 함수: 스티커 크기 정의
  └─> spawnItem() 함수: 아이템 생성

components/items/StickerObject.tsx (Line 26-27)
  └─> 이모지: fontSize: 100px 고정
  └─> 이미지: max-w-full (부모 크기 미정의)

components/ItemRenderer.tsx (Line 81-82)
  └─> StickerObject에 width/height props 전달 안 함
```

**해결 방법:**
1. `StickerObject.tsx`: `width`, `height` props 추가
2. `ItemRenderer.tsx`: `item.w`, `item.h`를 props로 전달
3. `estimateBoxFor()`: 60x60 크기로 설정
4. `spawnItem()`: scale = 1.0 설정

**수정된 파일:**
- `hooks/useItemHandlers.ts`
- `components/items/StickerObject.tsx`
- `components/ItemRenderer.tsx`
- `components/items/TapeObject.tsx` (동일 로직 적용)

---

### 2단계: 핸들 작동 문제 해결

**문제 원인:**
이벤트 전파 순서 문제로 핸들 클릭이 부모 핸들러에 의해 차단됨

```
이벤트 전파 순서:
1. DesktopApp onMouseDown (Capture)
2. DraggableItem onPointerDownCapture (Capture)
3. 핸들 onPointerDown (Target) ← 실행 안 됨!
```

**해결 과정:**

#### 시도 1: 핸들에 `data-handle-type` 속성 추가
```typescript
// components/DraggableItem.tsx
<div data-handle-type="rotate" ...>  // 회전 핸들
<div data-handle-type="resize" ...>  // 리사이즈 핸들
```

#### 시도 2: 부모 핸들러에서 핸들 클릭 감지
```typescript
// components/DraggableItem.tsx (Line 155-167)
const handlePointerDown = (e: React.PointerEvent) => {
  const target = e.target as HTMLElement;
  const handleType = target.closest('[data-handle-type]')?.getAttribute('data-handle-type');
  if (handleType === 'rotate' || handleType === 'resize') {
    return; // 핸들 클릭은 무시
  }
  // ... 기존 로직
}

// components/DesktopApp.tsx (Line 647-654)
onMouseDown={(e) => {
  const target = e.target as HTMLElement;
  const handleType = target.closest('[data-handle-type]')?.getAttribute('data-handle-type');
  if (handleType === 'rotate' || handleType === 'resize') {
    return; // 핸들 클릭은 무시
  }
  // ... 기존 로직
}
```

#### 시도 3: `onPointerDownCapture` → `onMouseDown` 변경
`onPointerDownCapture`는 부모에서 먼저 실행되어 자식까지 도달하지 못함.
`onMouseDown`과 `onTouchStart`로 변경하여 해결.

```typescript
// components/DraggableItem.tsx (Line 648-670, 724-746)
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
>
```

#### 시도 4: `setPointerCapture` 에러 수정
`MouseEvent`에는 `pointerId`가 없어서 에러 발생.

```typescript
// components/DraggableItem.tsx (Line 230-253, 255-278)
const handleResizeDown = (e: React.PointerEvent | React.MouseEvent) => {
  // Capture pointer for smooth touch tracking (only for PointerEvent)
  if ('pointerId' in e && e.pointerId != null) {
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch (err) {
      // Ignore if pointer capture fails
    }
  }
  // ... 기존 로직
}
```

**수정된 파일:**
- `components/DraggableItem.tsx`
- `components/DesktopApp.tsx`

---

### 3단계: 경계 제한 문제 해결

**문제 원인:**
스티커 크기(60x60)를 고려하지 않고 position.x만 체크

**해결 방법:**
`maxX = 캔버스 너비 - 스티커 너비`로 수정

```typescript
// components/DraggableItem.tsx (Line 386-420)

// 일반 모드 (월간뷰)
const maxX = 1340; // SPREAD_WIDTH(1400) - 스티커 너비(60)
const maxY = 760;  // DESIGN_HEIGHT(820) - 스티커 높이(60)

// 스크랩 모드
const maxX = 1040; // 캔버스 너비(1100) - 스티커 너비(60)
const maxY = 760;
```

**수정된 파일:**
- `components/DraggableItem.tsx`

---

### 4단계: 스티커 리사이즈 핸들 숨김

**문제:**
스티커에는 리사이즈 핸들이 불필요함

**해결 방법:**
```typescript
// components/DraggableItem.tsx (Line 724-725)
{/* Resize Handle (Bottom Right) - 스티커는 숨김 */}
{!isStickerType && (
  <div data-handle-type="resize" ...>
  ...
  </div>
)}
```

**수정된 파일:**
- `components/DraggableItem.tsx`

---

## 핵심 파일 및 함수

### 1. 스티커 크기 정의
```
hooks/useItemHandlers.ts
  └─> estimateBoxFor(type, platform)
      - 스티커/테이프: { w: 60, h: 60 }
      - 링크카드: platform별로 다름
  └─> spawnItem(type, metadata, opts)
      - 스티커 scale: 1.0
      - 일반 아이템 scale: 0.5
```

### 2. 스티커 렌더링
```
components/ItemRenderer.tsx
  └─> case ScrapType.STICKER:
      return <StickerObject data={...} width={item.w} height={item.h} />

components/items/StickerObject.tsx
  └─> props: { data, width, height }
  └─> 이모지: fontSize = Math.min(width, height) * 0.8
  └─> 이미지: width, height 직접 적용
```

### 3. 핸들 이벤트
```
components/DraggableItem.tsx
  └─> handleRotateDown(e: React.PointerEvent | React.MouseEvent)
  └─> handleResizeDown(e: React.PointerEvent | React.MouseEvent)
  └─> 핸들 JSX:
      - onMouseDown: 데스크톱
      - onTouchStart: 모바일
```

### 4. 경계 체크
```
components/DraggableItem.tsx
  └─> useEffect(() => { handlePointerMove() })
      └─> Boundary Check (Line 386-420)
          - isStickerType 체크
          - snapToGrid 모드 분기
          - maxX, maxY 계산 (스티커 크기 고려)
```

---

## 다른 아이템 타입에 적용하기

### 링크카드 및 일반 사진에도 동일 로직 적용 필요

**현재 상태:**
- 스티커/테이프: ✅ 크기 제한 적용됨
- 링크카드: ❌ 경계 제한 없음
- 일반 사진: ❌ 경계 제한 없음

**적용 방법:**

#### 1. 경계 체크 로직 수정
```typescript
// components/DraggableItem.tsx (Line 391-420)

// 현재: isStickerType만 체크
const isStickerType = item.type === 'sticker' || item.type === 'tape';

// 변경: 모든 아이템 타입 체크
const needsBoundary = 
  item.type === 'sticker' || 
  item.type === 'tape' || 
  item.type === 'link' ||
  item.type === 'image' ||
  item.type === 'photo';

// 아이템 크기 가져오기
const itemWidth = item.w || 100;
const itemHeight = item.h || 100;

// 경계 계산
const maxX = canvasWidth - itemWidth;
const maxY = canvasHeight - itemHeight;
```

#### 2. 핸들 크기 조정
```typescript
// components/DraggableItem.tsx (Line 76-77)

// 현재: 스티커만 작은 핸들
const isStickerType = item.type === 'sticker' || item.type === 'tape';
const handleSize = isStickerType ? 6 : 10;

// 변경: 작은 아이템은 작은 핸들
const isSmallItem = (item.w || 100) < 150 && (item.h || 100) < 150;
const handleSize = isSmallItem ? 6 : 10;
```

#### 3. 리사이즈 핸들 표시 조건
```typescript
// components/DraggableItem.tsx (Line 725)

// 현재: 스티커만 숨김
{!isStickerType && (
  <div data-handle-type="resize" ...>
)}

// 변경: 리사이즈 불가능한 아이템 숨김
const canResize = item.type !== 'sticker' && item.type !== 'tape';
{canResize && (
  <div data-handle-type="resize" ...>
)}
```

---

## 테스트 체크리스트

### 스티커
- [x] 60x60 크기로 추가됨
- [x] 회전 핸들 작동
- [x] 리사이즈 핸들 숨김
- [x] 오른쪽 경계 제한 (x ≤ 1340)
- [x] 아래쪽 경계 제한 (y ≤ 760)
- [x] 작은 핸들 표시 (24px)

### 링크카드 (적용 필요)
- [ ] 경계 제한 적용
- [ ] 리사이즈 핸들 작동
- [ ] 회전 핸들 작동

### 일반 사진 (적용 필요)
- [ ] 경계 제한 적용
- [ ] 리사이즈 핸들 작동
- [ ] 회전 핸들 작동

---

## 참고 상수

```typescript
// constants/appConstants.ts
SPREAD_WIDTH = 1400  // 월간뷰 전체 너비
PAGE_WIDTH = 700     // 한 페이지 너비
DESIGN_HEIGHT = 820  // 캔버스 높이

// 스크랩 모드
SCRAP_CANVAS_WIDTH = 1100
```

---

## 결론

스티커 크기 및 핸들 문제는 다음 단계로 해결됨:
1. 렌더링 크기 수정 (StickerObject)
2. 이벤트 전파 수정 (onMouseDown)
3. 경계 계산 수정 (스티커 크기 고려)
4. 리사이즈 핸들 숨김 (조건부 렌더링)

동일한 로직을 링크카드 및 일반 사진에도 적용해야 함.


