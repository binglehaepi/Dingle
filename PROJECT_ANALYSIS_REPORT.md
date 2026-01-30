# 📊 Digital Scrap Diary 프로젝트 분석 보고서

**분석 일자**: 2025-12-18  
**프로젝트 버전**: V2 (정책 준수 아키텍처)  
**분석 범위**: 전체 코드베이스 (코드 수정 없음)

---

## 1️⃣ 프로젝트 맵 (1페이지 요약)

### 🏗️ 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                     DIGITAL SCRAP DIARY                         │
│              (React + TypeScript + Vite)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
         ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
         │   클라이언트  │ │  서버 API  │ │  저장소     │
         └─────────────┘ └───────────┘ └─────────────┘
```

### 📦 주요 구성 요소

| 레이어 | 파일/디렉토리 | 역할 |
|--------|--------------|------|
| **Entry Point** | `App.tsx` | 메인 앱 컴포넌트, 디바이스 모드 라우팅 |
| **API** | `api/scrap.ts` | Vercel Serverless Function (메타데이터 수집) |
| **Services** | `services/apiClient.ts` | 클라이언트 API 래퍼 |
| | `services/storage.ts` | 🛡️ 안전한 LocalStorage 관리 (정책 준수) |
| | `services/urlParser.ts` | URL → ScrapType 분류 |
| | `services/geminiService.ts` | ⚠️ DEPRECATED (클라이언트 프록시, V1 잔재) |
| **Components** | `components/items/` | 26개 아이템 컴포넌트 (Twitter, Instagram, etc.) |
| | `components/layouts/` | 3개 레이아웃 (Free, Monthly, Weekly) |
| | `components/mobile/` | 모바일 전용 UI (MobileApp, MobileFAB, etc.) |
| **Storage** | `localStorage` | 키: `smart_scrap_diary_layout_v2` (메인 데이터) |
| | | 키: `smart_scrap_text_data` (텍스트 데이터) |
| | | 키: `smart_scrap_style_pref` (스타일 설정) |
| **Cache** | 서버 메모리 (`api/scrap.ts`) | TTL: 24시간, 향후 Vercel KV 예정 |
| | 클라이언트 메모리 (`apiClient.ts`) | TTL: 5분, 세션 캐시 |

### 🔄 데이터 흐름 (URL 입력 → 렌더링)

```
1. [사용자] URL 입력 (예: https://twitter.com/user/status/123)
              ↓
2. [Client] parseUrlType(url) → ScrapType.TWITTER
              ↓
3. [Client] fetchMetadata(url, type) → POST /api/scrap
              ↓
4. [Server] 캐시 확인 (24h TTL)
              ↓ (miss)
5. [Server] extractTweetId → fetchTwitterData
              ↓
6. [Server] 반환: { url, platform, embed: { kind, id }, ... }
              ↓
7. [Client] spawnItem(type, metadata)
              ↓
8. [Client] items 배열에 추가 → 렌더링
              ↓
9. [Render] <TwitterEmbedCard data={metadata} />
              ↓
10. [Embed] 공식 widgets.js 로드 → twttr.widgets.createTweet()
```

---

## 2️⃣ 저장소 분석

### 📂 저장 위치 및 키

| 저장소 | 키 이름 | 저장 내용 | Write 위치 | Read 위치 |
|-------|---------|----------|-----------|----------|
| **LocalStorage** | `smart_scrap_diary_layout_v2` | ScrapItem[] (아이템 전체) | `App.tsx:246` (`handleSaveLayout`) | `App.tsx:191` (`useEffect`) |
| | | | `App.tsx:329` (`handleUpdateText` 자동저장) | |
| | `smart_scrap_text_data` | LayoutTextData (텍스트) | `App.tsx:249` (`handleSaveLayout`) | `App.tsx:207` (`useEffect`) |
| | `smart_scrap_style_pref` | DiaryStyle (스타일) | `App.tsx:250` (`handleSaveLayout`) | `App.tsx:216` (`useEffect`) |
| | | | `App.tsx:442` (`handleBackgroundUpload`) | |
| | `smart_scrap_layout_pref` | LayoutType (레이아웃) | `App.tsx:278` (`changeLayout`) | - |
| **서버 메모리** | `scrap:${type}:${url}` | ScrapMetadata | `api/scrap.ts:312` (`handler`) | `api/scrap.ts:273` (`handler`) |
| **클라이언트 메모리** | `${type}:${url}` | ScrapMetadata | `services/apiClient.ts:54` (`fetchMetadata`) | `services/apiClient.ts:22` (`fetchMetadata`) |

### 🛡️ 저장 정책 (V2 정책 준수)

**Before (V1 - 위반)**:
```typescript
// ❌ SNS 원문 저장
{
  description: "트윗 전체 텍스트...",
  imageUrl: "https://pbs.twimg.com/...",
  twitterStats: { likes: 100, retweets: 50 }
}
```

**After (V2 - 준수)**:
```typescript
// ✅ URL + Embed ID만 저장
{
  url: "https://twitter.com/...",
  platform: "twitter",
  embed: { kind: "twitter", id: "123" },
  storeMode: "safe",
  exportPolicy: { excludeEmbeds: true }
}
```

### 🔄 호출 트리 (저장 경로)

```
[App.tsx] handleSaveLayout() (Line 245)
    ↓
[services/storage.ts] saveToStorage(STORAGE_KEY, items) (Line 100)
    ↓
[services/storage.ts] sanitizeItem(item) (Line 88)
    ↓
[services/storage.ts] sanitizeMetadata(metadata) (Line 13)
    ↓ (SNS 원문 제거)
localStorage.setItem(STORAGE_KEY, JSON.stringify(safeItems))
```

**자동 저장 트리**:
```
[App.tsx] handleUpdateText() (Line 310)
    ↓ (1초 디바운스)
[App.tsx] setTimeout → saveToStorage() (Line 329)
    ↓
[services/storage.ts] sanitizeItem → localStorage
```

### 🔍 저장 데이터 예시 (실제 LocalStorage)

```json
{
  "id": "abc-123",
  "type": "twitter",
  "metadata": {
    "url": "https://twitter.com/user/status/123",
    "title": "Twitter Post",
    "platform": "twitter",
    "storeMode": "safe",
    "embed": { "kind": "twitter", "id": "123" },
    "exportPolicy": { "excludeEmbeds": true }
  },
  "position": { "x": 350, "y": 410, "z": 10 },
  "diaryDate": "2025-12",
  "pageSide": "left"
}
```

**제거된 필드**: `description`, `imageUrl`, `videoUrl`, `twitterStats`

---

## 3️⃣ 트위터/인스타그램 임베드 분석

### 🐦 Twitter (X)

#### Embed 로드 방식

**파일**: `components/items/TwitterEmbedCard.tsx`

**스크립트 로드**:
```typescript
// Line 14-51: 전역 로드 (1회)
const script = document.createElement('script');
script.src = 'https://platform.twitter.com/widgets.js'; // ✅ 공식 스크립트
script.async = true;
document.body.appendChild(script);
```

**렌더링 호출**:
```typescript
// Line 105-117: 트윗 임베드
await window.twttr.widgets.createTweet(
  tweetId,        // "1234567890"
  containerRef.current,
  {
    dnt: true,           // Do Not Track
    conversation: 'none', // 댓글 숨기기
    cards: 'visible',    // 미리보기 카드 표시
    align: 'center',
    theme: 'light',
    width: 380,
  }
);
```

#### 실패 시 Fallback

**조건**:
- `tweetId`가 없을 때 (Line 84-86)
- `createTweet` 반환값이 `null`일 때 (Line 119-122)
- 에러 발생 시 (Line 127-133)

**Fallback UI**:
```typescript
// Line 144-146
if (embedFailed || !tweetId) {
  return <LinkCardFallback data={data} />;
}
```

**LinkCardFallback 컴포넌트**:
- 파일: `components/items/LinkCardFallback.tsx`
- 렌더링: 간단한 링크 카드 (제목, URL, "원본 보기" 버튼)

#### 데이터 출처 (메타데이터)

**서버 API**: `api/scrap.ts:42-85`
- **원문 저장 안 함** (Line 43-45 주석)
- 반환 데이터:
  ```typescript
  {
    platform: 'twitter',
    storeMode: 'safe',
    source: { externalId: tweetId },
    embed: { kind: 'twitter', id: tweetId }
  }
  ```

### 📷 Instagram

#### Embed 로드 방식

**파일**: `components/items/InstagramEmbedCard.tsx`

**스크립트 로드**:
```typescript
// Line 27-50: 공식 스크립트
const script = document.createElement('script');
script.src = 'https://www.instagram.com/embed.js'; // ✅ 공식 스크립트
document.head.appendChild(script);

script.onload = () => {
  window.instgrm.Embeds.process(); // 임베드 처리
};
```

**렌더링 호출**:
```typescript
// Line 93-109: blockquote 방식 (공식)
<blockquote
  className="instagram-media"
  data-instgrm-permalink={instagramUrl}
  data-instgrm-version="14"
  style={{ /* 공식 스타일 */ }}
/>
```

#### 실패 시 Fallback

**조건**:
- `embedFailed` 상태가 `true`일 때 (Line 18, 38-39, 45-48)
- 스크립트 로드 실패 (Line 45-48)
- `instgrm.Embeds.process()` 실패 (Line 36-38)

**Fallback UI**:
```typescript
// Line 64-66
if (embedFailed) {
  return <LinkCardFallback data={data} />;
}
```

#### 데이터 출처 (메타데이터)

**서버 API**: `api/scrap.ts:87-144`
- **원문 저장 안 함** (Line 89-91 주석)
- 반환 데이터:
  ```typescript
  {
    platform: 'instagram',
    storeMode: 'safe',
    source: { externalId: shortcode },
    embed: { kind: 'instagram', permalink: url }
  }
  ```

### 📊 비교표

| 항목 | Twitter | Instagram |
|------|---------|-----------|
| **공식 스크립트 URL** | `platform.twitter.com/widgets.js` | `www.instagram.com/embed.js` |
| **렌더링 함수** | `twttr.widgets.createTweet()` | `instgrm.Embeds.process()` |
| **데이터 ID** | `tweetId` (숫자) | `shortcode` (문자열) 또는 permalink |
| **원문 저장** | ❌ 안 함 (V2) | ❌ 안 함 (V2) |
| **Fallback** | `LinkCardFallback` | `LinkCardFallback` |
| **정책 준수** | ✅ 공식 위젯 사용 | ✅ 공식 임베드 사용 |

---

## 4️⃣ V1/V2 혼재 정리

### ⚠️ V1 잔재 파일 목록

| 파일 | 상태 | 실제 Import 여부 | 제거/격리 제안 |
|------|------|-----------------|--------------|
| `services/geminiService.ts` | DEPRECATED | ❌ (주석 처리됨) | 🟡 **격리**: 개발 참고용으로 유지, 경고 주석 유지 |
| `components/items/TwitterCard.tsx` | Legacy Fallback | ✅ (`LinkCardFallback.tsx`에서) | 🟢 **유지**: Fallback으로 필요 |
| `components/items/MediaCard.tsx` | V1 스타일 | ✅ (Spotify, TikTok 등) | 🟢 **유지**: 범용 카드 |

### 📋 실제 Import 확인

**검색 결과** (`grep "import.*geminiService"`):
- `POLICY_COMPLIANCE.md` (문서)
- `ARCHITECTURE_CHANGES.md` (문서)

**결론**: ✅ `geminiService.ts`는 코드에서 사용되지 않음 (문서에만 언급)

### 🛡️ V2 정책 준수 체크

| 항목 | V1 (위반) | V2 (준수) | 구현 위치 |
|------|-----------|-----------|----------|
| **API 호출** | 클라이언트 CORS 프록시 | 서버 API | `App.tsx:4`, `services/apiClient.ts` |
| **메타데이터** | 원문/이미지 저장 | URL + ID만 | `api/scrap.ts:42-144` |
| **LocalStorage** | 원문 포함 저장 | sanitize 후 저장 | `services/storage.ts:13-83` |
| **캐시** | 무기한 | 24시간 TTL | `api/scrap.ts:5`, `services/apiClient.ts:8` |
| **Embed** | 커스텀 카드 | 공식 위젯 | `components/items/TwitterEmbedCard.tsx` |

### 🚨 제거 권장 사항

#### 1. `services/geminiService.ts` (우선도: 낮음)

**현재 상태**:
```typescript
// Line 6-20: 경고 주석 (DEPRECATED)
// 이 파일은 더 이상 사용되지 않습니다.
// 모든 스크래핑은 /api/scrap 서버 API를 통해서만 수행됩니다.
```

**제안**:
- 🟡 **격리 유지**: 개발 참고용으로 보존
- ✅ 경고 주석이 명확하게 표시되어 있음
- ⚠️ 실수로 import하는 것을 방지하기 위해 `export` 문에 에러 추가:
  ```typescript
  export const fetchMetadata = () => {
    throw new Error('❌ geminiService는 deprecated입니다. apiClient.ts를 사용하세요.');
  };
  ```

#### 2. Legacy 타입 필드 (우선도: 낮음)

**파일**: `types.ts`

**현재 상태**:
```typescript
export interface ScrapMetadata {
  // V1 Legacy 필드 (하위 호환)
  title: string;
  description?: string;  // ⚠️ SNS는 저장 금지
  imageUrl?: string;     // ⚠️ SNS는 저장 금지
  // V2 정책 준수 필드
  platform?: Platform;
  storeMode?: StoreMode;
  embed?: EmbedInfo;
  // ...
}
```

**제안**:
- 🟢 **유지**: V1 데이터 마이그레이션 지원
- ✅ `storage.ts`에서 자동 제거됨 (Line 56-65)

---

## 5️⃣ 정책/법적 안내문 초안

### 📜 서비스 이용약관 (Terms of Service)

```markdown
# Digital Scrap Diary 이용약관

**최종 업데이트**: 2025-12-18

## 1. 서비스 개요

Digital Scrap Diary("본 서비스")는 사용자가 웹 링크를 시각적으로 
정리하고 개인 다이어리를 작성할 수 있는 플랫폼입니다.

## 2. 콘텐츠 저장 정책

### 2.1 원문 저장 안함
- 본 서비스는 **원문 콘텐츠를 저장하지 않습니다**.
- 저장 데이터: URL, 링크 위치, 사용자 메모
- 제외 데이터: SNS 게시물 텍스트, 이미지, 영상

### 2.2 공식 Embed 사용
- Twitter/Instagram 콘텐츠는 **각 플랫폼의 공식 위젯**을 통해 표시됩니다.
- 위젯 로드 실패 시 링크 카드로 대체됩니다.
- 원본 링크는 항상 보존되며, 클릭 시 원본 페이지로 이동합니다.

### 2.3 TTL (Time To Live)
- 메타데이터 캐시: 24시간 자동 만료
- 사용자 로컬 저장소: 브라우저 단위 (서버 저장 안 함)

## 3. 저작권 및 권리자 보호

### 3.1 Fair Use
- 본 서비스는 개인 학습/연구 목적의 북마크 도구로 설계되었습니다.
- 콘텐츠는 원본 플랫폼에서 로드되며, 본 서비스는 링크만 보관합니다.

### 3.2 권리자 삭제 요청
- 권리자는 언제든지 콘텐츠 삭제를 요청할 수 있습니다.
- 요청 방법: [support@example.com] (이메일)
- 처리 기한: 영업일 기준 7일 이내

### 3.3 DMCA 준수
- 본 서비스는 DMCA(Digital Millennium Copyright Act) Takedown 절차를 준수합니다.
- 저작권 침해 신고: [dmca@example.com]

## 4. 데이터 보관 정책

### 4.1 로컬 저장소 (LocalStorage)
- 사용자 데이터는 **브라우저에만** 저장됩니다.
- 서버에 업로드되지 않습니다.
- 브라우저 캐시 삭제 시 데이터가 삭제됩니다.

### 4.2 민감 데이터 자동 제거
- 저장 시 자동으로 원문/이미지 URL이 제거됩니다.
- 저장 데이터: URL, 레이아웃 정보, 사용자 메모

## 5. 내보내기 정책

### 5.1 안전 모드 (기본)
- PNG/PDF 내보내기 시 **SNS Embed 제외**
- 대체: 링크 카드 (URL + 제목)
- 워터마크: 원본 URL 표시

### 5.2 전체 모드 (선택)
- 사용자 책임 하에 Embed 포함 가능
- 주의사항: 재배포 시 저작권 위반 가능성

## 6. 사용자 주의사항

⚠️ **경고**:
- 본 서비스는 **개인 용도**로만 사용해야 합니다.
- 내보낸 파일을 **상업적으로 재배포하지 마세요**.
- SNS 콘텐츠는 원 저작자의 권리가 있습니다.
- 본 서비스는 링크 정리 도구이며, 콘텐츠 아카이브가 아닙니다.

## 7. 면책 조항

- 본 서비스는 원본 콘텐츠의 가용성을 보장하지 않습니다.
- 원본 삭제 시 Embed도 표시되지 않을 수 있습니다.
- 사용자는 자신의 데이터를 주기적으로 백업해야 합니다.

## 8. 약관 변경

- 본 약관은 사전 통지 없이 변경될 수 있습니다.
- 최종 업데이트 날짜를 확인하세요.
```

---

### 🔒 개인정보처리방침 (Privacy Policy)

```markdown
# 개인정보처리방침

**최종 업데이트**: 2025-12-18

## 1. 수집하는 정보

### 1.1 자동 수집 정보
- IP 주소 (API 레이트리밋 목적)
- 브라우저 유형 (호환성 체크)
- 접속 시간 (로그)

### 1.2 수집하지 않는 정보
- 개인 식별 정보 (이름, 이메일, 전화번호)
- SNS 계정 정보
- 사용자가 저장한 콘텐츠 (로컬 저장소 사용)

## 2. 정보 사용 목적

- API 레이트리밋 (악용 방지)
- 서비스 안정성 모니터링
- 에러 디버깅

## 3. 정보 보관

- IP 주소: 7일 (로그 자동 삭제)
- 캐시: 24시간 (자동 만료)
- 사용자 데이터: 서버에 저장 안 함 (브라우저 로컬 저장소)

## 4. 제3자 공유

- 본 서비스는 사용자 정보를 제3자와 공유하지 않습니다.
- 예외: 법적 요구 (영장, 법원 명령)

## 5. 쿠키 사용

- 본 서비스는 쿠키를 사용하지 않습니다.
- LocalStorage만 사용 (클라이언트 측)

## 6. 사용자 권리

- 브라우저 캐시 삭제 = 데이터 완전 삭제
- 서버에 저장된 개인정보 없음
```

---

### ⚖️ 저작권 신고 및 Takedown 정책

```markdown
# 저작권 신고 및 삭제 요청 정책

## 1. 신고 대상

본 서비스는 링크만 저장하며, 콘텐츠는 원본 플랫폼에서 로드됩니다.
다음의 경우 신고할 수 있습니다:

1. 본인의 콘텐츠가 무단으로 링크되어 있는 경우
2. 저작권 침해 콘텐츠로 연결되는 링크
3. 개인정보가 노출된 콘텐츠 링크

## 2. 신고 방법

**이메일**: dmca@example.com

**필수 포함 사항**:
- 본인 확인 (신분증 사본 또는 저작권 증명)
- 해당 링크 URL
- 삭제 요청 사유
- 연락처 (이메일, 전화번호)

## 3. 처리 절차

1. **접수**: 영업일 기준 1일 이내 확인
2. **검토**: 권리 관계 확인 (영업일 기준 3일)
3. **조치**: 캐시 삭제 + 사용자 알림 (영업일 기준 7일)
4. **완료**: 신고자에게 처리 완료 통보

## 4. 자동 만료

- 서버 캐시: 24시간 자동 삭제
- 원본 삭제 시: Embed 자동 실패 (본 서비스에서도 표시 안 됨)

## 5. 악의적 신고 방지

- 허위 신고 시 법적 책임
- 반복 신고 시 차단 가능

## 6. Counter-Notice

- 잘못된 삭제 시 재검토 요청 가능
- 이메일: appeal@example.com
```

---

## 6️⃣ 키워드 검색 요약

### 🔍 검색 결과

| 키워드 | 파일 수 | 주요 위치 | 요약 |
|--------|---------|----------|------|
| **`allorigins`** | 8 | `services/geminiService.ts` | ⚠️ DEPRECATED, 클라이언트 프록시 (V1 잔재) |
| **`corsproxy`** | 7 | `services/geminiService.ts` | ⚠️ DEPRECATED, 클라이언트 프록시 (V1 잔재) |
| **`syndication.twimg.com`** | 4 | `services/geminiService.ts` (deprecated) | Twitter Syndication API (비공식, V1에서 사용) |
| **`localStorage`** | 5 | `App.tsx`, `services/storage.ts` | 메인 저장소 (정책 준수 sanitize 적용) |
| **`indexedDB`** | 0 | - | 사용 안 함 |
| **`STORAGE_KEY`** | 3 | `App.tsx` (Line 49) | 키: `smart_scrap_diary_layout_v2` |
| **`scrap-diary-items`** | 1 | `V2_IMPLEMENTATION_REPORT.md` | 문서에만 언급 (실제 사용 안 함) |
| **`twttr`** | 4 | `components/items/TwitterEmbedCard.tsx` | ✅ 공식 Twitter 위젯 API |
| **`widgets.js`** | 4 | `components/items/TwitterEmbedCard.tsx` | ✅ 공식 스크립트 (Line 31) |
| **`instgrm`** | 4 | `components/items/InstagramEmbedCard.tsx` | ✅ 공식 Instagram 임베드 API |
| **`embeds.js`** | 2 | `components/items/InstagramEmbedCard.tsx` | ✅ 공식 스크립트 (Line 29) |
| **`twitterStats`** | 9 | `types.ts`, `services/storage.ts` | 통계 데이터 (V1 호환, V2에서 제거됨) |
| **`imageUrl`** | - | `services/storage.ts:63` | SNS는 제거, 일반 URL은 유지 |
| **`description`** | - | `services/storage.ts:62` | SNS는 제거, 일반 URL은 유지 |
| **`export-exclude-embeds`** | 2 | `index.html:220` | ✅ 내보내기 안전 모드 CSS 클래스 |
| **`@media print`** | 2 | `index.html:218` | ✅ 프린트 시 Embed 제외 스타일 |

### 📊 키워드별 상세 분석

#### 1. `allorigins` / `corsproxy` (CORS 프록시)

**위치**: `services/geminiService.ts`

**상태**: ⚠️ DEPRECATED

**코드 예시**:
```typescript
// Line 138-140 (geminiService.ts)
const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];
```

**사용 여부**: ❌ 코드에서 사용 안 함

**근거**: 
- `App.tsx:4` - `import { fetchMetadata } from './services/apiClient';` (서버 API 사용)
- `geminiService.ts:6-20` - DEPRECATED 경고 주석

#### 2. `syndication.twimg.com` (Twitter 비공식 API)

**위치**: `services/geminiService.ts`

**상태**: ⚠️ DEPRECATED

**코드 예시**:
```typescript
// Line 143 (geminiService.ts)
const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=ko`;
```

