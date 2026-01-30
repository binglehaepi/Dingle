/**
 * 정적 HTML 템플릿 생성
 * 
 * 추출된 DOM 페이지들을 단일 HTML 파일로 조합
 */

export interface PageData {
  type: 'monthly' | 'scrapbook';
  html: string;
  styles: string;
  cssVars: Record<string, string>;
  date?: string;
  dates?: string[]; // monthly 타입의 경우 모든 날짜 목록
}

/**
 * 여러 페이지를 단일 HTML로 결합
 */
export function combinePages(
  pages: PageData[],
  stylePref: any,
  includeEmbeds: boolean = true
): string {
  // 모든 페이지의 스타일 통합
  const allStyles = pages.map(p => p.styles).filter(Boolean).join('\n');
  
  // CSS Variables 통합 (첫 페이지 기준)
  const cssVars = pages[0]?.cssVars || {};
  const cssVarsString = Object.entries(cssVars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ');

  // 페이지 메타데이터
  const pagesMeta = pages.map((p, i) => ({
    idx: i,
    type: p.type,
    date: p.date || '',
    title: p.type === 'monthly' ? '월간 대시보드' : formatDateTitle(p.date)
  }));

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="Digital Scrap Diary">
  <title>다이어리 - Exported</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Nanum+Gothic:wght@400;700;800&family=Noto+Sans+KR:wght@100;300;400;500;700;900&display=swap" rel="stylesheet">
  
  <style>
    /* CSS Variables from app */
    :root {
      ${cssVarsString}
      --app-h: 100vh;
    }
    
    /* 공통 스타일 */
    * {
      box-sizing: border-box;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      font-family: var(--app-font, "Noto Sans KR", system-ui, sans-serif);
      background-color: var(--app-background, #ffffff);
      color: var(--text-color-primary, #764737);
      overflow: hidden;
    }
    
    /* 편집 기능 비활성화 */
    * {
      user-select: none;
    }
    
    button, input, textarea, select {
      pointer-events: none !important;
    }
    
    /* 인터랙티브 요소만 활성화 */
    a, iframe, video, audio {
      pointer-events: auto !important;
    }
    
    .nav-button, .nav-bar * {
      pointer-events: auto !important;
      user-select: none !important;
    }
    
    /* 달력 셀 클릭 활성화 */
    [data-diary-date] {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
    
    /* 페이지 시스템 */
    .diary-page {
      display: none;
      width: 100%;
      height: 100%;
      overflow: auto;
    }
    
    .diary-page.active {
      display: block;
    }
    
    /* 네비게이션 바 - 얇고 컴팩트하게 */
    .nav-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      padding: 6px 16px;
      border-top: 1px solid #e8e4dd;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      z-index: 9999;
      box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.05);
    }
    
    .nav-button {
      padding: 6px 14px;
      background: #f5f5f5;
      border: 1px solid #e8e4dd;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-family: 'Nanum Gothic', sans-serif;
      color: #5a4a42;
      transition: all 0.2s;
      white-space: nowrap;
    }
    
    .nav-button:hover {
      background: #e8e4dd;
      transform: translateY(-1px);
    }
    
    .nav-button:active {
      transform: translateY(0);
    }
    
    .nav-button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
    }
    
    .nav-button:disabled:hover {
      background: #f5f5f5;
    }
    
    .page-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Nanum Myeongjo', serif;
      color: #7a6a5a;
      font-size: 12px;
    }
    
    .page-title {
      font-weight: 600;
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .page-counter {
      color: #9a8a7a;
      font-size: 11px;
    }
    
    /* 추출된 스타일 */
    ${allStyles}
  </style>
  
  ${includeEmbeds ? generateEmbedScripts() : ''}
</head>
<body>
  <!-- 모든 페이지 -->
  ${pages.map((page, idx) => `
  <div class="diary-page ${idx === 0 ? 'active' : ''}" 
       data-page="${idx}" 
       data-type="${page.type}" 
       ${page.date ? `data-date="${page.date}"` : ''}>
    ${page.html}
  </div>
  `).join('\n')}
  
  <!-- 네비게이션 바 -->
  <div class="nav-bar">
    <button class="nav-button" id="prevBtn">◀ 이전</button>
    
    <div class="page-info">
      <span class="page-title" id="pageTitle">${pagesMeta[0]?.title || ''}</span>
      <span class="page-counter" id="pageCounter">1 / ${pages.length}</span>
    </div>
    
    <button class="nav-button" id="nextBtn">다음 ▶</button>
  </div>
  
  <script>
    // 페이지 데이터
    const pages = ${JSON.stringify(pagesMeta)};
    let currentPage = 0;
    const totalPages = pages.length;
    
    // 페이지 전환
    function showPage(idx) {
      if (idx < 0 || idx >= totalPages) return;
      
      // 모든 페이지 숨기기
      document.querySelectorAll('.diary-page').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
      });
      
      currentPage = idx;
      
      // UI 업데이트
      const page = pages[idx];
      document.getElementById('pageTitle').textContent = page.title;
      document.getElementById('pageCounter').textContent = \`\${idx + 1} / \${totalPages}\`;
      document.getElementById('prevBtn').disabled = idx === 0;
      document.getElementById('nextBtn').disabled = idx === totalPages - 1;
      
      // 페이지 최상단으로 스크롤
      document.querySelector('.diary-page.active').scrollTop = 0;
    }
    
    // 버튼 이벤트
    document.getElementById('prevBtn').addEventListener('click', () => {
      if (currentPage > 0) showPage(currentPage - 1);
    });
    
    document.getElementById('nextBtn').addEventListener('click', () => {
      if (currentPage < totalPages - 1) showPage(currentPage + 1);
    });
    
    // 키보드 네비게이션
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentPage > 0) showPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentPage < totalPages - 1) showPage(currentPage + 1);
      }
    });
    
    // 월간 뷰 달력 클릭 이벤트
    document.addEventListener('click', (e) => {
      const dateCell = e.target.closest('[data-diary-date]');
      if (dateCell) {
        const targetDate = dateCell.dataset.diaryDate;
        console.log('[Navigation] Calendar cell clicked:', targetDate);
        
        const pageIdx = pages.findIndex(p => p.type === 'scrapbook' && p.date === targetDate);
        if (pageIdx >= 0) {
          console.log('[Navigation] Navigating to page:', pageIdx);
          showPage(pageIdx);
        } else {
          console.warn('[Navigation] No scrapbook page found for date:', targetDate);
        }
      }
    });
    
    // 초기화
    console.log('[Diary Export] Loaded', totalPages, 'pages');
    console.log('[Diary Export] Page details:', pages);
    
    // file:// 프로토콜 경고
    if (window.location.protocol === 'file:') {
      console.warn('[Diary Export] ⚠️ This HTML is being viewed from file:// protocol.');
      console.warn('[Diary Export] For full functionality (Twitter, Instagram, Pinterest embeds), please:');
      console.warn('[Diary Export] 1. Upload to a web server, OR');
      console.warn('[Diary Export] 2. Use a local web server (e.g., python -m http.server)');
    }
    
    showPage(0);
  </script>
</body>
</html>`;
}

