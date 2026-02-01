import React, { useState, useEffect, useRef } from 'react';
import { ScrapMetadata, LayoutTextData } from '../../types';
import { 
  fetchOhaasa, 
  getSignLabelKo, 
  OHAASA_SIGNS, 
  getColorHex,
  type OhaasaResult, 
  type OhaasaSignId 
} from '../../services/ohaasa';
import { formatDateKey } from '../../utils/dateHelpers';

interface OhaAsaWidgetProps {
  data: ScrapMetadata;
  onUpdateText?: (key: string, value: string) => void;
  textData?: LayoutTextData;
}

const OHAASA_SIGN_KEY = 'dingel:ohaasa:sign';

const OhaAsaWidget: React.FC<OhaAsaWidgetProps> = ({ data, onUpdateText, textData }) => {
  const [ohaasaSign, setOhaasaSign] = useState<OhaasaSignId>('aries');
  const [ohaasaOpen, setOhaasaOpen] = useState(false);
  const [ohaasaResult, setOhaasaResult] = useState<OhaasaResult | null>(null);
  const [ohaasaLoading, setOhaasaLoading] = useState(false);
  const [ohaasaError, setOhaasaError] = useState('');
  const widgetRef = useRef<HTMLDivElement | null>(null);

  // 별자리 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(OHAASA_SIGN_KEY);
      if (saved) setOhaasaSign(saved as OhaasaSignId);
    } catch {
      // ignore
    }
  }, []);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    if (!ohaasaOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = widgetRef.current;
      if (!el) return;
      if (e.target && el.contains(e.target as Node)) return;
      setOhaasaOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [ohaasaOpen]);

  const handleOhaasaFetch = async () => {
    setOhaasaError('');
    const todayKey = formatDateKey(new Date());
    const cacheKey = `dingel:ohaasa:cache:${todayKey}:${ohaasaSign}`;
    
    // 캐시 확인
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as OhaasaResult;
        if (parsed?.rank) {
          setOhaasaResult(parsed);
          return;
        }
      }
    } catch {
      // ignore cache parse
    }

    setOhaasaLoading(true);
    try {
      const result = await fetchOhaasa({ date: todayKey, sign: ohaasaSign });
      setOhaasaResult(result);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {
        // ignore
      }
    } catch {
      setOhaasaError('불러오기 실패');
      setOhaasaResult(null);
    } finally {
      setOhaasaLoading(false);
    }
  };

  const handleSignChange = (sign: OhaasaSignId) => {
    setOhaasaSign(sign);
    setOhaasaOpen(false);
    setOhaasaResult(null);
    setOhaasaError('');
    try {
      localStorage.setItem(OHAASA_SIGN_KEY, sign);
    } catch {
      // ignore
    }
  };

  return (
    <div 
      ref={widgetRef}
      className="w-48 h-40 border flex flex-col overflow-hidden relative"
      style={{
        borderRadius: 'var(--radius-sm, 6px)',
        borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
        backgroundColor: 'var(--widget-surface-background, #ffffff)',
      }}
    >
      {/* 1. 상단: 별자리 드롭다운 */}
      <div className="relative">
        <button
          type="button"
          className="w-full text-center text-xs py-1 cursor-pointer select-none transition-all hover:brightness-95 active:brightness-90"
          style={{
            background: 'var(--ohaasa-header-bar-bg, #EBE7F5)',
            borderBottom: '1px solid var(--widget-border-color, var(--ui-stroke-color, #94a3b8))',
            color: 'inherit',
          }}
          onClick={(e) => {
            e.stopPropagation();
            setOhaasaOpen((v) => !v);
          }}
          title="별자리 선택"
        >
          <span className="inline-flex items-center justify-center w-full relative">
            <span className="truncate px-6">{getSignLabelKo(ohaasaSign)}</span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]" style={{ opacity: 0.75 }}>
              ▾
            </span>
          </span>
        </button>

        {ohaasaOpen && (
          <div
            className="absolute left-0 right-0 top-full z-50 border bg-white rounded-b-lg overflow-hidden shadow-lg"
            style={{
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              color: 'inherit',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col p-2 gap-1 max-h-[200px] overflow-auto">
              {OHAASA_SIGNS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="text-[10px] px-2 py-1 rounded border hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: 'var(--widget-surface-background, #ffffff)',
                    borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                    color: 'inherit',
                    fontWeight: s.id === ohaasaSign ? 700 : 500,
                  }}
                  onClick={() => handleSignChange(s.id as OhaasaSignId)}
                >
                  <span className="truncate">{s.ko}</span>
                  <span className="shrink-0 text-[11px]" style={{ opacity: s.id === ohaasaSign ? 0.9 : 0 }}>
                    ✓
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. 중단: 순위 확인 버튼 */}
      <div className="flex-1 p-2 flex items-center justify-center">
        <button
          className="px-4 py-2 text-sm font-bold rounded border hover:opacity-80 active:scale-95 transition-all disabled:opacity-50"
          style={{
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            color: 'inherit',
          }}
          onClick={handleOhaasaFetch}
          disabled={ohaasaLoading}
        >
          {ohaasaLoading
            ? '확인 중...'
            : ohaasaError
              ? '다시 시도'
              : ohaasaResult?.rank
                ? `${ohaasaResult.rank}위`
                : '순위 확인'}
        </button>
      </div>

      {/* 3. 하단: 행운 컬러 */}
      <div 
        className="border-t p-2 flex flex-col items-center justify-center gap-1"
        style={{
          borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
        }}
      >
        <div className="text-[9px] opacity-60" style={{ color: 'inherit' }}>
          오늘의 행운 컬러
        </div>
        {ohaasaResult?.luckyColor ? (
          <div className="flex items-center gap-1.5">
            <div 
              className="w-4 h-4 rounded border flex-shrink-0"
              style={{
                backgroundColor: getColorHex(ohaasaResult.luckyColor),
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}
            />
            <span className="text-xs font-medium" style={{ color: 'inherit' }}>
              {ohaasaResult.luckyColor}
            </span>
          </div>
        ) : ohaasaLoading ? (
          <div className="text-[10px] opacity-50">로딩 중...</div>
        ) : null}
      </div>
    </div>
  );
};

export default OhaAsaWidget;
