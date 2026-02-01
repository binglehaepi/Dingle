// constants/fonts.ts
// 폰트 ID 단일 소스(타입 + 허용 집합 + 기본값)

export const FONT_IDS = [
  'noto',
  'nanum-gothic',
  'nanum-myeongjo',
  'black-han-sans',
  'do-hyeon',
  'jua',
  'cute-font',
  'gamja-flower',
  'gmarket',
  'gyeonggi',
  'cafe24'
] as const;
export type FontId = typeof FONT_IDS[number];

export const DEFAULT_FONT_ID: FontId = 'noto';

// 폰트 정보 (UI에서 사용)
export const AVAILABLE_FONTS = [
  { id: 'noto' as FontId, name: 'Noto Sans KR', family: "'Noto Sans KR', sans-serif" },
  { id: 'nanum-gothic' as FontId, name: '나눔고딕', family: "'Nanum Gothic', sans-serif" },
  { id: 'nanum-myeongjo' as FontId, name: '나눔명조', family: "'Nanum Myeongjo', serif" },
  { id: 'black-han-sans' as FontId, name: '검은고딕', family: "'Black Han Sans', sans-serif" },
  { id: 'do-hyeon' as FontId, name: '도현체', family: "'Do Hyeon', sans-serif" },
  { id: 'jua' as FontId, name: '주아체', family: "'Jua', sans-serif" },
  { id: 'cute-font' as FontId, name: '귀여운폰트', family: "'Cute Font', cursive" },
  { id: 'gamja-flower' as FontId, name: '감자꽃', family: "'Gamja Flower', cursive" },
  { id: 'gmarket' as FontId, name: 'Gmarket Sans', family: "'Gmarket Sans', sans-serif" },
  { id: 'gyeonggi' as FontId, name: '경기천년바탕', family: "'Gyeonggi Batang', serif" },
  { id: 'cafe24' as FontId, name: '카페24 동동', family: "'Cafe24 Dongdong', sans-serif" },
];

// 모바일에서도 동일 집합 사용(필요 시 subset으로 변경 가능)
export const MOBILE_FONT_IDS = FONT_IDS;