/**
 * 날짜를 보기 좋은 형식으로 변환
 */
function formatDateTitle(date?: string): string {
  if (!date) return '페이지';
  
  try {
    const [year, month, day] = date.split('-');
    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  } catch {
    return date;
  }
}

/**
 * 임베드 스크립트 생성
 */
function generateEmbedScripts(): string {
  return `
  <script>
    // file:// 프로토콜에서는 외부 스크립트 로드 불가
    // HTTP/HTTPS에서만 임베드 스크립트 로드
    if (window.location.protocol !== 'file:') {
      // Twitter/X Embed
      const twitterScript = document.createElement('script');
      twitterScript.async = true;
      twitterScript.src = 'https://platform.twitter.com/widgets.js';
      twitterScript.charset = 'utf-8';
      document.head.appendChild(twitterScript);
      
      // Instagram Embed
      const instaScript = document.createElement('script');
      instaScript.async = true;
      instaScript.src = 'https://www.instagram.com/embed.js';
      document.head.appendChild(instaScript);
      
      // Pinterest Embed
      const pinterestScript = document.createElement('script');
      pinterestScript.async = true;
      pinterestScript.defer = true;
      pinterestScript.src = 'https://assets.pinterest.com/js/pinit.js';
      document.head.appendChild(pinterestScript);
      
      console.log('[Embeds] External embed scripts loaded for', window.location.protocol);
    } else {
      console.warn('[Embeds] Cannot load external scripts from file:// protocol. Please serve this HTML via HTTP/HTTPS for full embed functionality.');
    }
  </script>
  
  <!-- Spotify Embed (iframe, works in file://) -->
  <!-- YouTube Embed (iframe, works in file://) -->
  `;
}

