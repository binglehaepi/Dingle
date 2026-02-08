/**
 * App CSS extracted from index.html
 * 
 * 앱의 index.html <style> 태그에서 추출한 CSS.
 * Note Mode, Overlay Mode, PDF Export Mode 등 Electron 전용 섹션은 제외.
 * 
 * ⚠️ 이 파일은 _extractCss.js 스크립트로 자동 생성됩니다.
 *    수동으로 편집하지 마세요. index.html의 CSS가 변경되면 스크립트를 다시 실행하세요.
 */

export const APP_CSS = `/* ======================================================
         Webfont (3종은 @font-face로 로드)
         ====================================================== */
      @font-face {
        font-family: "Gmarket Sans";
        src: url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansMedium.woff")
          format("woff");
        font-weight: normal;
        font-style: normal;
      }

      @font-face {
        font-family: "Gyeonggi Batang";
        src: url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GyeonggiTitleM.woff")
          format("woff");
        font-weight: normal;
        font-style: normal;
      }

      @font-face {
        font-family: "Cafe24 Dongdong";
        src: url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/Cafe24Dongdong.woff")
          format("woff");
        font-weight: normal;
        font-style: normal;
      }

      /* ======================================================
         iOS Safari 높이 문제 해결
         ====================================================== */
      :root {
        --app-h: 100vh;
      }
      @supports (height: 100dvh) {
        :root {
          --app-h: 100dvh;
        }
      }

      /* ======================================================
         ✅ 기본 팔레트 (신규 변수 토큰)
         - 앱 전체는 이 변수들만 쓰도록 통일
         - 실제 값은 React에서 paletteToCSSVars로 덮어씌워짐
         ====================================================== */
      :root {
        /* ===== 앱 / 노트 구조 ===== */
        --app-background: #ffffff;
        --note-paper-background: #f7f5ed;
        --note-outer-border-color: #764737;
        --note-center-fold-line-color: rgba(148, 163, 184, 0.3);

        /* ===== 위젯 공통 ===== */
        --ui-stroke-color: #330a0a;
        --ui-stroke-width: 1px;
        --ui-text-color: var(--text-color-primary, #764737);
        --widget-border-color: var(--ui-stroke-color, rgba(148, 163, 184, 0.6));
        --widget-surface-background: #ffffff;
        --widget-input-background: #fef5f5;

        /* ===== Note paper background image ===== */
        --note-paper-background-image: none;
        --note-paper-background-image-layered: none;
        --note-paper-background-size: contain;
        --center-fold-shadow-opacity: 0.18;

        /* spread center shadow (default: soft) */
        --spread-center-shadow-enabled: 1;
        --spread-center-shadow-width: 44px;
        --spread-center-shadow-rgba: rgba(93, 64, 55, 0.14);

        /* ===== 위젯 상단 바 ===== */
        --profile-header-bar-bg: #f9d4f0;
        --goals-header-bar-bg: #fedfdc;
        --dday-header-bar-bg: #fcf5c8;
        --ohaasa-header-bar-bg: #ebe7f5;
        --bucket-header-bar-bg: #eff1aa;

        /* ===== 달력 ===== */
        /* 날짜/월 네비 헤더 배경(구버전 테마 호환: weekday 헤더로 fallback) */
        --calendar-date-header-bg: var(--calendar-weekday-header-bg);
        --calendar-weekday-header-bg: #f7f5ed; /* SUN~SAT 줄 */
        --calendar-grid-line-color: var(--ui-stroke-color, rgba(148, 163, 184, 0.6)); /* 달력 선 */
        --calendar-cell-background: #ffffff; /* 셀 기본 배경 */
        --calendar-today-highlight-bg: #fffce1; /* 오늘 하이라이트 */

        /* ===== 월 탭 ===== */
        --month-tab-bg: #ffffff;
        --month-tab-bg-active: #ffffff;
        --month-tab-border-color: rgba(148, 163, 184, 0.6);
        --month-tab-text-color: #764737;

        /* ===== 키링 ===== */
        --keyring-metal-color: #764737;
        --keyring-frame-border-color: rgba(148, 163, 184, 0.6);

        /* ===== CD 플레이어 ===== */
        --cd-widget-background: #f4f5e1;
        --cd-disc-color: #1e293b;
        --cd-screen-bg: #ffffff;
        --cd-button-bg: #ffffff;
        --cd-dot-color: #eff1aa;

        /* ===== 글로벌 텍스트 ===== */
        --text-color-primary: #764737;

        /* ===== UI 버튼/상태 토큰 (테마 팔레트와 1:1) ===== */
        --ui-primary-bg: #3b82f6;
        --ui-primary-text: #ffffff;
        --ui-primary-hover: #2563eb;

        --ui-danger-bg: #ef4444;
        --ui-danger-text: #ffffff;
        --ui-danger-hover: #dc2626;

        --ui-success-bg: #22c55e;
        --ui-success-text: #ffffff;
        --ui-success-hover: #16a34a;

        /* 일요일 텍스트(기본: danger 계열) */
        --ui-sunday-text: var(--ui-danger-bg);
      }

      /* ======================================================
         ✅ 반응형 스케일링 시 선명도 유지
         ====================================================== */
      .overlayViewport,
      .overlayViewport * {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* Transform 스케일 시 블러 방지 */
      .overlayViewport {
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform-style: preserve-3d;
        -webkit-transform-style: preserve-3d;
      }

      /* ======================================================
           ✅ 레거시 호환 별칭 (남아있는 구형 코드 깨짐 방지)
           - 구형 변수는 "신규 변수"를 가리키게만 해둠
           - 점차 사용처를 제거해가면 됨
           ====================================================== */
      :root {
        --desk-bg: var(--app-background);
        --paper-bg: var(--note-paper-background);
        --border-color: var(--widget-border-color);
        --line-color: var(--widget-border-color);
        --text-color: var(--text-color-primary);
        --widget-bg: var(--widget-input-background);

        --bar-profile: var(--profile-header-bar-bg);
        --bar-goals: var(--goals-header-bar-bg);
        --bar-monthly: var(--goals-header-bar-bg);
        --bar-dday: var(--dday-header-bar-bg);
        --bar-ohaasa: var(--ohaasa-header-bar-bg);
        --bar-bucket: var(--bucket-header-bar-bg);

        --calendar-bar: var(--calendar-weekday-header-bg);
        --calendar-today-bg: var(--calendar-today-highlight-bg);
        --calendar-cell-bg: var(--calendar-cell-background);
        --today-bg: var(--calendar-today-highlight-bg);

        --cd-bg: var(--cd-widget-background);
        --cd-dots: var(--cd-dot-color);

        --tab-text: var(--month-tab-text-color);
        --tab-fill: var(--month-tab-bg);
        --tab-fill-active: var(--month-tab-bg-active);
        --tab-border: var(--month-tab-border-color);

        --keyring-main: var(--keyring-metal-color);
        --keyring-accent: var(--keyring-frame-border-color);
      }

      /* ======================================================
         폰트 시스템 (11종)
         ====================================================== */
      [data-font="noto"] {
        --app-font: "Noto Sans KR", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      }
      [data-font="nanum-gothic"] {
        --app-font: "Nanum Gothic", sans-serif;
      }
      [data-font="nanum-myeongjo"] {
        --app-font: "Nanum Myeongjo", serif;
      }
      [data-font="black-han-sans"] {
        --app-font: "Black Han Sans", sans-serif;
      }
      [data-font="do-hyeon"] {
        --app-font: "Do Hyeon", sans-serif;
      }
      [data-font="jua"] {
        --app-font: "Jua", sans-serif;
      }
      [data-font="cute-font"] {
        --app-font: "Cute Font", cursive;
      }
      [data-font="gamja-flower"] {
        --app-font: "Gamja Flower", cursive;
      }
      [data-font="gmarket"] {
        --app-font: "Gmarket Sans", sans-serif;
      }
      [data-font="gyeonggi"] {
        --app-font: "Gyeonggi Batang", serif;
      }
      [data-font="cafe24"] {
        --app-font: "Cafe24 Dongdong", sans-serif;
      }

      /* 전역 폰트/배경/텍스트 */
      html,
      body,
      #root {
        font-family: var(--app-font, "Noto Sans KR", system-ui, sans-serif) !important;
      }

      /* Tailwind font-sans 등이 폰트 선택을 덮어쓰지 못하게 방지 */
      .font-sans {
        font-family: var(--app-font, "Noto Sans KR", system-ui, sans-serif) !important;
      }

      input,
      button,
      textarea,
      select {
        font-family: inherit;
      }

      body {
        font-family: var(--app-font, "Noto Sans KR", system-ui, sans-serif);
        background-color: var(--app-background, #ffffff);
        color: var(--text-color-primary, #764737);
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      .font-handwriting,
      .font-serif-kr {
        font-family: var(--app-font, "Noto Sans KR", system-ui, sans-serif) !important;
      }

      /* ======================================================
         그림자 완전 제거 (모든 테마)
         ====================================================== */
      .shadow-sm,
      .shadow,
      .shadow-md,
      .shadow-lg,
      .shadow-xl,
      .shadow-2xl,
      .drop-shadow,
      .drop-shadow-md,
      [class*="shadow-"],
      button,
      div,
      input {
        box-shadow: none !important;
      }

      /* 텍스트 그림자만 허용(가독성) */
      .drop-shadow-sm,
      [style*="text-shadow"] {
        filter: none !important;
        box-shadow: none !important;
      }

      /* ======================================================
         격자무늬 완전 제거 (스크랩 페이지 등)
         ====================================================== */
      .bg-grid-pattern {
        background-image: none !important;
        background-size: auto !important;
      }

      /* 자석 그리드 활성화 시에만 표시 */
      .bg-grid-pattern-visible {
        background-size: 20px 20px;
        background-image: linear-gradient(to right, rgba(139, 92, 246, 0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(139, 92, 246, 0.15) 1px, transparent 1px);
        animation: grid-fade-in 0.3s ease-out;
      }

      @keyframes grid-fade-in {
        from {
          background-image: linear-gradient(to right, rgba(0, 0, 0, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.06) 1px, transparent 1px);
        }
        to {
          background-image: linear-gradient(to right, rgba(139, 92, 246, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(139, 92, 246, 0.15) 1px, transparent 1px);
        }
      }

      /* ======================================================
         ✅ 위젯 공통 스타일 (신규 변수 토큰 기준)
         ====================================================== */
      [data-widget] {
        background: var(--widget-surface-background, #ffffff) !important;
        border: 1px solid var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6))) !important;
        border-radius: 8px !important;
        overflow: hidden;
        color: var(--text-color-primary, #764737);
      }

      /* 위젯 상단 바 (공통) */
      [data-widget-bar] {
        height: 28px;
        padding: 0 12px;
        border-bottom: 1px solid var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-color-primary, #764737);
        flex-shrink: 0;
      }

      /* 위젯별 상단 바 배경 */
      [data-widget="profile"] [data-widget-bar] {
        background: var(--profile-header-bar-bg, #f9d4f0);
      }
      [data-widget="goals"] [data-widget-bar] {
        background: var(--goals-header-bar-bg, #fedfdc);
      }
      [data-widget="dday"] [data-widget-bar] {
        background: var(--dday-header-bar-bg, #fcf5c8);
      }
      [data-widget="ohaasa"] [data-widget-bar] {
        background: var(--ohaasa-header-bar-bg, #ebe7f5);
      }
      [data-widget="bucket"] [data-widget-bar] {
        background: var(--bucket-header-bar-bg, #eff1aa);
      }

      /* CD 플레이어 위젯 배경 */
      [data-widget="cd"] {
        background: var(--cd-widget-background, #f4f5e1) !important;
      }

      /* 입력칸/리스트칸 공통 */
      [data-widget-input] {
        background: var(--widget-input-background, #f8fafc) !important;
        border-color: var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6))) !important;
        color: var(--text-color-primary, #764737) !important;
        font-size: 12px !important;
      }

      /* 달력 상단 헤더 */
      [data-calendar-header] {
        /* ⚠️ background(축약)은 background-image까지 리셋하므로 사용 금지 */
        background-color: var(--calendar-date-header-bg, var(--calendar-weekday-header-bg)) !important;
        border-color: var(--calendar-grid-line-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6))) !important;
        box-shadow: none !important;
        height: 60px !important;
        color: var(--text-color-primary, #764737) !important;
      }

      /* 헤더 배경 이미지가 있을 때(오버레이/필터/그림자 완전 제거용) */
      [data-calendar-header][data-has-bg-image="true"] {
        filter: none !important;
        box-shadow: none !important;
      }

      /* 오늘 날짜 셀 */
      [data-today-cell] {
        background: var(--calendar-today-highlight-bg, #fffce1) !important;
      }

      /* 주간모드 안내 pill */
      [data-week-pill] {
        border-color: var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6))) !important;
        color: var(--text-color-primary, #764737) !important;
      }

      /* 월 탭 스타일 */
      [data-month-tab] {
        border-color: var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6))) !important;
        color: var(--month-tab-text-color, var(--text-color-primary, #764737)) !important;
      }

      /* CD 플레이어 장식 점 */
      [data-cd-dots] {
        background: var(--cd-dot-color, #eff1aa) !important;
      }

      /* 달력 칸 배경/선 (전역 오염 방지: 달력 컨테이너 스코프) */
      [data-calendar-grid] [data-ui="calendar-cell"] {
        background-color: var(--calendar-cell-background, #ffffff) !important;
        border-color: var(--calendar-grid-line-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6))) !important;
        color: var(--text-color-primary, #764737) !important;
      }

      /* 오늘 날짜 셀(달력 칸 배경보다 우선) */
      [data-calendar-grid] [data-ui="calendar-cell"][data-today-cell] {
        background-color: var(--calendar-today-highlight-bg, #fffce1) !important;
      }

      /* ======================================================
         🎀 Link/Embed Decoration Presets (outer wrapper only)
         - internal embed DOM은 건드리지 않음
         - 이미지 fetch 금지: CSS + inline SVG(data URI)만 사용
         ====================================================== */
      [data-decoration] {
        /* base: border/shadow는 inline style에서 적용, preset은 여기서 */
        position: relative;
      }

      /* tape: 상단에 테이프 2개 */
      [data-decoration="tape"]::before,
      [data-decoration="tape"]::after {
        content: "";
        position: absolute;
        top: -10px;
        width: 86px;
        height: 26px;
        background: var(--decoration-tape-color, rgba(255,255,255,0.65));
        border: 1px solid var(--decoration-border-color, var(--ui-stroke-color, #330a0a));
        opacity: 0.85;
        z-index: 50;
        pointer-events: none;
        box-shadow: 0 4px 10px rgba(0,0,0,0.12);
        backdrop-filter: blur(2px);
      }
      [data-decoration="tape"]::before {
        left: 18px;
        transform: rotate(-6deg);
      }
      [data-decoration="tape"]::after {
        right: 18px;
        transform: rotate(7deg);
      }

      /* polaroid: 아래쪽 여백이 있는 사진카드 느낌 */
      [data-decoration="polaroid"] {
        background: rgba(255,255,255,0.96);
        padding: 10px 10px 22px;
      }

      /* lace: dotted 기반 + 살짝 겹친 레이스 테두리 느낌 */
      [data-decoration="lace"] {
        border-style: dotted !important;
      }
      [data-decoration="lace"]::before {
        content: "";
        position: absolute;
        inset: 6px;
        border: 2px dotted var(--decoration-border-color, var(--ui-stroke-color, #330a0a));
        border-radius: inherit;
        opacity: 0.35;
        pointer-events: none;
      }

      /* stickerCorners: 4 코너 스티커(내장 SVG) */
      [data-decoration="stickerCorners"]::before {
        content: "";
        position: absolute;
        inset: -8px;
        pointer-events: none;
        z-index: 40;
        background-repeat: no-repeat;
        background-size: 18px 18px;
        background-position: left top, right top, left bottom, right bottom;
        background-image:
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'%3E%3Cpath d='M2 2h10v2H4v8H2z' fill='rgba(255,255,255,0.9)'/%3E%3Cpath d='M2 2h10v2H4v8H2z' fill='none' stroke='rgba(0,0,0,0.15)' stroke-width='1'/%3E%3C/svg%3E"),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'%3E%3Cpath d='M16 2H6v2h8v8h2z' fill='rgba(255,255,255,0.9)'/%3E%3Cpath d='M16 2H6v2h8v8h2z' fill='none' stroke='rgba(0,0,0,0.15)' stroke-width='1'/%3E%3C/svg%3E"),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'%3E%3Cpath d='M2 16h10v-2H4V6H2z' fill='rgba(255,255,255,0.9)'/%3E%3Cpath d='M2 16h10v-2H4V6H2z' fill='none' stroke='rgba(0,0,0,0.15)' stroke-width='1'/%3E%3C/svg%3E"),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'%3E%3Cpath d='M16 16H6v-2h8V6h2z' fill='rgba(255,255,255,0.9)'/%3E%3Cpath d='M16 16H6v-2h8V6h2z' fill='none' stroke='rgba(0,0,0,0.15)' stroke-width='1'/%3E%3C/svg%3E");
      }

      /* 사진 영역 hover 힌트 */
      [data-photo-area] {
        position: relative;
        transition: all 0.2s ease;
      }
      [data-photo-area]:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }
      [data-photo-area]:hover::after {
        content: "";
        position: absolute;
        inset: 0;
        border: 1px dashed var(--widget-border-color, rgba(148, 163, 184, 0.6));
        opacity: 0.5;
        pointer-events: none;
      }

      /* ======================================================
         Paper & Custom Styles
         ====================================================== */
      .bg-custom-paper {
        background-color: var(--note-paper-bg, var(--note-paper-background, #f7f5ed));
        background-image: var(--note-paper-bg-layered, var(--note-paper-background-image-layered, none));
        background-size: var(--note-paper-background-size, contain);
        background-position: center;
        background-repeat: no-repeat;
      }

      /* Note paper surfaces (MonthlySpread uses data-note-paper) */
      [data-note-paper] {
        background-color: var(--note-paper-bg, var(--note-paper-background, #f7f5ed));
        background-image: var(--note-paper-bg-layered, var(--note-paper-background-image-layered, none));
        background-size: var(--note-paper-background-size, contain);
        background-position: center;
        background-repeat: no-repeat;
      }

      /* Note paper surface (safe target; avoids selector misses & bg shorthand issues)
         - Always use the canonical vars: --note-paper-background / --note-paper-background-image-layered
         - IMPORTANT: do NOT use background shorthand here (it can wipe background-image) */
      .note-paper-surface {
        background-color: var(--note-paper-background, #f7f5ed) !important;
        background-image: var(--note-paper-background-image-layered, none) !important;
        background-repeat: no-repeat;
        background-size: var(--note-paper-background-size, contain);
        background-position: center;
      }

      /* Spread center shadow (only on the spread container) */
      .note-paper-surface[data-note-spread] {
        position: relative;
        overflow: hidden;
      }
      .note-paper-surface[data-note-spread]::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: var(--spread-center-shadow-width, 44px);
        pointer-events: none;
        z-index: 1;
        opacity: var(--spread-center-shadow-enabled, 1);
        background: linear-gradient(
          to right,
          transparent,
          var(--spread-center-shadow-rgba, rgba(93, 64, 55, 0.14)) 50%,
          transparent
        );
      }
      .note-paper-surface[data-note-spread] > * {
        position: relative;
        z-index: 2;
      }

      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: var(--widget-border-color, rgba(148, 163, 184, 0.6));
        border-radius: 3px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: var(--text-color-primary, #764737);
      }

      /* Font utilities */
      .font-receipt {
        font-family: "Courier New", monospace;
      }
      .font-barcode {
        font-family: "Courier New", monospace;
      }

      /* Animations */
      @keyframes spin-record {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      .animate-spin-slow {
        animation: spin-record 6s linear infinite;
      }
      .paused-animation {
        animation-play-state: paused;
      }

      @keyframes receipt-print {
        from {
          height: 0;
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          height: auto;
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-receipt {
        animation: receipt-print 0.8s ease-out forwards;
        transform-origin: top;
      }

      @keyframes swing {
        0% {
          transform: rotate(5deg);
        }
        50% {
          transform: rotate(-5deg);
        }
        100% {
          transform: rotate(5deg);
        }
      }
      .animate-swing {
        transform-origin: top center;
        animation: swing 3s ease-in-out infinite;
      }
      .animate-swing:hover {
        animation-play-state: paused;
      }

      /* ======================================================
         별 모양 드래그 핸들 (통통한 꽃잎 버전)
         ====================================================== */
      
      /* 반짝이는 애니메이션 */
      @keyframes star-glow {
        0%, 100% { 
          opacity: 1; 
        }
        50% { 
          opacity: 0.6; 
        }
      }

      /* 호버 시 - 탭 활성화 색상으로 채우기 */
      .diary-drag-handle:hover .star-path {
        fill: var(--month-tab-bg-active, #fef3c7) !important;
        stroke: var(--month-tab-border-color, #D4C5B9) !important;
        stroke-width: 2 !important;
        filter: drop-shadow(0 3px 6px rgba(212, 197, 185, 0.3)) !important;
      }

      /* 드래그 시 - 더 진한 채우기 */
      .diary-drag-handle.dragging .star-path {
        fill: var(--month-tab-bg-active, #fef3c7) !important;
        stroke: var(--month-tab-border-color, #D4C5B9) !important;
        stroke-width: 2.5 !important;
        filter: drop-shadow(0 4px 8px rgba(212, 197, 185, 0.4)) !important;
        opacity: 0.9 !important;
      }

      /* 반응형 - 작은 화면에서는 다이어리 안쪽으로 */
      @media (max-width: 1300px) {
        .diary-drag-handle {
          right: 16px !important;
          bottom: 16px !important;
        }
      }

      .tape-edge {
        mask-image: linear-gradient(135deg, #000 5px, transparent 0),
          linear-gradient(-135deg, #000 5px, transparent 0);
        mask-size: 10px 100%;
        mask-position: bottom;
        mask-repeat: repeat-x;
      }

      .gloss-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          125deg,
          rgba(255, 255, 255, 0.4) 0%,
          rgba(255, 255, 255, 0) 40%,
          rgba(255, 255, 255, 0) 60%,
          rgba(255, 255, 255, 0.2) 100%
        );
        pointer-events: none;
        z-index: 10;
      }

      /* Touch Optimization */
      * {
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
        -webkit-touch-callout: none;
        -webkit-overflow-scrolling: touch;
      }

      .touch-none {
        -webkit-user-select: none;
        user-select: none;
      }

      .touch-manipulation {
        touch-action: manipulation;
      }

      body {
        overscroll-behavior-y: none;
      }

      button:active,
      a:active {
        opacity: 0.8;
      }

      /* 트위터 임베드 */
      .twitter-embed-container {
        max-width: 550px;
        margin: 0 auto;
      }

      .twitter-embed-container blockquote {
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
      }

      .twitter-embed-container iframe {
        max-width: 100% !important;
      }

      .twitter-tweet {
        margin: 0 auto !important;
      }

      /* 내보내기 안전 모드 */
      @media print {
        .export-exclude-embeds .twitter-embed-container,
        .export-exclude-embeds .instagram-embed-container {
          display: none !important;
        }

        .export-exclude-embeds .export-safe-fallback {
          display: block !important;
        }
      }

      .export-safe-mode .twitter-embed-container,
      .export-safe-mode .instagram-embed-container {
        opacity: 0.3;
        pointer-events: none;
      }

      .export-safe-mode .export-safe-fallback {
        opacity: 1;
      }

      /* 테마 아이콘 시스템 */
      .ticon {
        width: 16px;
        height: 16px;
        display: inline-block;
        background: var(--text-color-primary, #764737);
        mask-size: contain;
        mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-size: contain;
        -webkit-mask-repeat: no-repeat;
        -webkit-mask-position: center;
      }

      .ticon-user {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E");
      }

      .ticon-magic {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M7 11H1v2h6v-2zm2.17-3.24L7.05 5.64 5.64 7.05l2.12 2.12 1.41-1.41zM13 1h-2v6h2V1zm5.36 6.05l-1.41-1.41-2.12 2.12 1.41 1.41 2.12-2.12zM17 11v2h6v-2h-6zm-5-2c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm2.83 7.24l2.12 2.12 1.41-1.41-2.12-2.12-1.41 1.41zm-9.19.71l1.41 1.41 2.12-2.12-1.41-1.41-2.12 2.12zM11 23h2v-6h-2v6z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M7 11H1v2h6v-2zm2.17-3.24L7.05 5.64 5.64 7.05l2.12 2.12 1.41-1.41zM13 1h-2v6h2V1zm5.36 6.05l-1.41-1.41-2.12 2.12 1.41 1.41 2.12-2.12zM17 11v2h6v-2h-6zm-5-2c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm2.83 7.24l2.12 2.12 1.41-1.41-2.12-2.12-1.41 1.41zm-9.19.71l1.41 1.41 2.12-2.12-1.41-1.41-2.12 2.12zM11 23h2v-6h-2v6z'/%3E%3C/svg%3E");
      }

      .ticon-image {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E");
      }

      .ticon-heart {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E");
      }`;
