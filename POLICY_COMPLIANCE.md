# 📋 콘텐츠 저장 및 표시 정책 준수 가이드

## 🎯 목표

트위터/인스타그램 등 SNS 플랫폼의 ToS를 준수하고, 저작권 리스크를 최소화하는 안전한 서비스 구현

---

## ✅ 정책 요약

1. **URL + 레이아웃 + 메모** 중심 저장
2. **SNS 원문 복제 저장 금지** (텍스트/이미지/영상)
3. **공식 Embed** 우선 사용
4. **프록시 우회 금지**
5. **서버 API** 기반 아키텍처
6. **권리자 삭제 요청** 대응

---

## 🚨 현재 위반 사항

### 1. 클라이언트 프록시 스크래핑 (🔴 높음)

**파일**: `services/geminiService.ts`, `App.tsx`

**문제**:
```typescript
// ❌ 개발 환경에서 클라이언트 직접 스크래핑
const fetchMetadata = import.meta.env.DEV 
  ? fetchMetadataClient  // allorigins/corsproxy 사용
  : fetchMetadataServer;
```

**해결**:
```typescript
// ✅ 모든 환경에서 서버 API만 사용
import { fetchMetadata } from './services/apiClient';
```

**수정 파일**:
- `App.tsx` - import 문 수정
- `services/geminiService.ts` - 개발 전용으로 표시 또는 제거

---

### 2. SNS 원문 저장 (🔴 높음)

**파일**: `api/scrap.ts`, `types.ts`

**현재**:
```typescript
// ❌ 저장 중
{
  description: data.text,        // 트윗 원문
  imageUrl: data.photos[0].url, // 이미지 URL
  twitterStats: {                // 통계
    likes: data.favorite_count,
    retweets: data.retweet_count,
    // ...
  }
}
```

**해결 Option A (안전)**: 최소 메타데이터만
```typescript
// ✅ 안전
{
  url: url,
  platform: 'twitter',
  title: 'Twitter Post',
  embedType: 'twitter_widget',
  fetchedAt: Date.now(),
  // description, imageUrl, stats 제거
}
```

**해결 Option B (절충)**: TTL + 삭제 대응
```typescript
// ✅ 24시간 TTL + 권리자 요청 시 즉시 삭제
{
  url: url,
  title: data.author_name,
  description: data.text.slice(0, 100), // 100자 제한
  thumbnailUrl: data.photos[0].url,     // 썸네일만
  ttl: 86400, // 24시간
  deletable: true // 삭제 요청 가능 표시
}
```

**수정 파일**:
- `api/scrap.ts` - fetchTwitterData 함수
- `types.ts` - ScrapMetadata 타입

---

### 3. LocalStorage 무기한 보관 (🟠 중간)

**파일**: `App.tsx`

**문제**:
```typescript
// ❌ 브라우저에 원문 포함하여 무기한 저장
localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
```

**해결**:
```typescript
// ✅ 저장 전 민감 데이터 제거
const sanitizeForStorage = (items: ScrapItem[]) => {
  return items.map(item => ({
    ...item,
    metadata: {
      ...item.metadata,
      description: undefined,  // 원문 제거
      twitterStats: undefined, // 통계 제거
      // URL과 레이아웃만 유지
    }
  }));
};

localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeForStorage(items)));
```

**수정 파일**:
- `App.tsx` - handleSaveLayout 함수

---

### 4. 서버 캐시 TTL 없음 (🟡 낮음)

**파일**: `api/scrap.ts`

**현재**:
```typescript
// ❌ 무기한 캐시
const cache = new Map();
```

**해결**:
```typescript
// ✅ 24시간 TTL
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

cache.set(cacheKey, {
  data: metadata,
  timestamp: Date.now(),
  expiresAt: Date.now() + CACHE_TTL
});
```

**수정 파일**:
- `api/scrap.ts` - 캐시 로직

---

## ✅ 준수 사항

### 1. 공식 Embed 사용 (✅ 양호)

**파일**: `components/items/TwitterEmbedCard.tsx`

```typescript
// ✅ Twitter 공식 위젯 사용
await window.twttr.widgets.createTweet(tweetId, container, {
  dnt: true,
  conversation: 'none',
});
```

**Fallback**:
```typescript
// ✅ 실패 시 안전한 카드
if (embedFailed) {
  return <TwitterCard data={data} />; // 링크 카드
}
```

---

### 2. 원본 링크 보존 (✅ 양호)

**모든 카드에 원본 링크**:
```typescript
<a href={data.url} target="_blank">
  원본 보기 →
</a>
```

---

## 🔧 수정 우선순위

### Priority 1 (즉시) 🔴

1. **App.tsx** - 개발 환경에서도 서버 API만 사용
   ```typescript
   - import { fetchMetadata } from './services/geminiService';
   + import { fetchMetadata } from './services/apiClient';
   ```

