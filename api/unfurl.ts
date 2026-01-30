import type { VercelRequest, VercelResponse } from '@vercel/node';

// ═══════════════════════════════════════════════════════
// 🔒 보안: Allowlist 도메인
// ═══════════════════════════════════════════════════════
const ALLOWED_DOMAINS = [
  'aladin.co.kr',
  'www.aladin.co.kr',
  'google.com',
  'www.google.com',
  'maps.google.com',
  'goo.gl', // Google 단축 URL
];

// ═══════════════════════════════════════════════════════
// 🔒 보안: SSRF 방지
// ═══════════════════════════════════════════════════════
function isAllowedDomain(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(allowed => 
    hostname === allowed || hostname.endsWith(`.${allowed}`)
  );
}

function isPrivateIP(hostname: string): boolean {
  // localhost, private IP 차단
  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^::1$/,
    /^fe80:/i,
  ];
  
  return privatePatterns.some(pattern => pattern.test(hostname));
}

// ═══════════════════════════════════════════════════════
// 📦 메모리 캐시 (단순 구현)
// ═══════════════════════════════════════════════════════
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1시간

// ═══════════════════════════════════════════════════════
// 🔍 OpenGraph 메타 파싱
// ═══════════════════════════════════════════════════════
function extractMetaTags(html: string): any {
  const meta: any = {};
  
  // OpenGraph tags
  const ogRegex = /<meta\s+property=["']og:([^"']+)["']\s+content=["']([^"']+)["']\s*\/?>/gi;
  let match;
  while ((match = ogRegex.exec(html)) !== null) {
    meta[`og:${match[1]}`] = match[2];
  }
  
  // Twitter Card tags
  const twitterRegex = /<meta\s+name=["']twitter:([^"']+)["']\s+content=["']([^"']+)["']\s*\/?>/gi;
  while ((match = twitterRegex.exec(html)) !== null) {
    meta[`twitter:${match[1]}`] = match[2];
  }
  
  // Standard meta tags
  const descRegex = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']\s*\/?>/i;
  const descMatch = html.match(descRegex);
  if (descMatch) {
    meta.description = descMatch[1];
  }
  
  // Title
  const titleRegex = /<title>([^<]+)<\/title>/i;
  const titleMatch = html.match(titleRegex);
  if (titleMatch) {
    meta.title = titleMatch[1];
  }
  
  return meta;
}

// ═══════════════════════════════════════════════════════
// 🗺️ Google Maps Embed URL 변환
// ═══════════════════════════════════════════════════════
function extractGoogleMapsEmbed(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // pb= 파라미터가 있으면 embed URL 생성 가능
    const pb = urlObj.searchParams.get('pb');
    if (pb) {
      return `https://www.google.com/maps/embed?pb=${pb}`;
    }
    
    // place_id가 있으면 사용
    const placeId = urlObj.searchParams.get('place_id');
    if (placeId) {
      return `https://www.google.com/maps/embed/v1/place?key=&q=place_id:${placeId}`;
    }
    
    return null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// 🌐 Main Handler
// ═══════════════════════════════════════════════════════
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { url } = req.body;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // ═══════════════════════════════════════════════════════
  // 🔒 보안 검증
  // ═══════════════════════════════════════════════════════
  try {
    const urlObj = new URL(url);
    
    // 1. http/https만 허용
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return res.status(400).json({ error: 'Invalid protocol' });
    }
    
    // 2. Private IP 차단
    if (isPrivateIP(urlObj.hostname)) {
      return res.status(403).json({ error: 'Private IP not allowed' });
    }
    
    // 3. Allowlist 검증
    if (!isAllowedDomain(urlObj.hostname)) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  
  // ═══════════════════════════════════════════════════════
  // 📦 캐시 확인
  // ═══════════════════════════════════════════════════════
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✅ Cache hit:', url);
    return res.status(200).json(cached.data);
  }
  
  // ═══════════════════════════════════════════════════════
  // 🌐 Fetch HTML
  // ═══════════════════════════════════════════════════════
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DigitalScrapDiary/1.0)',
      },
      redirect: 'follow', // 최대 20회 리다이렉트 (fetch 기본값)
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // 최종 URL이 allowlist인지 재검증
    const finalUrl = response.url;
    const finalUrlObj = new URL(finalUrl);
    if (!isAllowedDomain(finalUrlObj.hostname)) {
      return res.status(403).json({ error: 'Redirect to disallowed domain' });
    }
    
    // 응답 크기 제한 (1MB)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 1024) {
      return res.status(413).json({ error: 'Response too large' });
    }
    
    const html = await response.text();
    
    // ═══════════════════════════════════════════════════════
    // 🔍 메타 태그 파싱
    // ═══════════════════════════════════════════════════════
    const meta = extractMetaTags(html);
    
    // Platform 판별
    let platform = 'link';
    if (url.includes('aladin.co.kr')) {
      platform = 'aladin';
    } else if (url.includes('google.com/maps') || url.includes('maps.google.com')) {
      platform = 'googlemap';
    }
    
    // Google Maps embed URL 추출
    let embedUrl = null;
    if (platform === 'googlemap') {
      embedUrl = extractGoogleMapsEmbed(finalUrl);
    }
    
    // 결과 구성
    const result = {
      url: finalUrl,
      platform,
      title: meta['og:title'] || meta['twitter:title'] || meta.title || '',
      description: meta['og:description'] || meta['twitter:description'] || meta.description || '',
      image: meta['og:image'] || meta['twitter:image'] || '',
      siteName: meta['og:site_name'] || (platform === 'aladin' ? '알라딘' : platform === 'googlemap' ? 'Google Maps' : ''),
      favicon: `/favicon-${platform}.ico`,
      embedUrl,
      type: meta['og:type'] || 'website',
    };
    
    // 캐시 저장
    cache.set(url, { data: result, timestamp: Date.now() });
    
    console.log('✅ Unfurl success:', { url, platform });
    return res.status(200).json(result);
    
  } catch (error: any) {
    console.error('❌ Unfurl error:', error.message);
    
    // ═══════════════════════════════════════════════════════
    // 🛡️ 폴백 응답
    // ═══════════════════════════════════════════════════════
    const fallback = {
      url,
      platform: url.includes('aladin.co.kr') ? 'aladin' : url.includes('google.com/maps') ? 'googlemap' : 'link',
      title: url.includes('aladin.co.kr') ? '알라딘 도서' : url.includes('google.com/maps') ? 'Google Maps 위치' : '링크',
      description: '메타데이터를 가져올 수 없습니다',
      image: '',
      siteName: url.includes('aladin.co.kr') ? '알라딘' : url.includes('google.com/maps') ? 'Google Maps' : '',
      favicon: '',
      embedUrl: null,
      type: 'website',
      fallback: true,
    };
    
    return res.status(200).json(fallback);
  }
}