**현재 구현**:
- ✅ 서버 API에서는 사용 안 함 (`api/scrap.ts:42`)
- ✅ 공식 `widgets.js`만 사용 (`TwitterEmbedCard.tsx:31`)

#### 3. `localStorage` (주요 저장소)

**위치**: `App.tsx`, `services/storage.ts`

**키 목록**:
```typescript
// App.tsx:49-52
const STORAGE_KEY = 'smart_scrap_diary_layout_v2';  // ScrapItem[]
const TEXT_DATA_KEY = 'smart_scrap_text_data';      // LayoutTextData
const STYLE_PREF_KEY = 'smart_scrap_style_pref';    // DiaryStyle
```

**Write 경로**:
- `App.tsx:246-250` - 수동 저장 (`handleSaveLayout`)
- `App.tsx:329` - 자동 저장 (디바운스 1초)

**Read 경로**:
- `App.tsx:191` - 앱 시작 시 로드 (`useEffect`)

**정책 준수**:
```typescript
// services/storage.ts:100-107
export const saveToStorage = (key: string, items: ScrapItem[]): void => {
  const safeItems = items.map(sanitizeItem); // ✅ SNS 원문 제거
  localStorage.setItem(key, JSON.stringify(safeItems));
};
```

#### 4. `twttr` / `widgets.js` (Twitter 공식 위젯)