2. **api/scrap.ts** - 저장 데이터 최소화
   - `description` 제거 또는 100자 제한
   - `imageUrl` 제거 또는 썸네일만
   - `twitterStats` 제거 또는 익명화

### Priority 2 (1주일 내) 🟠

3. **App.tsx** - LocalStorage 저장 전 sanitize
4. **api/scrap.ts** - 캐시 TTL 추가 (24시간)
5. **레이트리밋** 추가 (IP 기반, 10req/분)

### Priority 3 (1개월 내) 🟡

6. **삭제 요청 UI** 구현
7. **내보내기 기능** - SNS 제외 옵션
8. **Vercel KV** 연동 (서버 캐시)

### Priority 4 (향후) 🟢

9. **투명성 페이지** - 정책 공개
10. **권리자 신고 폼**
11. **자동 삭제** - 원본 삭제 시 연동

---

## 📝 권장 구현

### 1. 안전한 메타데이터 타입

```typescript
// types.ts
export interface SafeScrapMetadata {
  url: string;              // 필수: 원본 링크
  platform: string;         // 필수: 플랫폼 식별
  title: string;            // 최소: 제목 또는 플랫폼명
  embedType?: string;       // embed/link_card
  
  // 선택 (최소한으로)
  thumbnailUrl?: string;    // 썸네일만 (원본 이미지 X)
  snippet?: string;         // 100자 이내 발췌
  
  // 메타
  fetchedAt: number;        // 수집 시점
  ttl?: number;             // 만료 시간
  deletable: boolean;       // 삭제 가능 여부
}
```

### 2. 안전한 저장 함수

```typescript
// services/storage.ts
export const sanitizeMetadata = (metadata: ScrapMetadata): SafeScrapMetadata => {
  return {
    url: metadata.url,
    platform: detectPlatform(metadata.url),
    title: metadata.title || 'Link',
    embedType: 'embed',
    fetchedAt: Date.now(),
    ttl: 86400000, // 24h
    deletable: true,
  };
};

export const saveToStorage = (items: ScrapItem[]) => {
  const safeItems = items.map(item => ({
    ...item,
    metadata: sanitizeMetadata(item.metadata)
  }));
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safeItems));
};
```

### 3. 권리자 삭제 요청 처리

```typescript
// api/delete-request.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url, reason, contact } = req.body;
  
  // 1. 요청 기록
  await logDeletionRequest({ url, reason, contact });
  
  // 2. 캐시에서 즉시 삭제
  await cache.delete(url);
  
  // 3. 사용자에게 알림 (선택)
  // await notifyUsers(url, 'deleted');
  
  return res.status(200).json({ 
    message: 'Deletion request processed',
    url 
  });
}
```

---

## 🎯 내보내기 정책 (향후)

### PNG/PDF 내보내기 시

```typescript
export interface ExportOptions {
  includeEmbeds: boolean;      // SNS embed 포함 여부
  mode: 'safe' | 'full';       // 안전 모드 / 전체
  watermark: boolean;          // 워터마크 추가
}

// 기본값: 안전 모드
const defaultOptions: ExportOptions = {
  includeEmbeds: false,  // ❌ SNS 제외
  mode: 'safe',          // ✅ 링크 카드만
  watermark: true,       // ✅ 출처 표시
};
```

**안전 모드 렌더링**:
```typescript
if (exportOptions.mode === 'safe' && item.type === 'twitter') {
  // ✅ Embed 대신 링크 카드
  return renderLinkCard(item.metadata.url);
}
```

---

## 📊 준수 체크리스트

### 코드 레벨

- [ ] 클라이언트 프록시 제거 (geminiService.ts)
- [ ] 서버 API만 사용 (App.tsx)
- [ ] 메타데이터 최소화 (api/scrap.ts)
- [ ] LocalStorage sanitize (App.tsx)
- [ ] 캐시 TTL 추가 (api/scrap.ts)
- [ ] 레이트리밋 구현
- [ ] 공식 Embed 유지 (TwitterEmbedCard.tsx)
- [ ] Fallback 카드 유지 (TwitterCard.tsx)

### 정책 레벨

- [ ] 이용약관에 정책 명시
- [ ] 개인정보처리방침 업데이트
- [ ] 권리자 신고 폼 제공
- [ ] 투명성 페이지 공개
- [ ] 삭제 요청 처리 절차
- [ ] 정기 리뷰 (3개월)

---

## 🔗 참고 자료

### 플랫폼 정책

- [Twitter Developer Policy](https://developer.twitter.com/en/developer-terms/policy)
- [Instagram Platform Policy](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api)
- [Fair Use Guidelines](https://www.copyright.gov/fair-use/)

### 구현 가이드

- [Twitter Embed Widget](https://developer.twitter.com/en/docs/twitter-for-websites/javascript-api/overview)
- [OEmbed Specification](https://oembed.com/)
- [DMCA Takedown Process](https://www.dmca.com/Takedowns)

---

**작성일**: 2025-12-17  
**버전**: 1.0  
**다음 리뷰**: 2026-01-17


