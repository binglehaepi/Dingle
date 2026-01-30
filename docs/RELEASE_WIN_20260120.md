## RELEASE WIN (2026-01-20)

### 개요

- **목표**: 2026-01-20 Windows Electron 유료앱 배포
- **작업 브랜치**: `electron-release` (기준 고정)
- **제약**: 큰 리팩터링 금지 / 데이터 포맷·호환성 깨는 변경 금지 / 추측 금지(근거 필수)

### 빌드&검사 현황

#### 필수 자동검사 실행(로그 저장) — PHASE 0

원본 로그:

- `docs/RELEASE_WIN_20260120_raw/tsc_noemit.log`
- `docs/RELEASE_WIN_20260120_raw/build.log`
- `docs/RELEASE_WIN_20260120_raw/ui_selftest.log`
- `docs/RELEASE_WIN_20260120_raw/electron_compile.log`

요약 표(근거는 로그 파일명 + 라인):

| 항목 | 커맨드 | PASS/FAIL | 핵심 경고/에러(최대 5줄) | 영향도 |
|---|---|---|---|---|
| TypeScript (noEmit) | `npx tsc -p tsconfig.json --noEmit` | PASS | `tsc_noemit.log` L1: `EXIT_CODE=0` | Low |
| Build | `npm run build` | PASS | `build.log` L18: `EXIT_CODE=0`<br>`build.log` L13: `(!) Some chunks are larger than 500 kB after minification. Consider:`<br>`build.log` L16: `- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.` | Med |
| UI SelfTest | `npm run ui:selftest` | PASS | `ui_selftest.log` L457: `EXIT_CODE=0`<br>`ui_selftest.log` L6: `[browser:warning] cdn.tailwindcss.com should not be used in production...` | Med |
| Electron compile | `npm run electron:compile` | PASS | `electron_compile.log` L5: `EXIT_CODE=0` | Low |

### 블로커&리스크

- **[WIN_RELEASE_BLOCKER_1] importmap/esm.sh 잔존(오프라인 부팅/렌더러 로딩 리스크)**  
  - **상태**: **Resolved** (packaged 엔트리 HTML 기준으로 `importmap`/`esm.sh` 비존재 확정)  
  - **원인(1줄 결론, 패치 전)**: `index.html`에 `importmap`(+ `https://esm.sh/...`)이 **하드코딩**되어 있고, 그 내용이 **`dist/index.html`에도 그대로 존재**했음.  
  - **근거(라인, 패치 전)**: `docs/RELEASE_WIN_20260120_raw/blocker1_rootcause.log` L11-L26
  - **dist 기준 해소 증거(PATCH 3 이후)**: `dist/index.html`에서 `importmap|esm\.sh` **0건**  
    - 근거: `docs/RELEASE_WIN_20260120_raw/blocker1_postpatch_dist_scan.log` L5-L7 (`(no matches)`, `COUNT=0`, `EXIT_CODE=0`)
  - **packaged “정체” 확정(엔트리 HTML 기준, PATCH 3 이후)**:
    - **앱이 실제로 로드하는 엔트리 HTML**: `dist-electron/main.js`에서 `../dist/index.html`을 `loadFile`로 로드  
      - 근거: `docs/RELEASE_WIN_20260120_raw/blocker1_packaged_trace.log` L19
    - **엔트리 HTML에 위험 패턴 없음**: `dist/index.html`에서 `<script type="importmap">` / `type="importmap"` / `esm.sh` 모두 **0건**  
      - 근거: `docs/RELEASE_WIN_20260120_raw/blocker1_packaged_trace.log` L130-L134
    - **결론(1줄)**: packaged에 남아있는 `importmap` 문자열은 엔트리 HTML이 아니라 라이브러리(예: `react-dom` 내부 문자열)에서 발생하며, 부팅/렌더러 로딩 네트워크 의존 블로커로는 **해소 가능**  
      - 근거(예시): `docs/RELEASE_WIN_20260120_raw/blocker1_packaged_trace.log` L88-L99