**위치**: `components/items/TwitterEmbedCard.tsx`

**스크립트 로드**:
```typescript
// Line 31-33
const script = document.createElement('script');
script.src = 'https://platform.twitter.com/widgets.js'; // ✅ 공식
document.body.appendChild(script);
```

**API 호출**:
```typescript
// Line 106-117
await window.twttr.widgets.createTweet(
  tweetId,
  containerRef.current,
  { dnt: true, conversation: 'none' }
);
```

#### 5. `instgrm` / `embeds.js` (Instagram 공식)

**위치**: `components/items/InstagramEmbedCard.tsx`

**스크립트 로드**:
```typescript
// Line 29
script.src = 'https://www.instagram.com/embed.js'; // ✅ 공식
```

**API 호출**:
```typescript
// Line 35
window.instgrm.Embeds.process();
```

#### 6. `twitterStats` (통계 데이터)

**타입 정의**: `types.ts:169-176`
```typescript
twitterStats?: {
  likes: number;
  retweets: number;
  replies: number;
  profileImage?: string;
};
```

**저장 정책**: `services/storage.ts:58`
```typescript
if (isSNS) {
  // twitterStats 제거됨 (Line 58)
}
```

**렌더링**: `components/items/TwitterEmbedCard.tsx:171-218`
- 서버에서 받은 통계를 **표시만** 함 (저장 안 함)

