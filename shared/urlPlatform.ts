// shared/urlPlatform.ts
// Single Source of Truth for URL normalization + platform detection.
// - Pure TS utility (no React/DOM dependencies)
// - Rules are intentionally aligned with existing behavior (services/urlParser.ts + api/scrap.ts + services/apiClient.ts)

export type PlatformId =
  | 'twitter'
  | 'instagram'
  | 'pinterest'
  | 'aladin'
  | 'googlemap'
  | 'book'
  | 'youtube'
  | 'spotify'
  | 'tiktok'
  | 'vimeo'
  | 'fashion'
  | 'moving_photo'
  | 'general';

/**
 * URL 정규화 (기존 api/scrap.ts 로직과 동일)
 * - x.com -> twitter.com 통일
 * - 추적 파라미터 제거
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'x.com') {
      urlObj.hostname = 'twitter.com';
    }
    ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'fbclid'].forEach((param) => {
      urlObj.searchParams.delete(param);
    });
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * 플랫폼 판별
 * - 기본 규칙은 services/urlParser.ts의 분기 규칙을 그대로 이식한다.
 * - 단, apiClient/api/scrap에서 쓰는 최소 추가 분기(aladin/google maps)를 포함하되,
 *   urlParser에서는 ScrapType 매핑으로 기존 동작을 유지한다.
 */
export function detectPlatform(inputUrl: string): PlatformId {
  try {
    const urlObj = new URL(inputUrl);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    // Direct file checks (services/urlParser.ts 동일)
    if (pathname.endsWith('.gif') || pathname.endsWith('.webp') || pathname.endsWith('.mp4')) {
      return 'moving_photo';
    }

    // Twitter / X
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter';
    }

    // Instagram
    if (hostname.includes('instagram.com')) {
      return 'instagram';
    }

    // Pinterest
    // NOTE: urlParser 규칙 그대로(도메인 기반). pin.it 등은 현재 동작 변경 방지 위해 포함하지 않음.
    if (hostname.includes('pinterest.com') || hostname.includes('pinterest.co.kr')) {
      return 'pinterest';
    }

    // Books
    // - urlParser: aladin/yes24/amazon -> BOOK
    // - apiClient: aladin은 platform=aladin로 별도 취급
    if (hostname.includes('aladin.co.kr')) return 'aladin';
    if (hostname.includes('yes24.com') || hostname.includes('amazon.com')) return 'book';

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }

    // Spotify
    if (hostname.includes('spotify.com')) {
      return 'spotify';
    }

    // TikTok
    if (hostname.includes('tiktok.com')) {
      return 'tiktok';
    }

    // Vimeo
    if (hostname.includes('vimeo.com')) {
      return 'vimeo';
    }

    // Google Maps (apiClient 전용 분기와 동일한 수준의 최소 판별)
    if (
      (hostname.includes('google.com') && pathname.includes('/maps')) ||
      hostname.includes('maps.google.com') ||
      (hostname.includes('goo.gl') && pathname.includes('/maps'))
    ) {
      return 'googlemap';
    }

    // Fashion heuristic (services/urlParser.ts 동일)
    if (
      hostname.includes('musinsa') ||
      hostname.includes('29cm') ||
      hostname.includes('wconcept') ||
      hostname.includes('kream') ||
      hostname.includes('vogue') ||
      hostname.includes('elle') ||
      hostname.includes('zara') ||
      hostname.includes('hm.com') ||
      hostname.includes('uniqlo') ||
      hostname.includes('nike') ||
      inputUrl.includes('/shop/') ||
      inputUrl.includes('/product/')
    ) {
      return 'fashion';
    }

    return 'general';
  } catch {
    return 'general';
  }
}


