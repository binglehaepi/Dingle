// 📦 안전한 LocalStorage 관리 (정책 준수)

import { ScrapItem, ScrapMetadata } from '../types';

/**
 * 🛡️ V2: 메타데이터 정제 (더 엄격한 정책 준수)
 * 
 * SNS 원문/이미지/통계를 제거하여 저작권 리스크 최소화
 * - URL과 레이아웃만 보존
 * - Embed 렌더링에 필요한 최소 정보만 유지
 * - preview는 TTL 체크 후 만료 시 제거
 */
export const sanitizeMetadata = (metadata: ScrapMetadata): ScrapMetadata => {
  const platform = metadata.platform?.toLowerCase();
  const isSNS = platform === 'twitter' || platform === 'instagram';
  
  // Preview TTL 체크
  let validPreview = metadata.preview;
  if (validPreview?.expiresAt && Date.now() > validPreview.expiresAt) {
    console.log('⚠️ Preview expired, removing:', metadata.url);
    validPreview = undefined;
  }
  
  const sanitized: ScrapMetadata = {
    url: metadata.url,
    title: metadata.title || 'Link',
    subtitle: metadata.subtitle,
    themeColor: metadata.themeColor,
    isEditable: metadata.isEditable,
    
    // ===== V2 정책 준수 =====
    platform: metadata.platform,
    storeMode: metadata.storeMode,
    
    // source, embed 유지 (렌더링 필수)
    source: metadata.source,
    embed: metadata.embed,
    
    // preview는 TTL 체크 후 유지
    preview: validPreview,
    
    // snapshot 유지 (유저 업로드)
    snapshot: metadata.snapshot,
    
    // exportPolicy 유지
    exportPolicy: metadata.exportPolicy,
    
    // ===== Legacy 호환 =====
    embedType: metadata.embedType,
    fetchedAt: metadata.fetchedAt,
    ttl: metadata.ttl,
    tweetId: metadata.tweetId,
    igPermalink: metadata.igPermalink,
  };
  
  // 🛡️ SNS는 원문/이미지/통계 완전 제거
  if (isSNS) {
    // description, imageUrl, videoUrl, twitterStats 제거됨
    console.log(`🛡️ SNS 데이터 제거: ${platform}`);
  } else {
    // 비-SNS는 일반 메타데이터 유지
    sanitized.description = metadata.description;
    sanitized.imageUrl = metadata.imageUrl;
    sanitized.videoUrl = metadata.videoUrl;
  }
  
  // 기타 설정은 유지
  sanitized.youtubeConfig = metadata.youtubeConfig;
  sanitized.stickerConfig = metadata.stickerConfig;
  sanitized.textNoteConfig = metadata.textNoteConfig;
  sanitized.ticketConfig = metadata.ticketConfig;
  sanitized.boardingConfig = metadata.boardingConfig;
  sanitized.receiptConfig = metadata.receiptConfig;
  sanitized.toploaderConfig = metadata.toploaderConfig;
  sanitized.cupSleeveConfig = metadata.cupSleeveConfig;
  sanitized.fashionConfig = metadata.fashionConfig;
  sanitized.noteConfig = metadata.noteConfig;
  sanitized.tapeConfig = metadata.tapeConfig;
  sanitized.profileConfig = metadata.profileConfig;
  sanitized.todoConfig = metadata.todoConfig;
  
  return sanitized;
};

/**
 * 🛡️ 아이템 정제 (정책 준수)
 */
export const sanitizeItem = (item: ScrapItem): ScrapItem => {
  return {
    ...item,
    metadata: sanitizeMetadata(item.metadata),
  };
};

/**
 * ✅ 안전한 저장
 * 
 * LocalStorage에 저장하기 전 민감 데이터 제거
 */
export const saveToStorage = (key: string, items: ScrapItem[]): void => {
  try {
    const safeItems = items.map(sanitizeItem);
    localStorage.setItem(key, JSON.stringify(safeItems));
    console.log('✅ Saved to storage (sanitized):', safeItems.length, 'items');
  } catch (error) {
    console.error('❌ Failed to save to storage:', error);
  }
};

/**
 * 📖 저장소에서 불러오기
 */
export const loadFromStorage = (key: string): ScrapItem[] => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const items = JSON.parse(stored);
    console.log('📖 Loaded from storage:', items.length, 'items');
    return items;
  } catch (error) {
    console.error('❌ Failed to load from storage:', error);
    return [];
  }
};

/**
 * 🗑️ 저장소 초기화
 */
export const clearStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
    console.log('🗑️ Cleared storage:', key);
  } catch (error) {
    console.error('❌ Failed to clear storage:', error);
  }
};

/**
 * 🔍 저장소 크기 확인
 */
export const getStorageSize = (key: string): number => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return 0;
    
    // bytes
    const size = new Blob([stored]).size;
    console.log('📊 Storage size:', (size / 1024).toFixed(2), 'KB');
    return size;
  } catch (error) {
    console.error('❌ Failed to get storage size:', error);
    return 0;
  }
};

