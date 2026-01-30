# URL Pipeline Conflicts (Current Rules Baseline)

이 문서는 **현재 코드 기준**(규칙 변경 없음)으로 URL 분류/스크랩 파이프라인에서 **환경별로 분류/처리 경로가 달라질 수 있는 잠재 충돌 케이스**를 정리하고, SelfTestRunner의 회귀 테스트로 고정하기 위한 근거를 제공합니다.

## 1) 파이프라인 요약(분기 지점)

### A. Client (최종 ScrapType)
- **입력**: URL
- **정규화/판별(단일 소스)**: `shared/urlPlatform.ts`
  - `normalizeUrl(url)`
  - `detectPlatform(normalizeUrl(url))`
- **ScrapType 매핑**: `services/urlParser.ts`의 `parseUrlType(url): ScrapType`
  - `detectPlatform` 결과를 기존 `ScrapType`으로 매핑해 **기존 동작 유지**
  - `googlemap`은 기존에 ScrapType 전용 분류가 없었으므로 `GENERAL`로 매핑 유지

### B. Shared (PlatformId)
- **정규화**: `normalizeUrl`는 `x.com` hostname만 `twitter.com`으로 치환 + 일부 추적 파라미터 삭제(`utm_*`, `ref`, `fbclid`)
- **판별**: `detectPlatform`은 `services/urlParser.ts` 규칙을 이식 + 최소 추가(`aladin`, `googlemap`)

### C. Server (api/scrap.ts)
- **요청 type이 정상일 때**: 요청 type(`twitter|instagram|pinterest|youtube`)을 우선으로 `switch` 분기
- **요청 type이 이상/unknown일 때**: `detectPlatform(normalizeUrl(url))` 결과가 위 4종이면 그쪽으로 보정, 아니면 `general`
- **중요**: `book/spotify/tiktok/vimeo/fashion/moving_photo` 등은 서버에서 별도 분기 없이 `general`로 처리(현행 유지)

### D. Electron/Client (services/apiClient.ts)
- **Electron 환경**: 로컬 `buildSafeMetadataLocally` 분기(내부에서 트위터/인스타/유튜브/핀터레스트/알라딘/구글맵 감지)
- **Web 환경**: `detectPlatform(normalizeUrl(url))`가 `aladin|googlemap`이면 `/api/unfurl`로, 아니면 `/api/scrap`로 요청
  - 즉, client의 `ScrapType`이 `GENERAL`이어도 URL이 `googlemap`이면 **unfurl 경로를 선택**(현행 설계)

## 2) 잠재 충돌 케이스 목록(현재 규칙 기준)

> 표의 “예상”은 **현재 코드에서 실제로 사용되는 조건/분기**로만 판단했습니다. 애매한 경우는 **불확실**로 표기하고, 개선은 “힌트”로만 남깁니다.

