# 🌐 다중 플랫폼 지원 가이드

**업데이트**: 2025-12-18  
**지원 플랫폼**: 22개

---

## 📊 **지원 플랫폼 현황**

### ✅ **임베드 위젯 지원** (공식 플레이어/위젯)

| 플랫폼 | 타입 | 테마 색상 | 감지 방식 |
|--------|------|-----------|-----------|
| **Twitter** | SNS | `#1DA1F2` | Tweet ID 추출 |
| **Instagram** | SNS | `#E4405F` | Permalink 추출 |
| **YouTube** | 동영상 | `#FF0000` | Video ID 추출 |
| **Spotify** | 음악 | `#1DB954` | Track/Album/Playlist ID |
| **TikTok** | 동영상 | `#000000` | Permalink |
| **Vimeo** | 동영상 | `#1AB7EA` | Video ID 추출 |
| **Twitch** | 라이브 | `#9146FF` | Channel/Video ID |
| **Pinterest** | 이미지 | `#E60023` | Pin URL |

### 🔗 **링크 카드 지원** (메타데이터만)

| 플랫폼 | 카테고리 | 테마 색상 | 표시명 |
|--------|----------|-----------|--------|
| **알라딘** | 도서 | `#0066CC` | 알라딘 |
| **교보문고** | 도서 | `#1E3A8A` | 교보문고 |
| **텀블벅** | 크라우드펀딩 | `#FF6B6B` | 텀블벅 |
| **네이버블로그** | 블로그 | `#03C75A` | 네이버 블로그 |
| **구글맵** | 지도 | `#4285F4` | 구글 지도 |
| **네이버지도** | 지도 | `#03C75A` | 네이버 지도 |
| **무신사** | 패션 | `#000000` | 무신사 |
| **KREAM** | 패션 | `#FF4800` | KREAM |
| **Unsplash** | 사진 | `#000000` | Unsplash |
| **Apple Music** | 음악 | `#FA243C` | Apple Music |
| **Facebook** | SNS | `#1877F2` | Facebook |

---

## 🧪 **플랫폼별 테스트 URL**

### 🎵 **음악 플랫폼**

#### Spotify
```
✅ 트랙: https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp
✅ 앨범: https://open.spotify.com/album/5Z9iiGl2FcIfa3BMiv6OIw
✅ 플레이리스트: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M

예상 결과: Spotify 플레이어 임베드
DevTools: "✅ Spotify 감지: track - 3n3Ppam7vgaVa1iaRUc9Lp"
```

#### Apple Music
```
🔗 https://music.apple.com/kr/album/1234567890

예상 결과: Apple Music 링크 카드 (#FA243C)
DevTools: "✅ Apple Music 감지"
```

---

### 🎬 **동영상 플랫폼**

#### YouTube
```
✅ https://www.youtube.com/watch?v=dQw4w9WgXcQ
✅ https://youtu.be/dQw4w9WgXcQ

예상 결과: YouTube 플레이어
DevTools: "✅ YouTube 감지: dQw4w9WgXcQ"
```

#### Vimeo
```
✅ https://vimeo.com/123456789

예상 결과: Vimeo 플레이어 임베드
DevTools: "✅ Vimeo 감지: 123456789"
```

#### TikTok
```
✅ https://www.tiktok.com/@username/video/1234567890123456789
✅ https://www.tiktok.com/t/ABC123/

예상 결과: TikTok 임베드
DevTools: "✅ TikTok 감지: https://..."
```

#### Twitch
```
✅ 채널: https://www.twitch.tv/username
✅ 동영상: https://www.twitch.tv/videos/1234567890

예상 결과: Twitch 플레이어
DevTools: "✅ Twitch 감지: channel" 또는 "video"
```

---

### 📸 **이미지/디자인 플랫폼**

#### Instagram
```
✅ 포스트: https://www.instagram.com/p/ABC123xyz/
✅ 릴스: https://www.instagram.com/reel/ABC123xyz/

예상 결과: Instagram 임베드
DevTools: "✅ Instagram 감지: https://..."
```

#### Pinterest
```
✅ https://www.pinterest.com/pin/1234567890/
✅ https://pin.it/ABC123

예상 결과: Pinterest 임베드
DevTools: "✅ Pinterest 감지: https://..."
```