- **[WIN_RELEASE_BLOCKER_2] electron:build:win FAIL (권한/심볼릭링크/캐시/잠금 이슈 후보 — 재현 로그 기준 고정)**  
  - **증상(1줄)**: `release\\win-unpacked\\resources\\app.asar` 삭제 단계에서 “다른 프로세스가 사용 중이라 접근 불가”로 실패  
  - **근거**: `docs/RELEASE_WIN_20260120_raw/blocker2_buildwin_keylines.log` L5-L7
  - **원인(1줄 결론, 추측 금지)**: Electron Builder가 `app.asar`를 제거(remove)하려는 시점에 해당 파일이 다른 프로세스에 의해 점유되어(locked) 작업이 실패함  
  - **우회책 제안(구현 금지, 1~3개)**:
    - **실행 중 프로세스 정리**: `Digital Scrap Diary.exe`/Electron 관련 프로세스/미리보기/인덱싱 도구가 `release\\win-unpacked`을 점유하지 않도록 종료 후 재시도
    - **산출물 폴더 초기화**: `release/`(특히 `win-unpacked/resources/app.asar`)를 완전히 정리 후 재시도(수동 삭제가 막히면 재부팅 후 시도)
    - **경로/동기화 영향 최소화**: 현재 작업 경로가 OneDrive 하위이므로(근거: `docs/RELEASE_WIN_20260120_raw/blocker2_env.log` L70, L83), 가능하면 로컬 비동기화 경로에서 빌드 재시도(제안만)

#### PHASE 1A — 외부 의존 전수 스캔(오프라인 시한폭탄 후보)

원본 로그: `docs/RELEASE_WIN_20260120_raw/external_deps_scan.log`
PHASE 1A-2(dist 재스캔) 로그: `docs/RELEASE_WIN_20260120_raw/external_deps_scan_dist.log`
PHASE 1A-3(packaged 재스캔) 로그: `docs/RELEASE_WIN_20260120_raw/external_deps_scan_packaged.log`
PHASE 1A-4(packaged 엔트리 추적) 로그: `docs/RELEASE_WIN_20260120_raw/external_deps_packaged_entry_trace.log`
PHASE 1A-4(packaged 엔트리 스캔) 로그: `docs/RELEASE_WIN_20260120_raw/external_deps_packaged_entry_scan.log`

| 항목(URL/도메인) | 위치(파일:라인) | PACKAGED 엔트리 포함 여부 | 오프라인 영향(High/Med/Low) | 메모(최소 대체 방향 1줄) |
|---|---|---|---|---|
| `https://cdn.tailwindcss.com` | `index.html` L14 | 포함 (근거: `external_deps_packaged_entry_scan.log` L6) | Med | Tailwind를 CDN 대신 빌드 타임(PostCSS/Tailwind CLI)로 번들링 |
| `https://fonts.googleapis.com/*` | `index.html` L17/L20 | 포함 (근거: `external_deps_packaged_entry_scan.log` L10-L12) | Med | 폰트 파일을 로컬 번들(또는 OS 폰트 fallback 정책 명시) |
| `https://fonts.gstatic.com/*` | `index.html` L18 | 포함 (근거: `external_deps_packaged_entry_scan.log` L15-L16) | Med | 위와 동일(폰트 로딩 경로 로컬화) |
| `https://cdn.jsdelivr.net/*` (woff) | `index.html` L30/L38/L46 | 포함 (근거: `external_deps_packaged_entry_scan.log` L19-L22) | Med | noonnu 폰트 woff를 앱 패키지에 포함(오프라인 대응) |
| `https://platform.twitter.com/widgets.js` | `components/items/TwitterEmbedCard.tsx` L33 | 미포함 (근거: `external_deps_packaged_entry_scan.log` L24-L26) | Med | 오프라인 시 LinkCardFallback로 하향(현재도 fallback 존재) + 로컬 캐싱은 후속 검토 |
| `https://www.instagram.com/embed.js` | `components/items/InstagramEmbedCard.tsx` L30 | 미포함 (근거: `external_deps_packaged_entry_scan.log` L28-L30) | Med | 오프라인 시 LinkCardFallback로 하향(현재도 fallback 존재) |
| `https://img.youtube.com/*` (thumbnail) | `components/items/VideoPlayerObject.tsx` L35/L39; `MonthlySpread.tsx` L182 등 (상세는 로그) | 미포함 (근거: `external_deps_packaged_entry_scan.log` L36-L38) | Low | 썸네일 실패 시 placeholder/none 처리(현 상태는 이미지 fallback URL만 존재) |
| `https://www.youtube-nocookie.com/embed/*` | `components/EmbedPreviewModal.tsx` L16/L20 | 미포함 (근거: `external_deps_packaged_entry_scan.log` L32-L34) | Med | 오프라인 시 프리뷰 “미확인/실패” UX 안내(현재 timedOut UI 존재 여부는 별도 확인) |
| `https://images.unsplash.com/*`, `https://via.placeholder.com/*` | `components/CreationModal.tsx` L113/L156/L167/L179 | 미포함 (근거: `external_deps_packaged_entry_scan.log` L44-L50) | Low | 기본 이미지들을 로컬 asset로 교체(사용자 업로드가 주 경로) |
| `https://i.ibb.co/*` (keyring default) | `utils/theme.ts` L99; `hooks/useAppState.ts` L44; `services/fileStorage.ts` L242 | 미포함 (근거: `external_deps_packaged_entry_scan.log` L40-L42) | Med | 기본 keyring 이미지를 앱에 포함(오프라인 기본 테마 깨짐 방지) |

