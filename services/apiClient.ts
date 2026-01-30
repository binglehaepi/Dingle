import { ScrapType, ScrapMetadata, type SourceInfo } from "../types";
import { detectPlatform, normalizeUrl } from "../shared/urlPlatform";

// API 엔드포인트 (상대 경로 사용 - Vercel Dev/Production 모두 동작)
const API_BASE_URL = '/api';

// 메모리 캐시 (클라이언트 세션 캐시, 개발용)
const clientCache = new Map<string, { data: ScrapMetadata; timestamp: number }>();
const CLIENT_CACHE_TTL = 1000 * 60 * 5; // 5분

// ═══════════════════════════════════════════════════════
// 🔧 1차 릴리즈: 6개 플랫폼만 지원
// ═══════════════════════════════════════════════════════

/**
 * Twitter URL에서 Tweet ID 추출
 */
function extractTwitterId(url: string): string | null {
  try {
    const patterns = [
      /twitter\.com\/\w+\/status\/(\d+)/,
      /x\.com\/\w+\/status\/(\d+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Instagram URL 감지
 */
function detectInstagram(url: string): string | null {
  try {
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * YouTube URL에서 Video ID 추출
 */
function extractYouTubeId(url: string): string | null {
  try {
    const patterns = [
      /youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/,
      /youtu\.be\/([A-Za-z0-9_-]+)/,
      /youtube\.com\/embed\/([A-Za-z0-9_-]+)/,
      /youtube\.com\/v\/([A-Za-z0-9_-]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Pinterest URL 감지
 */
function detectPinterest(url: string): string | null {
  try {
    if (url.includes('pinterest.com/pin/') || url.includes('pin.it/')) {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 알라딘 URL 감지
 */
function detectAladin(url: string): boolean {
  return detectPlatform(normalizeUrl(url)) === 'aladin';
}

/**
 * Google Maps URL 감지
 */
function detectGoogleMaps(url: string): boolean {
  return detectPlatform(normalizeUrl(url)) === 'googlemap';
}

/**
 * Electron 환경에서 로컬 메타데이터 생성 (1차 릴리즈: 6개 플랫폼)
 */
function buildSafeMetadataLocally(url: string, type: ScrapType): ScrapMetadata {
  console.log(`🔧 [Electron] 로컬 메타데이터 생성: ${url}`);

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');

    const sourceInfoFor = (externalId?: string): SourceInfo => ({
      url,
      canonicalUrl: url,
      ...(externalId ? { externalId } : {}),
    });

    // 1. Twitter
    const tweetId = extractTwitterId(url);
    if (tweetId) {
      console.log(`✅ Twitter 감지: ${tweetId}`);
      return {
        title: "X (트위터) 포스트",
        subtitle: hostname,
        description: "클릭하여 새 창에서 열기",
        url: url,
        imageUrl: '',
        themeColor: "#000000",
        platform: 'twitter',
        storeMode: 'safe',
        source: sourceInfoFor(tweetId),
        tweetId: tweetId,
        isEditable: false,
      };
    }

    // 2. Instagram
    const igPermalink = detectInstagram(url);
    if (igPermalink) {
      console.log(`✅ Instagram 감지: ${igPermalink}`);
      return {
        title: "Instagram 포스트",
        subtitle: hostname,
        description: "클릭하여 새 창에서 열기",
        url: url,
        imageUrl: '',
        themeColor: "#E4405F",
        platform: 'instagram',
        storeMode: 'safe',
        source: sourceInfoFor(igPermalink),
        igPermalink: igPermalink,
        isEditable: false,
      };
    }

    // 3. YouTube
    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
      console.log(`✅ YouTube 감지: ${youtubeId}`);
      return {
        title: "YouTube 동영상",
        subtitle: hostname,
        description: "클릭하여 새 창에서 열기",
        url: url,
        imageUrl: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`,
        themeColor: "#FF0000",
        platform: 'youtube',
        storeMode: 'safe',
        source: sourceInfoFor(youtubeId),
        videoId: youtubeId,
        isEditable: false,
      };
    }

    // 4. Pinterest
    const pinterestUrl = detectPinterest(url);
    if (pinterestUrl) {
      console.log(`✅ Pinterest 감지: ${pinterestUrl}`);
      return {
        title: "Pinterest 핀",
        subtitle: hostname,
        description: "클릭하여 새 창에서 열기",
        url: url,
        imageUrl: '',
        themeColor: "#E60023",
        platform: 'pinterest',
        storeMode: 'safe',
        source: sourceInfoFor(pinterestUrl),
        isEditable: false,
      };
    }

    // 5. 알라딘 (Electron: 기본 카드, 웹에서 unfurl로 개선)
    if (detectAladin(url)) {
      console.log(`✅ 알라딘 감지 (로컬)`);
      return {
        title: "알라딘 도서",
        subtitle: "aladin.co.kr",
        description: "클릭하여 새 창에서 열기",
        url: url,
        imageUrl: '',
        themeColor: "#0066CC",
        platform: 'aladin',
        storeMode: 'safe',
        source: sourceInfoFor(),
        isEditable: false,
      };
    }

    // 6. Google Maps (Electron: 기본 카드, 웹에서 unfurl로 개선)
    if (detectGoogleMaps(url)) {
      console.log(`✅ Google Maps 감지 (로컬)`);
      return {
        title: "Google Maps 위치",
        subtitle: "maps.google.com",
        description: "클릭하여 새 창에서 열기",
        url: url,
        imageUrl: '',
        themeColor: "#4285F4",
        platform: 'googlemap',
        storeMode: 'safe',
        source: sourceInfoFor(),
        isEditable: false,
      };
    }

    // 일반 링크
    console.log(`ℹ️ 일반 링크: ${hostname}`);
    return {
      title: hostname,
      subtitle: "링크",
      description: "클릭하여 수동으로 편집하거나 새 창에서 열기",
      url: url,
      imageUrl: '',
      themeColor: "#64748b",
      platform: 'link',
      storeMode: 'safe',
      source: sourceInfoFor(),
      isEditable: true,
    };

  } catch (error) {
    console.warn('⚠️ URL 파싱 실패, 기본 메타데이터 반환:', error);
    return {
      title: "링크",
      subtitle: url,
      description: "수동으로 편집하세요",
      url: url,
      imageUrl: '',
      themeColor: "#64748b",
      platform: 'link',
      storeMode: 'safe',
      source: { url, canonicalUrl: url },
      isEditable: true,
    };
  }
}

/**
 * 서버 API를 통해 메타데이터 가져오기 (웹 환경)
 * Electron 환경에서는 로컬 파싱 사용
 */
export const fetchMetadata = async (url: string, type: ScrapType): Promise<ScrapMetadata> => {
    const DBG = !!import.meta.env.DEV && (typeof window !== 'undefined') && ((window as any).__DSD_DEBUG_DRAG ?? true);
    const dragActive = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
    console.log(`📥 fetchMetadata 호출: ${url}, type: ${type}${DBG && dragActive ? ' (DURING_DRAG)' : ''}`);
    
    // ═══════════════════════════════════════════════════════
    // 🖥️ Electron 환경: 로컬 메타데이터 생성
    // ═══════════════════════════════════════════════════════
    if (window.electron?.isElectron) {
        console.log('🖥️ Electron 환경 감지 → 로컬 메타데이터 생성');
        return buildSafeMetadataLocally(url, type);
    }

    // ═══════════════════════════════════════════════════════
    // 🌐 웹 환경: 서버 API 호출
    // ═══════════════════════════════════════════════════════
    
    const cacheKey = `${type}:${url}`;
    const cached = clientCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
        console.log(`⚡ Client cache hit: ${url}`);
        return cached.data;
    }

    // 알라딘/구글맵은 unfurl API 사용 (판별 로직은 shared로 수렴)
    const detected = detectPlatform(normalizeUrl(url));
    if (detected === 'aladin' || detected === 'googlemap') {
        console.log(`🔄 Fetching from unfurl API: ${url}`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${API_BASE_URL}/unfurl`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Unfurl API error: ${response.status}`);
            }

            const unfurled = await response.json();
            
            // unfurl 결과를 ScrapMetadata로 변환
            const metadata: ScrapMetadata = {
                url: unfurled.url,
                title: unfurled.title || '제목 없음',
                subtitle: unfurled.siteName || '',
                description: unfurled.description || '',
                imageUrl: unfurled.image || '',
                themeColor: unfurled.platform === 'aladin' ? '#0066CC' : unfurled.platform === 'googlemap' ? '#4285F4' : '#64748b',
                platform: unfurled.platform,
                storeMode: 'safe',
                source: { url: unfurled.url, canonicalUrl: unfurled.url },
                isEditable: false,
                // Google Maps embed URL (있으면)
                embedHtml: unfurled.embedUrl ? `<iframe src="${unfurled.embedUrl}" width="100%" height="400" frameborder="0"></iframe>` : undefined,
            };

            clientCache.set(cacheKey, {
                data: metadata,
                timestamp: Date.now(),
            });

            console.log('✅ Unfurl API success:', metadata);
            return metadata;

        } catch (error: any) {
            console.error('❌ Unfurl API failed:', error);
            // Fallback: 로컬 메타데이터 생성
            return buildSafeMetadataLocally(url, type);
        }
    }

    // 기존 스크랩 API (다른 플랫폼용)
    console.log(`🔄 Fetching from server API: ${url}`);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${API_BASE_URL}/scrap`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
                type: type.toLowerCase(),
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Server API error: ${response.status}`);
        }

        const metadata: ScrapMetadata = await response.json();

        clientCache.set(cacheKey, {
            data: metadata,
            timestamp: Date.now(),
        });

        console.log('✅ Server API success:', metadata);
        return metadata;

    } catch (error: any) {
        console.error('❌ Server API failed:', error);
        console.error('   Error details:', error.message, error.stack);

        // Fallback: 로컬 메타데이터 생성
        console.log('⚠️ 서버 실패 → Fallback 메타데이터 생성');
        return buildSafeMetadataLocally(url, type);
    }
};

/**
 * 캐시 초기화
 */
export const clearClientCache = () => {
    clientCache.clear();
    console.log('🗑️ Client cache cleared');
};