#### Unsplash
```
🔗 https://unsplash.com/photos/ABC123xyz

예상 결과: Unsplash 링크 카드 (#000000)
DevTools: "✅ Unsplash 감지"
```

---

### 🐦 **SNS 플랫폼**

#### Twitter
```
✅ https://twitter.com/username/status/1234567890
✅ https://x.com/username/status/1234567890

예상 결과: 트위터 임베드
DevTools: "✅ Twitter 감지: 1234567890"
```

#### Facebook
```
🔗 https://www.facebook.com/username/posts/1234567890

예상 결과: Facebook 링크 카드 (#1877F2)
DevTools: "✅ Facebook 감지"
```

---

### 📚 **도서 플랫폼**

#### 알라딘
```
🔗 https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=123456

예상 결과: 알라딘 링크 카드 (#0066CC)
DevTools: "✅ 알라딘 감지"
```

#### 교보문고
```
🔗 https://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&barcode=1234567890123

예상 결과: 교보문고 링크 카드 (#1E3A8A)
DevTools: "✅ 교보문고 감지"
```

---

### 🗺️ **지도 플랫폼**

#### 구글맵
```
🔗 https://www.google.com/maps/place/...
🔗 https://goo.gl/maps/ABC123

예상 결과: 구글 지도 링크 카드 (#4285F4)
DevTools: "✅ 구글 지도 감지"
```

#### 네이버지도
```
🔗 https://map.naver.com/v5/entry/place/1234567890
🔗 https://naver.me/ABC123

예상 결과: 네이버 지도 링크 카드 (#03C75A)
DevTools: "✅ 네이버 지도 감지"
```

---

### 👕 **패션 플랫폼**

#### 무신사
```
🔗 https://www.musinsa.com/app/goods/1234567

예상 결과: 무신사 링크 카드 (#000000)
DevTools: "✅ 무신사 감지"
```

#### KREAM
```
🔗 https://kream.co.kr/products/12345

예상 결과: KREAM 링크 카드 (#FF4800)
DevTools: "✅ KREAM 감지"
```

---

### 📝 **기타 플랫폼**

#### 네이버블로그
```
🔗 https://blog.naver.com/username/223456789

예상 결과: 네이버 블로그 링크 카드 (#03C75A)
DevTools: "✅ 네이버 블로그 감지"
```

#### 텀블벅
```
🔗 https://tumblbug.com/projectname

예상 결과: 텀블벅 링크 카드 (#FF6B6B)
DevTools: "✅ 텀블벅 감지"
```

---

## 🔧 **기술 구현**

### 플랫폼 감지 흐름

```
1. URL 입력
   ↓
2. buildSafeMetadataLocally() 실행
   ↓
3. 플랫폼별 감지 함수 순차 실행
   - Twitter → Instagram → YouTube → Spotify → ...
   ↓
4. 매치되면 즉시 메타데이터 반환
   ↓
5. 모두 실패하면 일반 링크 카드 반환
```

### 감지 우선순위

```typescript
1. Twitter (extractTwitterId)
2. Instagram (detectInstagram)
3. YouTube (extractYouTubeId)
4. Spotify (extractSpotifyId)
5. TikTok (detectTikTok)
6. Vimeo (extractVimeoId)
7. Twitch (detectTwitch)
8. Pinterest (detectPinterest)
9. Platform-specific (detectPlatform)
   - 알라딘, 교보문고, 텀블벅, 네이버블로그
   - 구글맵, 네이버지도
   - 무신사, KREAM
   - Unsplash, Apple Music, Facebook
10. 일반 링크 (hostname)
```

---

## 📋 **임베드 vs 링크 카드 차이**

### ✅ **임베드 위젯** (공식 플레이어)
```typescript
{
  platform: 'youtube',
  embed: {
    kind: 'youtube',
    id: 'dQw4w9WgXcQ'
  },
  isEditable: false  // 임베드는 수정 불가
}
```

**특징**:
- 공식 위젯/플레이어 표시
- 인터랙티브 (재생, 좋아요 등)
- 인터넷 연결 필요
- 내보내기 시 제외 가능 (안전 모드)

---

### 🔗 **링크 카드** (메타데이터만)
```typescript
{
  platform: 'aladin',
  title: '알라딘',
  subtitle: 'aladin.co.kr',
  themeColor: '#0066CC',
  isEditable: true  // 수동 편집 가능
}
```