##### PHASE 1A-3 결론(3줄, packaged 산출물 기준)

- **(참고, PATCH 3 이전 스캔) 패키징 산출물에 네트워크 의존이 남아있다**: `app.asar`에서 `esm.sh`/`importmap`/`cdn.tailwindcss.com`/`fonts.googleapis.com` 매칭 확인 (근거: `external_deps_scan_packaged.log` 예: L10-L15, L24, L28, L232-L233).
- **(참고, PATCH 3 이전 스캔) 영향 구분**: `esm.sh`/`importmap`는 앱 부팅/렌더러 로딩 자체 리스크(High), `cdn.tailwindcss.com` 및 `fonts.googleapis.com`는 스타일/폰트 리스크(Med) (근거: 동일 로그의 패턴 섹션).
- **(참고, PATCH 3 이전 스캔) 1/20 전 대응(결정안, 구현 금지)**: “importmap+esm.sh 제거(번들 내장)”을 1순위로 결정하고, Tailwind/웹폰트도 로컬 포함으로 전환 여부를 결정한다.

##### PHASE 1A-4 결론(3줄, PACKAGED 엔트리 HTML 기준 / 정적 근거)

- **PACKAGED 엔트리 기준: 부팅/렌더링 자체를 깨는 외부 의존(High)은 확인되지 않음**: 엔트리 HTML(`../dist/index.html`)에서 `importmap`/`esm.sh` 0건 (근거: `external_deps_packaged_entry_trace.log` L7-L9 + `blocker1_packaged_trace.log` L130-L134).
- **남아있는 외부 의존 Top 3(영향도)**: `cdn.tailwindcss.com`(Med), `fonts.googleapis.com`/`fonts.gstatic.com`(Med), `cdn.jsdelivr.net`(Med) (근거: `external_deps_packaged_entry_scan.log` L6, L10-L16, L19-L22).
- **1/20 전 대응 우선순위(제안만, 구현 금지)**: (1) Tailwind CDN 로컬 번들링, (2) 폰트(Google Fonts + jsDelivr woff) 로컬 포함/대체, (3) 임베드 스크립트는 엔트리 HTML 미포함이므로 해당 컴포넌트 fallback 정책만 유지 (근거: 엔트리 HTML 스캔의 “no matches”: `external_deps_packaged_entry_scan.log` L24-L50).

#### PHASE 1B — localStorage 누적/캐시 키(dingel:*) 결론(증거 확정)

원본 로그: `docs/RELEASE_WIN_20260120_raw/storage_cache_scan.log`
실측 로그(트리거 후): `docs/RELEASE_WIN_20260120_raw/storage_cache_runtime_after_use.log`

##### 정적 위험(코드 기준)

- **누적 가능 여부**: **누적 가능(정적 근거 기준)**  
  - 근거(생성/패턴): `storage_cache_scan.log` L11-L13 (`dingel:ohaasa:cache:${todayKey}:${ohaasaSign}`, `dingel:calendarMarquee:YYYY-MM`)  
  - 근거(저장): `storage_cache_scan.log` L18-L21 (MonthlySpread의 `localStorage.setItem(cacheKey, ...)`, `setItem(OHAASA_SIGN_KEY, ...)`) + `storage_cache_scan.log` L24-L25 (MarqueeField `setItem(storageKey, ...)`)  
  - 근거(삭제 없음): `storage_cache_scan.log` L29-L35 (“removeItem/clear targeting 'dingel:' keys” = No matches)