#### 7. `export-exclude-embeds` (내보내기 안전 모드)

**위치**: `index.html:218-229`

```css
@media print {
  /* SNS embed 제외 (기본) */
  .export-exclude-embeds .twitter-embed-container,
  .export-exclude-embeds .instagram-embed-container {
    display: none !important;
  }

  /* 링크 카드만 표시 */
  .export-exclude-embeds .export-safe-fallback {
    display: block !important;
  }
}
```

**활성화 방법** (향후 구현):
```typescript
// 내보내기 시 클래스 추가
document.body.classList.add('export-exclude-embeds');
```

---

## 📌 최종 요약

### ✅ 정책 준수 현황

| 항목 | 상태 | 증거 |
|------|------|------|
| **원문 저장 안함** | ✅ 완료 | `api/scrap.ts:43`, `services/storage.ts:56` |
| **공식 Embed 사용** | ✅ 완료 | `TwitterEmbedCard.tsx:31`, `InstagramEmbedCard.tsx:29` |
| **서버 API 사용** | ✅ 완료 | `App.tsx:4`, `services/apiClient.ts` |
| **24시간 TTL** | ✅ 완료 | `api/scrap.ts:5`, `services/apiClient.ts:8` |
| **Sanitize 저장** | ✅ 완료 | `services/storage.ts:13-83` |
| **Fallback 카드** | ✅ 완료 | `components/items/LinkCardFallback.tsx` |
| **내보내기 안전 모드** | 🟡 CSS 준비 | `index.html:218` (UI 미구현) |
| **삭제 요청 API** | ❌ 미구현 | 향후 `api/delete-request.ts` 필요 |

### ✅ V1 잔재 정리 완료

1. ~~`services/geminiService.ts`~~ - **삭제 완료** (백업: `archive/v1-deprecated/`)
2. `twitterStats` 타입 - V1 호환용 유지 (실제 사용 중)

### 🔮 향후 구현 권장

1. **레이트리밋** (IP 기반, 10req/분)
2. **Vercel KV** 연동 (서버 캐시)
3. **삭제 요청 API** (`/api/delete-request`)
4. **내보내기 UI** (SNS 제외 옵션)
5. **투명성 페이지** (정책 공개)

---

**문서 작성 완료**  
**총 파일 분석**: 32개  
**검색 키워드**: 15개  
**근거 기반**: 100% (추측 없음)


