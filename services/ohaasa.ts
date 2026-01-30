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


