import { VercelRequest, VercelResponse } from '@vercel/node';

type OhaasaSignId =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

const OHAASA_JSON_URL = 'https://www.asahi.co.jp/data/ohaasa2020/horoscope.json';
const OHAASA_SOURCE_URL = 'https://www.asahi.co.jp/ohaasa/week/horoscope';

const OHAASA_SIGN_TO_ST: Record<OhaasaSignId, string> = {
  aries: '01', taurus: '02', gemini: '03', cancer: '04',
  leo: '05', virgo: '06', libra: '07', scorpio: '08',
  sagittarius: '09', capricorn: '10', aquarius: '11', pisces: '12',
};

const COLOR_TRANSLATIONS: Record<string, string> = {
  '赤': '빨강', '青': '파랑', '黄色': '노랑', '緑': '초록',
  '白': '흰색', '黒': '검정', 'ピンク': '분홍', 'オレンジ': '주황',
  '紫': '보라', '茶色': '갈색', '金': '금색', '銀': '은색',
  'グレー': '회색', 'ベージュ': '베이지', '水色': '하늘색',
  'レモンイエロー': '레몬색', 'ラベンダー': '라벤더',
};

function yyyymmddToIso(d: string): string {
  if (!/^\d{8}$/.test(d)) return d;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

async function fetchOhaasaLuckyColors(): Promise<Map<string, string>> {
  try {
    const res = await fetch(OHAASA_SOURCE_URL, {
      headers: { 'User-Agent': 'DigitalScrapDiary/1.0' }
    });
    if (!res.ok) throw new Error(`OhaAsa HTML fetch failed: ${res.status}`);
    
    const html = await res.text();
    const luckyColors = new Map<string, string>();
    const regex = /ラッキーカラー[：:]\s*([^\s<]+)/gi;
    let match;
    let signIndex = 1;
    
    while ((match = regex.exec(html)) !== null && signIndex <= 12) {
      const jaColor = match[1].trim();
      const st = String(signIndex).padStart(2, '0');
      luckyColors.set(st, jaColor);
      signIndex++;
    }
    
    return luckyColors;
  } catch (error) {
    console.error('[ohaasa] Failed to fetch lucky colors:', error);
    return new Map();
  }
}

function translateColorJaToKo(jaColor: string): string {
  return COLOR_TRANSLATIONS[jaColor] || jaColor;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { date, sign } = req.query;
    
    if (!sign || typeof sign !== 'string') {
      return res.status(400).json({ error: 'Sign is required' });
    }
    
    // JSON 데이터 가져오기
    const jsonRes = await fetch(OHAASA_JSON_URL, {
      headers: { 'User-Agent': 'DigitalScrapDiary/1.0' }
    });
    if (!jsonRes.ok) throw new Error(`OhaAsa json fetch failed: ${jsonRes.status}`);
    
    const raw = await jsonRes.json();
    const entry = Array.isArray(raw) ? raw[0] : raw;
    const onair = String(entry?.onair_date || '');
    if (!onair) throw new Error('OhaAsa json missing onair_date');
    
    // 행운 컬러 가져오기
    const luckyColors = await fetchOhaasaLuckyColors();
    
    // 별자리 데이터 찾기
    const st = OHAASA_SIGN_TO_ST[sign as OhaasaSignId];
    const detail: any[] = entry?.detail || [];
    const hit = detail.find((x: any) => String(x?.horoscope_st) === st);
    if (!hit) throw new Error(`OhaAsa sign not found: ${sign}`);
    
    // 행운 컬러 번역
    const jaColor = luckyColors.get(st);
    const koColor = jaColor ? translateColorJaToKo(jaColor) : undefined;
    
    const result = {
      date: yyyymmddToIso(onair),
      sign,
      rank: Number(hit?.ranking_no),
      textJa: typeof hit?.horoscope_text === 'string' ? hit.horoscope_text : undefined,
      luckyColor: koColor,
      luckyColorJa: jaColor,
      sourceUrl: OHAASA_SOURCE_URL,
    };
    
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[ohaasa] API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}


