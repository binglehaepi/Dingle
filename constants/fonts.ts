// constants/fonts.ts
// 폰트 ID 단일 소스(타입 + 허용 집합 + 기본값)

export const FONT_IDS = ['noto', 'gmarket', 'gyeonggi', 'cafe24'] as const;
export type FontId = typeof FONT_IDS[number];

export const DEFAULT_FONT_ID: FontId = 'noto';

// 모바일에서도 동일 집합 사용(필요 시 subset으로 변경 가능)
export const MOBILE_FONT_IDS = FONT_IDS;


