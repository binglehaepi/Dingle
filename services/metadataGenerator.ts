/**
 * Metadata Generator — JSON-LD 구조화 데이터 생성
 *
 * 다이어리 아이템을 schema.org 기반 JSON-LD로 변환합니다.
 * AI 및 검색엔진이 사이트 콘텐츠를 이해할 수 있도록 합니다.
 */

import { ScrapItem, ScrapType, LayoutTextData, DiaryStyle } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────

/** ScrapType → schema.org @type 매핑 */
function getSchemaType(type: ScrapType): string {
  switch (type) {
    case ScrapType.YOUTUBE:
      return 'VideoObject';
    case ScrapType.TWITTER:
    case ScrapType.INSTAGRAM:
      return 'SocialMediaPosting';
    case ScrapType.SPOTIFY:
    case ScrapType.SOUNDCLOUD:
      return 'MusicRecording';
    case ScrapType.BOOK:
      return 'Book';
    case ScrapType.NOTE:
      return 'Article';
    case ScrapType.TICKET:
    case ScrapType.BOARDING:
      return 'Event';
    case ScrapType.RECEIPT:
      return 'Invoice';
    case ScrapType.STICKER:
    case ScrapType.TAPE:
      return 'ImageObject';
    default:
      return 'CreativeWork';
  }
}

/** 아이템에서 키워드 추출 */
function extractKeywords(item: ScrapItem): string[] {
  const keywords: string[] = [];
  if (item.metadata.platform) keywords.push(item.metadata.platform);
  if (item.type) keywords.push(item.type);
  return keywords;
}

/** YYYY-MM-DD → 표시용 문자열 */
function formatDate(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  const [y, m, d] = parts;
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
}

/** 날짜 그룹에 대한 AI 프롬프트 생성 */
function generateDpiPrompt(dateKey: string, items: ScrapItem[]): string {
  const types = items.map(i => i.type).filter(Boolean);
  const uniqueTypes = [...new Set(types)];
  const titles = items
    .map(i => i.metadata.preview?.title || i.metadata.title)
    .filter(Boolean)
    .slice(0, 5);

  let prompt = `${formatDate(dateKey)}의 스크랩 다이어리 기록입니다.`;
  if (uniqueTypes.length > 0) {
    prompt += ` 포함된 콘텐츠 유형: ${uniqueTypes.join(', ')}.`;
  }
  if (titles.length > 0) {
    prompt += ` 주요 항목: ${titles.join(', ')}.`;
  }
  return prompt;
}

// ─── Main Function ───────────────────────────────────────────────

/**
 * 다이어리 데이터를 JSON-LD 문자열로 변환
 */
export function generateJsonLd(
  items: ScrapItem[],
  textData: LayoutTextData,
  diaryStyle: DiaryStyle,
): string {
  // 날짜별 그룹핑
  const dateGroups = new Map<string, ScrapItem[]>();
  for (const item of items) {
    if (!item.diaryDate || !/^\d{4}-\d{2}-\d{2}$/.test(item.diaryDate)) continue;
    const key = item.diaryDate;
    if (!dateGroups.has(key)) dateGroups.set(key, []);
    dateGroups.get(key)!.push(item);
  }

  // 날짜 정렬
  const sortedDates = [...dateGroups.keys()].sort();

  // 날짜별 컬렉션 생성
  const collections = sortedDates.map(dateKey => {
    const dateItems = dateGroups.get(dateKey)!;
    return {
      '@type': 'CollectionPage',
      name: formatDate(dateKey),
      dateCreated: dateKey,
      dpiPrompt: generateDpiPrompt(dateKey, dateItems),
      hasPart: dateItems.map(item => ({
        '@type': getSchemaType(item.type),
        name: item.metadata.preview?.title || item.metadata.title || '제목 없음',
        description: item.metadata.preview?.textSnippet || item.metadata.description || '',
        url: item.metadata.source?.url || item.metadata.url || '',
        keywords: extractKeywords(item),
      })),
    };
  });

  // 루트 JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'My Dingle Diary',
    description: 'Digital Scrap Diary',
    dateModified: new Date().toISOString().split('T')[0],
    hasPart: collections,
  };

  return JSON.stringify(jsonLd, null, 2);
}
