import type { VercelRequest, VercelResponse } from '@vercel/node';
import { detectPlatform, normalizeUrl } from '../shared/urlPlatform';

// 간단한 메모리 캐시 (추후 Vercel KV로 교체)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24시간

// 트윗 ID 추출
function extractTweetId(url: string): string | null {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /twitter\.com\/.*\/statuses\/(\d+)/,
    /x\.com\/.*\/statuses\/(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

// 🛡️ V2: Twitter Safe 모드 (원문 저장 금지)
async function fetchTwitterData(url: string, tweetId: string) {
  // ✅ 원문/이미지/통계 수집 안 함
  // ✅ 렌더링은 공식 embed가 책임
  // ✅ 저장은 URL + ID만
  
  const twitterUrl = url.includes('x.com') 
    ? url.replace('x.com', 'twitter.com')
    : url;
  
  return {
    // V1 Legacy (최소)
    url: twitterUrl,
    title: 'Twitter Post',
    subtitle: 'X (Twitter)',
    themeColor: '#000000',
    isEditable: false,
    
    // V2 정책 준수
    platform: 'twitter' as const,
    storeMode: 'safe' as const,
    
    source: {
      url: twitterUrl,
      canonicalUrl: twitterUrl,
      externalId: tweetId,
    },
    
    embed: {
      kind: 'twitter' as const,
      id: tweetId,
    },
    
    exportPolicy: {
      excludeEmbeds: true,
      embedFallback: 'link_card' as const,
    },
    
    // Legacy 호환
    tweetId: tweetId,
    embedType: 'twitter_widget',
    fetchedAt: Date.now(),
    ttl: 86400000,
  };
}

// 🛡️ V2: Instagram Safe 모드 (원문 저장 금지)
async function fetchInstagramData(url: string) {
  // ✅ 원문/이미지/통계 수집 안 함
  // ✅ 렌더링은 공식 embed가 책임
  // ✅ 저장은 URL만
  
  // URL 정규화
  let normalizedUrl = url;
  try {
    const urlObj = new URL(url);
    // 추적 파라미터 제거
    ['utm_source', 'utm_medium', 'igshid'].forEach(param => {
      urlObj.searchParams.delete(param);
    });
    normalizedUrl = urlObj.toString();
  } catch (e) {
    // URL 파싱 실패 시 원본 사용
  }
  
  // shortcode 추출 (선택)
  const shortcodeMatch = url.match(/\/p\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch?.[1];
  
  return {
    // V1 Legacy (최소)
    url: normalizedUrl,
    title: 'Instagram Post',
    subtitle: 'Instagram',
    themeColor: '#E4405F',
    isEditable: false,
    
    // V2 정책 준수
    platform: 'instagram' as const,
    storeMode: 'safe' as const,
    
    source: {
      url: normalizedUrl,
      canonicalUrl: normalizedUrl,
      externalId: shortcode,
    },
    
    embed: {
      kind: 'instagram' as const,
      permalink: normalizedUrl,
    },
    
    exportPolicy: {
      excludeEmbeds: true,
      embedFallback: 'link_card' as const,
    },
    
    // Legacy 호환
    igPermalink: normalizedUrl,
    embedType: 'instagram_embed',
    fetchedAt: Date.now(),
    ttl: 86400000,
  };
}

// Pinterest OEmbed
async function fetchPinterestData(url: string) {
  const oembedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`;
  
  try {
    const response = await fetch(oembedUrl);
    if (!response.ok) throw new Error('Pinterest OEmbed failed');
    
    const data = await response.json();
    return {
      title: data.title || 'Pinterest Pin',
      subtitle: data.author_name || 'Pinterest',
      description: 'Pinterest에서 핀을 스크랩했습니다.',
      imageUrl: data.thumbnail_url,
      url: url,
      themeColor: '#E60023',
      platform: 'pinterest',
      storeMode: 'safe',
      source: { url, canonicalUrl: url },
      isEditable: false,
    };
  } catch (error) {
    console.error('Pinterest fetch failed:', error);
    throw error;
  }
}

// YouTube OEmbed
async function fetchYoutubeData(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match?.[2]?.length === 11 ? match[2] : null;
  
  if (!videoId) throw new Error('Invalid YouTube URL');
  
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    
    let title = 'YouTube Video';
    let author = 'YouTube';
    
    if (response.ok) {
      const data = await response.json();
      title = data.title || title;
      author = data.author_name || author;
    }
    
    return {
      title,
      subtitle: author,
      description: 'Watch on YouTube',
      imageUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      url: url,
      themeColor: '#FF0000',
      isEditable: false,
      youtubeConfig: { mode: 'player', startTime: 0 },
    };
  } catch (error) {
    console.error('YouTube fetch failed:', error);
    throw error;
  }
}

// 일반 URL - Open Graph 파싱 (간단 버전)
async function fetchGeneralData(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DigitalScrapDiary/1.0)',
      },
    });
    
    if (!response.ok) throw new Error('URL fetch failed');
    
    const html = await response.text();
    
    // 간단한 OG 태그 파싱 (정규식 사용)
    const getMetaContent = (property: string) => {
      const pattern = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
      const match = html.match(pattern);
      return match?.[1] || '';
    };
    
    const title = getMetaContent('og:title') || getMetaContent('twitter:title') || 'Web Page';
    const description = getMetaContent('og:description') || getMetaContent('twitter:description') || '';
    const image = getMetaContent('og:image') || getMetaContent('twitter:image') || '';
    
    return {
      title,
      subtitle: new URL(url).hostname,
      description: description.slice(0, 120),
      imageUrl: image,
      url: url,
      themeColor: '#64748b',
      isEditable: false,
    };
  } catch (error) {
    console.error('General URL fetch failed:', error);
    throw error;
  }
}

// 메인 핸들러
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { url, type } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // URL 정규화 (shared 단일 소스)
    const normalizedUrl = normalizeUrl(url);

    // 플랫폼 판별(유효성/기본 분기용). 기존 동작(요청 type 우선)은 유지한다.
    const detected = detectPlatform(normalizedUrl);
    const effectiveType =
      type === 'twitter' || type === 'instagram' || type === 'pinterest' || type === 'youtube'
        ? type
        : detected === 'twitter' || detected === 'instagram' || detected === 'pinterest' || detected === 'youtube'
          ? detected
          : 'general';
    
    // 캐시 확인
    const cacheKey = `scrap:${type}:${normalizedUrl}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Cache hit:', cacheKey);
      return res.status(200).json(cached.data);
    }
    
    console.log('🔄 Fetching fresh data for:', normalizedUrl);
    
    let metadata;
    
    // 타입별 처리
    switch (effectiveType) {
      case 'twitter': {
        const tweetId = extractTweetId(normalizedUrl);
        if (!tweetId) {
          throw new Error('Invalid Twitter URL');
        }
        metadata = await fetchTwitterData(normalizedUrl, tweetId);
        break;
      }

      case 'instagram':
        metadata = await fetchInstagramData(normalizedUrl);
        break;
        
      case 'pinterest':
        metadata = await fetchPinterestData(normalizedUrl);
        break;
        
      case 'youtube':
        metadata = await fetchYoutubeData(normalizedUrl);
        break;
        
      case 'spotify': {
        const spotifyMatch = normalizedUrl.match(/spotify\.com\/(track|album|playlist)\/([^?]+)/);
        if (!spotifyMatch) {
          throw new Error('Invalid Spotify URL');
        }
        const [, contentType, contentId] = spotifyMatch;
        
        metadata = {
          url: normalizedUrl,
          title: `Spotify ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
          subtitle: 'Spotify',
          description: 'Listen on Spotify',
          imageUrl: '',
          themeColor: '#1DB954',
          platform: 'spotify',
          storeMode: 'safe',
          isEditable: false,
          source: { 
            url: normalizedUrl, 
            canonicalUrl: normalizedUrl,
            externalId: contentId 
          },
        };
        break;
      }
      
      case 'soundcloud': {
        try {
          const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json&maxheight=166&visual=true`;
          const response = await fetch(oembedUrl);
          
          if (!response.ok) throw new Error('SoundCloud oEmbed failed');
          
          const oembedData = await response.json();
          
          // oEmbed HTML에서 실제 iframe src 추출
          const iframeSrcMatch = oembedData.html?.match(/src="([^"]+)"/);
          const embedUrl = iframeSrcMatch?.[1] || null;
          
          metadata = {
            url: normalizedUrl,
            title: oembedData.title || 'SoundCloud Track',
            subtitle: oembedData.author_name || 'SoundCloud',
            description: 'Listen on SoundCloud',
            imageUrl: oembedData.thumbnail_url || '',
            themeColor: '#FF5500',
            platform: 'soundcloud',
            storeMode: 'safe',
            isEditable: false,
            embedHtml: embedUrl ? undefined : oembedData.html, // HTML 전체 저장 (fallback)
            soundcloudEmbedUrl: embedUrl, // 추출한 iframe URL
            source: { 
              url: normalizedUrl, 
              canonicalUrl: normalizedUrl 
            },
          };
        } catch (error) {
          console.error('SoundCloud oEmbed failed:', error);
          // Fallback: 기본 메타데이터
          metadata = {
            url: normalizedUrl,
            title: 'SoundCloud Track',
            subtitle: 'SoundCloud',
            description: 'Listen on SoundCloud',
            imageUrl: '',
            themeColor: '#FF5500',
            platform: 'soundcloud',
            storeMode: 'safe',
            isEditable: false,
            source: { 
              url: normalizedUrl, 
              canonicalUrl: normalizedUrl 
            },
          };
        }
        break;
      }
        
      default:
        metadata = await fetchGeneralData(normalizedUrl);
        break;
    }
    
    // 캐시 저장
    cache.set(cacheKey, {
      data: metadata,
      timestamp: Date.now(),
    });
    
    return res.status(200).json(metadata);
    
  } catch (error: any) {
    console.error('❌ API Error:', error);
    
    // Fallback 데이터 반환
    return res.status(200).json({
      title: 'Scrap Item',
      subtitle: 'Click to edit',
      description: 'Could not load details automatically.',
      url: req.body.url,
      imageUrl: '',
      themeColor: '#64748b',
      isEditable: true,
    });
  }
}

