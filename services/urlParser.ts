import { ScrapType } from '../types';
import { detectPlatform, normalizeUrl } from '../shared/urlPlatform';

export const parseUrlType = (url: string): ScrapType => {
  const DBG = !!import.meta.env.DEV && (typeof window !== 'undefined') && ((window as any).__DSD_DEBUG_DRAG ?? true);
  if (DBG) {
    const dragActive = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
    if (dragActive) {
      console.debug('[url] parseUrlType called DURING_DRAG', { url });
    }
  }
  const u = normalizeUrl(url);
  const p = detectPlatform(u);
  switch (p) {
    case 'moving_photo':
      return ScrapType.MOVING_PHOTO;
    case 'twitter':
      return ScrapType.TWITTER;
    case 'instagram':
      return ScrapType.INSTAGRAM;
    case 'pinterest':
      return ScrapType.PINTEREST;
    case 'aladin':
    case 'book':
      return ScrapType.BOOK;
    case 'youtube':
      return ScrapType.YOUTUBE;
    case 'spotify':
      return ScrapType.SPOTIFY;
    case 'tiktok':
      return ScrapType.TIKTOK;
    case 'vimeo':
      return ScrapType.VIMEO;
    case 'fashion':
      return ScrapType.FASHION;
    // NOTE: urlParser의 기존 분류에는 googlemap 전용이 없었으므로 GENERAL로 유지
    case 'googlemap':
    case 'general':
    default:
      return ScrapType.GENERAL;
  }
};