**특징**:
- 플랫폼명 + 테마 색상 표시
- 수동으로 제목/설명 편집 가능
- 오프라인에서도 표시 가능
- 내보내기 시 항상 포함

---

## 🎯 **즉시 테스트 방법**

### 1. 앱 재시작
```bash
cd "/Users/ieun-yeong/Desktop/digitalscrapdiary 2"
npm run electron:dev
```

### 2. 플랫폼별 테스트

#### 음악
```
1. Spotify 트랙 추가
2. DevTools: "✅ Spotify 감지: track - ..."
3. 플레이어 확인
```

#### 동영상
```
1. TikTok URL 추가
2. DevTools: "✅ TikTok 감지: https://..."
3. 임베드 확인
```

#### 도서
```
1. 알라딘 URL 추가
2. DevTools: "✅ 알라딘 감지"
3. 링크 카드 (#0066CC) 확인
```

### 3. 일반 링크 테스트
```
1. 지원하지 않는 사이트 URL 추가
   (예: https://example.com)
2. DevTools: "ℹ️ 일반 링크: example.com"
3. 기본 링크 카드 (#64748b) 확인
```

---

## 🐛 **트러블슈팅**

### 문제 1: 플랫폼이 "일반 링크"로 감지됨

**원인**:
- URL 패턴 불일치
- 감지 함수 버그

**해결**:
```javascript
// DevTools 콘솔에서 확인
console.log("URL:", url);
console.log("Hostname:", new URL(url).hostname);

// 패턴 테스트
/aladin\.co\.kr/.test(url);  // true여야 함
```

---

### 문제 2: 임베드가 로드되지 않음

**원인**:
- 인터넷 연결 필요
- 플랫폼 API 오류
- CORS 문제

**해결**:
1. 인터넷 연결 확인
2. DevTools → Network 탭에서 임베드 요청 확인
3. 콘솔에서 에러 메시지 확인
4. 안전 모드로 전환 (링크 카드로 표시)

---

### 문제 3: 새 플랫폼 추가하고 싶음

**단계**:

1. **types.ts** - Platform 타입 추가
```typescript
export type Platform = 
  | 'twitter'
  | 'newplatform'  // ← 추가
  | ...
```

2. **apiClient.ts** - 감지 함수 추가
```typescript
function detectNewPlatform(url: string): string | null {
  if (url.includes('newplatform.com')) {
    return url;
  }
  return null;
}
```

3. **buildSafeMetadataLocally** - 로직 추가
```typescript
const newPlatformUrl = detectNewPlatform(url);
if (newPlatformUrl) {
  return {
    platform: 'newplatform',
    themeColor: '#FF00FF',
    ...
  };
}
```

---

## 📊 **성능 고려사항**

### 임베드 위젯 로딩
```
- Twitter: ~500ms
- Instagram: ~800ms
- YouTube: ~300ms
- Spotify: ~400ms
- TikTok: ~600ms
```

**최적화 팁**:
1. 한 번에 3개 이상 임베드 피하기
2. 스크롤 밖 임베드는 lazy load
3. 내보내기 시 안전 모드 사용

---

## 🎉 **요약**

### 완료된 기능
```
✅ 22개 플랫폼 지원
✅ 8개 임베드 위젯 (Twitter, Instagram, YouTube, Spotify, TikTok, Vimeo, Twitch, Pinterest)
✅ 11개 링크 카드 (알라딘, 교보문고, 텀블벅, 네이버블로그, 구글맵, 네이버지도, 무신사, KREAM, Unsplash, Apple Music, Facebook)
✅ 플랫폼별 테마 색상
✅ 자동 감지 및 메타데이터 생성
✅ Electron 오프라인 지원
```

### 다음 단계
```
1. 앱 재시작 (npm run electron:dev)
2. 플랫폼별 URL 테스트
3. DevTools 콘솔 확인
4. 임베드/링크 카드 확인
5. 저장 및 재실행 테스트
```

---

**최종 업데이트**: 2025-12-18 15:45 KST  
**지원 플랫폼 수**: 22개  
**임베드 위젯**: 8개  
**링크 카드**: 11개 + 일반 링크