| # | URL 예시 | normalizeUrl 결과(요약) | detectPlatform | urlParser ScrapType | server 처리 예상(type 정상/이상) | apiClient 처리 예상(Web) | 위험 이유 | 현재 방침(유지) | 향후 개선 힌트(코멘트) |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `https://x.com/user/status/1?utm_source=a&ref=b` | `https://twitter.com/.../1` (utm/ref 제거, x.com→twitter.com) | twitter | TWITTER | twitter / twitter | `/api/scrap` | 정규화는 x.com만 치환(다른 x 서브도메인 미대응) | 유지 | 필요 시 `mobile.x.com` 등 추가 치환(이번 금지) |
| 2 | `https://mobile.twitter.com/user/status/1` | 그대로 | twitter | TWITTER | twitter / twitter | `/api/scrap` | host 변형이 많아도 substring 매치로 twitter로 분류됨 | 유지 | normalizeUrl에 mobile host 정리 가능(금지) |
| 3 | `https://twitter.com/user/status/1?s=20&t=abc` | `s/t` 유지(삭제 대상 아님) | twitter | TWITTER | twitter / twitter | `/api/scrap` | tracking 제거 범위가 제한적(utm/ref/fbclid만) | 유지 | 제거 파라미터 확장 가능(금지) |
| 4 | `https://twitter.com/user/statuses/1` | 그대로 | twitter | TWITTER | twitter / twitter | `/api/scrap` | server extractTweetId는 statuses 패턴도 지원(현행) | 유지 | - |
| 5 | `https://www.instagram.com/reel/XYZ/?igshid=1` | igshid 유지 | instagram | INSTAGRAM | instagram / instagram | `/api/scrap` | igshid 제거는 서버/클라 규칙에 없음 | 유지 | normalizeUrl에 igshid 제거 후보(금지) |
| 6 | `https://www.instagram.com/stories/user/123` | 그대로 | instagram | INSTAGRAM | instagram / instagram | `/api/scrap` | stories도 instagram으로 분류(처리 성공/실패는 별도) | 유지 | stories 지원 정책 별도 필요(금지) |
| 7 | `https://youtu.be/dQw4w9WgXcQ?si=abc` | si 유지 | youtube | YOUTUBE | youtube / youtube | `/api/scrap` | si/list 등 제거 없음 | 유지 | normalizeUrl에서 si/list 제거 후보(금지) |
| 8 | `https://www.youtube.com/shorts/dQw4w9WgXcQ` | 그대로 | youtube | YOUTUBE | youtube / youtube | `/api/scrap` | shorts도 youtube로 분류됨(영상 ID 추출은 별도 로직) | 유지 | ID 추출 일원화 후보(금지) |
| 9 | `https://m.youtube.com/watch?v=dQw4w9WgXcQ` | 그대로 | youtube | YOUTUBE | youtube / youtube | `/api/scrap` | `hostname.includes('youtube.com')`로 매칭됨 | 유지 | - |
|10 | `https://www.pinterest.co.kr/pin/123/` | 그대로 | pinterest | PINTEREST | pinterest / pinterest | `/api/scrap` | ok | 유지 | - |
|11 | `https://pin.it/abcd` | 그대로 | general | GENERAL | general / general | `/api/scrap` | pin.it는 현재 규칙상 미지원 → 일반 링크로 처리됨 | 유지(문서화) | pin.it 지원은 추후(금지) |
|12 | `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1` | utm/ref/fbclid 없으면 그대로 | aladin | BOOK | server는 type=book이면 general 처리(현행), 하지만… | **`/api/unfurl`** | client ScrapType=BOOK vs apiClient는 unfurl 선택(분기 차이) | 유지 | urlParser에서 googlemap/aladin을 별도 타입으로 바꾸는 건 금지 |
|13 | `https://www.yes24.com/Product/Goods/1?utm_medium=x` | utm 제거 | book | BOOK | **server type=book → general 처리** | `/api/scrap`(type=book) | 서버는 book 분기 없음(현행) | 유지 | 서버에 book 분기 추가 후보(금지) |
|14 | `https://www.amazon.com/dp/B000000?fbclid=1` | fbclid 제거 | book | BOOK | server type=book → general | `/api/scrap`(type=book) | 위와 동일 | 유지 | - |
|15 | `https://www.google.com/maps/place/Seoul?utm_campaign=x` | utm 제거 | googlemap | GENERAL | general / general | **`/api/unfurl`** | urlParser는 googlemap을 GENERAL로 유지하지만 apiClient는 unfurl로 우회 | 유지 | googlemap 전용 type 추가는 금지 |
|16 | `https://maps.google.com/?q=Seoul` | 그대로 | googlemap | GENERAL | general / general | **`/api/unfurl`** | 동일 | 유지 | - |
|17 | `https://goo.gl/maps/abcdef` | 그대로 | googlemap | GENERAL | general / general | **`/api/unfurl`** | 동일 | 유지 | - |
|18 | `https://example.com/video.mp4?utm_source=x` | utm 제거 | moving_photo | MOVING_PHOTO | (client가 서버 호출한다면) general / general | `/api/scrap` | moving_photo는 서버 분기 없음(현행) | 유지 | 미디어 업로드/처리 정책 분리 후보(금지) |
|19 | `https://example.com/download?file=video.mp4` | 그대로 | general | GENERAL | general / general | `/api/scrap` | 확장자가 pathname이 아니라 query에 있으면 moving_photo로 분류되지 않음 | 유지 | query 기반 확장자 감지는 개선 후보(금지) |
|20 | `https://www.musinsa.com/app/goods/1` | 그대로 | fashion | FASHION | type=fashion이면 general / general | `/api/scrap` | 서버는 fashion 분기 없음(현행). “스크랩”이 꼭 필요한지 모호 | 유지 | 서버 분기 추가/정책은 추후 |
|21 | `https://example.com/shop/about` | 그대로 | fashion(경로 휴리스틱) | FASHION | general / general | `/api/scrap` | `/shop/` 오탐 가능 | 유지 | 휴리스틱 정교화 후보(금지) |
|22 | `https://example.com/product/help` | 그대로 | fashion | FASHION | general / general | `/api/scrap` | `/product/` 오탐 가능 | 유지 | - |

## 3) “실제 사용자 영향” 등급 기준

- **High**
  - 환경(웹/일렉트론/서버)마다 **서로 다른 API 경로**로 가거나(`/api/unfurl` vs `/api/scrap`), 결과적으로 저장되는 `metadata.platform/source/embed`가 달라질 가능성이 큼
  - 예: aladin/googlemap 같이 urlParser 분류와 apiClient 경로가 어긋나는 케이스
- **Medium**
  - 분류는 같지만 정규화/파라미터 제거 범위 차이로 **캐시 키/동일성**이 깨질 수 있음(utm만 제거, s/t/si 등 유지)
- **Low**
  - 분류/경로가 동일하고 실사용에 영향이 거의 없음