- **정책 필요 여부(최근 N일/최근 N개/TTL)**: **정책 필요(제안만, 구현 금지)**  
  - 판단 근거: 위 “삭제 없음” + 키 템플릿에 날짜/월이 포함되어 키가 증가 가능한 구조(`storage_cache_scan.log` L12-L13)

##### 실측 결과(dev에서 1회 트리거 후)

- **트리거 수행(자동)**: 전광판 입력 저장 + 오하아사 별자리 선택 1회  
  - 근거: `storage_cache_runtime_after_use.log` L5: `EXIT_CODE=0`
- **실제 생성된 dingel:* 키(개수/예시)**: 2개  
  - 근거: `storage_cache_runtime_after_use.log` L2-L4
  - 예시:
    - `dingel:calendarMarquee:2026-01` 값=`WIN_RELEASE_20260120` (`storage_cache_runtime_after_use.log` L3)
    - `dingel:ohaasa:selectedSign` 값=`aries` (`storage_cache_runtime_after_use.log` L3)

### 수동 QA 체크리스트

- (작성 예정) “미확인” 항목은 미확인으로 남김

#### Windows 배포 직전 최소 QA(30~40분)

아래 항목은 **수동 실행 후 PASS/FAIL을 기입**합니다.

##### 1) 설치/첫 실행(하얀 화면 없음)

- **PASS/FAIL**: [ ]
- **재현(3줄)**:
  - (1) Windows 설치 파일(또는 `release/win-unpacked/Digital Scrap Diary.exe`)로 실행
  - (2) 첫 실행 시 메인 화면 로딩까지 대기(최소 30초)
  - (3) 화면 렌더링/상호작용(클릭/스크롤) 가능한지 확인
- **기대결과(1줄)**: 하얀 화면(white screen) 없이 UI가 정상 표시되고 입력이 가능하다.

##### 2) 링크 카드 3개 추가 + 드래그/회전/크기변경

- **PASS/FAIL**: [ ]
- **재현(3줄)**:
  - (1) 링크 입력으로 임의 URL 3개를 추가(예: 트위터/유튜브/일반 링크)
  - (2) 각 카드에 대해 드래그로 위치 이동
  - (3) 각 카드에 대해 회전/크기변경(리사이즈) 조작 수행
- **기대결과(1줄)**: 3개 카드 모두 드래그/회전/리사이즈가 동작하고 크래시/멈춤이 없다.

##### 3) 종료→재실행 후 그대로 유지

- **PASS/FAIL**: [ ]
- **재현(3줄)**:
  - (1) (2)에서 만든 카드 3개 상태를 그대로 둔 채 앱 종료
  - (2) 앱을 다시 실행
  - (3) 동일 날짜/레이아웃에서 카드/위치/회전/크기 유지 여부 확인
- **기대결과(1줄)**: 종료 전 상태가 재실행 후에도 동일하게 복원된다.

##### 4) 백업→초기화→복원

- **PASS/FAIL**: [ ]
- **재현(3줄)**:
  - (1) 백업 기능으로 현재 데이터를 파일로 내보내기(백업 파일 생성 확인)
  - (2) 초기화 기능으로 현재 페이지/데이터를 비우기(초기화 반영 확인)
  - (3) 백업 파일을 다시 불러와 복원
- **기대결과(1줄)**: 초기화로 삭제된 데이터가 백업 복원 후 정상적으로 돌아온다.

##### 5) PNG 내보내기

- **PASS/FAIL**: [ ]
- **재현(3줄)**:
  - (1) 임의의 아이템이 있는 상태에서 PNG 내보내기 실행
  - (2) 저장 경로 선택 및 저장 완료 확인
  - (3) 파일을 외부 뷰어로 열어 내용 확인
- **기대결과(1줄)**: PNG 파일이 생성되며 화면 내용이 누락/깨짐 없이 저장된다.

##### 6) 인터넷 끊고 실행(앱 부팅 가능 여부 / 임베드 실패 허용 여부 구분)

- **PASS/FAIL**: [ ]
- **재현(3줄)**:
  - (1) 네트워크를 끊은 상태(와이파이 OFF/이더넷 분리)에서 앱 실행
  - (2) 앱이 부팅/렌더링 가능한지 확인(하얀 화면 여부 포함)
  - (3) 외부 임베드(트위터/인스타/유튜브 등) 로딩 실패 시에도 앱이 정상 동작 가능한지 확인
