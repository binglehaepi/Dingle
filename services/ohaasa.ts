export type OhaasaSignId =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type OhaasaResult = {
  date: string; // YYYY-MM-DD (onair date)
  sign: OhaasaSignId;
  rank: number;
  textJa?: string;
  textKo?: string;
  translated?: boolean;
  translationError?: boolean;
  sourceUrl: string;
  luckyColor?: string; // 한국어 행운 컬러
  luckyColorJa?: string; // 일본어 원본
};

export const OHAASA_SOURCE_URL = 'https://www.asahi.co.jp/ohaasa/week/horoscope';
export const OHAASA_X_URL = 'https://x.com/Hi_Ohaasa';

export const OHAASA_SIGNS: Array<{
  id: OhaasaSignId;
  ko: string;
  ja: string;
}> = [
  { id: 'aries', ko: '양자리', ja: 'おひつじ座(牡羊座)' },
  { id: 'taurus', ko: '황소자리', ja: 'おうし座(牡牛座)' },
  { id: 'gemini', ko: '쌍둥이자리', ja: 'ふたご座(双子座)' },
  { id: 'cancer', ko: '게자리', ja: 'かに座(蟹座)' },
  { id: 'leo', ko: '사자자리', ja: 'しし座(獅子座)' },
  { id: 'virgo', ko: '처녀자리', ja: 'おとめ座(乙女座)' },
  { id: 'libra', ko: '천칭자리', ja: 'てんびん座(天秤座)' },
  { id: 'scorpio', ko: '전갈자리', ja: 'さそり座(蠍座)' },
  { id: 'sagittarius', ko: '사수자리', ja: 'いて座(射手座)' },
  { id: 'capricorn', ko: '염소자리', ja: 'やぎ座(山羊座)' },
  { id: 'aquarius', ko: '물병자리', ja: 'みずがめ座(水瓶座)' },
  { id: 'pisces', ko: '물고기자리', ja: 'うお座(魚座)' },
];

export function getSignLabelKo(sign: OhaasaSignId): string {
  return OHAASA_SIGNS.find((s) => s.id === sign)?.ko || sign;
}

export function formatOhaasaDate(yyyymmdd: string): string {
  if (!/^\d{8}$/.test(yyyymmdd)) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export async function fetchOhaasa(params: { date: string; sign: OhaasaSignId }): Promise<OhaasaResult> {
  // 1) Electron IPC (best: no CORS)
  try {
    if (typeof window !== 'undefined' && (window as any).electron?.ohaasaHoroscope) {
      return await (window as any).electron.ohaasaHoroscope(params);
    }
  } catch {
    // ignore
  }

  // 2) Web/dev: /api
  const qs = new URLSearchParams({ date: params.date, sign: params.sign });
  const res = await fetch(`/api/ohaasa?${qs.toString()}`);
  if (!res.ok) throw new Error(`ohaasa api failed: ${res.status}`);
  return (await res.json()) as OhaasaResult;
}

// 일본어 컬러명 → 한국어 번역
export const COLOR_TRANSLATIONS: Record<string, string> = {
  '赤': '빨강',
  '青': '파랑',
  '黄色': '노랑',
  '緑': '초록',
  '白': '흰색',
  '黒': '검정',
  'ピンク': '분홍',
  'オレンジ': '주황',
  '紫': '보라',
  '茶色': '갈색',
  '金': '금색',
  '銀': '은색',
  'グレー': '회색',
  'ベージュ': '베이지',
  '水色': '하늘색',
  'レモンイエロー': '레몬색',
  'ラベンダー': '라벤더',
};

export function translateColor(jaColor: string): string {
  return COLOR_TRANSLATIONS[jaColor] || jaColor;
}

// 컬러명 → HEX 색상 코드 매핑
export function getColorHex(koColor: string): string {
  const colorMap: Record<string, string> = {
    '빨강': '#FF0000',
    '파랑': '#0000FF',
    '노랑': '#FFD700',
    '초록': '#00FF00',
    '흰색': '#FFFFFF',
    '검정': '#000000',
    '분홍': '#FFB6C1',
    '주황': '#FFA500',
    '보라': '#800080',
    '갈색': '#8B4513',
    '금색': '#FFD700',
    '은색': '#C0C0C0',
    '회색': '#808080',
    '베이지': '#F5F5DC',
    '하늘색': '#87CEEB',
    '레몬색': '#FFF44F',
    '라벤더': '#E6E6FA',
  };
  return colorMap[koColor] || '#CCCCCC';
}