- **기대결과(1줄)**: **앱 부팅은 가능**해야 하며, 임베드 실패는 “허용”되더라도 앱이 멈추거나 하얀 화면이 되면 안 된다.

### 빌드-배포 절차

- (작성 예정) Windows Electron 빌드/패키징/서명/업로드 절차

### 변경 로그

#### PATCH 3 — WIN_RELEASE_BLOCKER_1(importmap/esm.sh 제거)

- **변경 파일**: `index.html`
- **변경 요약(3줄)**:
  - `index.html`의 `<script type="importmap">...</script>` 블록 제거
  - `esm.sh` 기반 CDN import 경로 제거(오프라인 부팅 리스크 차단 목적)
  - 기타 외부 의존(Tailwind CDN/폰트)은 변경 없음(PATCH 3 범위 밖)
- **검증 PASS 근거**:
  - `patch3_tsc_noemit.log` L5: `EXIT_CODE=0`
  - `patch3_build.log` L29: `EXIT_CODE=0`
  - `patch3_ui_selftest.log` L453: `EXIT_CODE=0`
  - `patch3_electron_compile.log` L9: `EXIT_CODE=0`
- **회귀 리스크(1줄)**: 만약 runtime에서 importmap을 실제로 사용 중이었다면 일부 모듈 로딩 실패 가능(단, build/selftest로 감지될 확률 높음).

#### PATCH 1 — TEXT_DATA_KEY 하드코딩 제거(최소 변경)

- **변경 파일**: `hooks/useLayoutHandlers.ts`
- **변경 요약(3줄)**:
  - `localStorage.setItem('smart_scrap_text_data', ...)` 2곳을 `localStorage.setItem(TEXT_DATA_KEY, ...)`로 치환
  - `TEXT_DATA_KEY`는 `constants/appConstants.ts`의 동일 문자열 상수를 사용(키 문자열 자체는 동일)
  - 로직/동작 변경 없음(상수 참조로만 통일)
- **검증 결과(PASS 근거)**:
  - `patch1_tsc_noemit.log` L1: `EXIT_CODE=0`
  - `patch1_build.log` L18: `EXIT_CODE=0` (경고 유지: `patch1_build.log` L13)
  - `patch1_ui_selftest.log` L457: `EXIT_CODE=0`
  - `patch1_electron_compile.log` L5: `EXIT_CODE=0`
- **회귀 리스크(1줄)**: Low — 저장 키 문자열이 동일하므로 기존 데이터 호환에 영향 없음(상수 참조로만 변경).

#### PATCH 2 — window.__dsd_* 플래그 cleanup(가능하면)

- **변경 요약/근거**:
  - `components/DesktopApp.tsx`: `window.__dsd_isInteracting` 설정 effect에 cleanup 추가(언마운트 시 `false`로 reset)
  - `components/mobile/MobileApp.tsx`: `window.__dsd_isDraggingItem` 설정 effect에 cleanup 추가(언마운트 시 `false`로 reset)
- **왜 안전한지(1줄)**: UI 상태를 나타내는 전역 플래그를 “언마운트 시 false로 되돌리는 것”만 추가하여, 런타임 로직/키/데이터 포맷을 바꾸지 않음.
- **가능한 회귀(1줄)**: 컴포넌트 언마운트 타이밍에 플래그가 즉시 false로 리셋되어, 매우 드문 케이스에서 “드래그 중” 판정이 빨리 해제되는 UX 차이가 생길 수 있음(미확인).
- **검증 결과(PASS 근거)**:
  - `patch2_tsc_noemit.log` L1: `EXIT_CODE=0`
  - `patch2_build.log` L18: `EXIT_CODE=0` (경고 유지: `patch2_build.log` L13)
  - `patch2_ui_selftest.log` L457: `EXIT_CODE=0`
  - `patch2_electron_compile.log` L5: `EXIT_CODE=0`

---

### 현재 브랜치/Dirty 여부 (근거 기반)

- **브랜치**: `electron-release` (근거: `docs/RELEASE_WIN_20260120_raw/log_git_snapshot.txt` L1)
- **작업트리 상태**: Dirty (근거: `docs/RELEASE_WIN_20260120_raw/log_git_snapshot.txt` L6-L61)


