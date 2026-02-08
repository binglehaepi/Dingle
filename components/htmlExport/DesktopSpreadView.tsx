/**
 * DesktopSpreadView — PC/아이패드 전용 2페이지 스프레드 뷰
 *
 * 앱의 DesktopApp.tsx + BookSpreadView + MonthlySpread.tsx와 **동일한 마크업**을
 * 정적 HTML로 출력합니다.
 *
 * 핵심 설계:
 *   - 단일 1400×820 스프레드 컨테이너 (앱과 동일 크기)
 *   - 뷰포트 자동 스케일링으로 한 화면에 맞춤
 *   - data-note-shell, data-pages-wrapper, data-note-spread,
 *     data-note-paper, data-widget, data-widget-bar, data-calendar-header-bar,
 *     data-calendar-grid, data-ui="calendar-cell", data-month-tab 등
 *     **앱과 동일한 data 속성** 사용
 *   - Tailwind 유틸리티 클래스도 앱과 동일
 *   - 월 전환, 날짜 클릭→스크랩뷰는 바닐라 JS에서 처리 (htmlExport.ts)
 */

import React from 'react';
import { ScrapItem, LayoutTextData, DiaryStyle, LinkDockItem, KeyringFrameType } from '../../types';
import { ItemCard } from './ItemCards';

// ─── Types ───────────────────────────────────────────────────────
interface DesktopSpreadViewProps {
  items: ScrapItem[];
  textData: LayoutTextData;
  stylePref: DiaryStyle;
  linkDockItems?: LinkDockItem[];
}

interface MonthInfo {
  year: number;
  month: number;       // 0-based
  key: string;         // "YYYY-MM"
}

// ─── Constants ───────────────────────────────────────────────────
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_TABS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

// ─── Helpers ─────────────────────────────────────────────────────

function isDailyDate(dateKey: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
}

function groupByDate(items: ScrapItem[]): Map<string, ScrapItem[]> {
  const map = new Map<string, ScrapItem[]>();
  for (const item of items) {
    if (!item.diaryDate || !isDailyDate(item.diaryDate)) continue;
    const key = item.diaryDate;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function getActiveMonths(items: ScrapItem[], textData: LayoutTextData): MonthInfo[] {
  const seen = new Set<string>();
  const result: MonthInfo[] = [];

  for (const item of items) {
    if (!item.diaryDate || !isDailyDate(item.diaryDate)) continue;
    const monthKey = item.diaryDate.slice(0, 7);
    if (!seen.has(monthKey)) {
      seen.add(monthKey);
      const [y, m] = monthKey.split('-').map(Number);
      result.push({ year: y, month: m - 1, key: monthKey });
    }
  }

  for (const key of Object.keys(textData)) {
    const match = key.match(/^(\d{4})-(\d{2})-DASHBOARD$/);
    if (match) {
      const monthKey = `${match[1]}-${match[2]}`;
      if (!seen.has(monthKey)) {
        seen.add(monthKey);
        result.push({ year: Number(match[1]), month: Number(match[2]) - 1, key: monthKey });
      }
    }
  }

  return result.sort((a, b) => a.key.localeCompare(b.key));
}

function getPrimaryYear(months: MonthInfo[]): number {
  if (months.length === 0) return new Date().getFullYear();
  const yearCounts = new Map<number, number>();
  for (const m of months) {
    yearCounts.set(m.year, (yearCounts.get(m.year) || 0) + 1);
  }
  let maxYear = months[0].year;
  let maxCount = 0;
  for (const [year, count] of yearCounts) {
    if (count > maxCount) { maxCount = count; maxYear = year; }
  }
  return maxYear;
}

function formatDateDisplay(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  const [y, m, d] = parts.map(Number);
  const date = new Date(y, m - 1, d);
  const dow = WEEKDAYS_KO[date.getDay()];
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${dow})`;
}

// ─── Checklist Parser ────────────────────────────────────────────

interface CheckItem { text: string; checked: boolean; }

function parseChecklist(raw?: string): CheckItem[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const matchChecked = line.match(/^-\s*\[x\]\s*(.*)/i);
      if (matchChecked) return { text: matchChecked[1], checked: true };
      const matchUnchecked = line.match(/^-\s*\[\s?\]\s*(.*)/);
      if (matchUnchecked) return { text: matchUnchecked[1], checked: false };
      const plain = line.replace(/^-\s*/, '');
      return { text: plain, checked: false };
    });
}

// OhaAsa 별자리 한국어 라벨 매핑
const OHAASA_SIGN_LABELS: Record<string, string> = {
  aries: '양자리', taurus: '황소자리', gemini: '쌍둥이자리', cancer: '게자리',
  leo: '사자자리', virgo: '처녀자리', libra: '천칭자리', scorpio: '전갈자리',
  sagittarius: '사수자리', capricorn: '염소자리', aquarius: '물병자리', pisces: '물고기자리',
};

function computeDDay(dateStr?: string): string | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

// ─── Keyring (키링 장식 — 앱 Keyring.tsx 정적 재현) ──────────────

function Keyring({ stylePref }: { stylePref: DiaryStyle }) {
  const charmImage = stylePref.keyringImage || '';
  const charm = stylePref.keyring || '';
  const frameType: KeyringFrameType = stylePref.keyringFrame || 'rounded-square';

  // 앱 Keyring.tsx와 동일한 프레임 스타일 로직
  const getFrameStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: '40px',
      height: '40px',
      border: '2px solid var(--keyring-frame-border-color, #764737)',
      overflow: 'hidden',
      marginTop: '-2px',
      marginLeft: 'auto',
      marginRight: 'auto',
      background: 'var(--widget-surface-background, #ffffff)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.5)',
      position: 'relative',
    };
    switch (frameType) {
      case 'circle':
        return { ...base, borderRadius: '50%' };
      case 'heart':
        return {
          ...base,
          borderRadius: '0',
          clipPath: 'polygon(50% 100%, 15% 60%, 15% 35%, 25% 20%, 40% 15%, 50% 20%, 60% 15%, 75% 20%, 85% 35%, 85% 60%)',
          transform: 'scale(1.1)',
        };
      case 'rounded-square':
      default:
        return { ...base, borderRadius: '12px' };
    }
  };

  return (
    <div
      className="dg-keyring animate-swing"
      style={{ position: 'absolute', top: '80px', left: '-22px', zIndex: 60 }}
    >
      {/* 클립 */}
      <div
        className="dg-keyring__clip"
        style={{
          width: '20px',
          height: '28px',
          borderRadius: '9999px',
          border: '3px solid var(--keyring-metal-color, #764737)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
          margin: '0 auto',
        }}
      />
      {/* 체인 3링크 */}
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: '10px',
            height: '16px',
            borderRadius: '9999px',
            border: '2px solid var(--keyring-metal-color, #764737)',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
            marginTop: '-2px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        />
      ))}
      {/* 참(charm) 프레임 — frameType에 따른 모양 */}
      <div style={getFrameStyle()}>
        {charmImage ? (
          <img src={charmImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : charm ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            {charm}
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              opacity: 0.3,
            }}
          >
            ✦
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DashboardWidgets (왼쪽 페이지 — 앱 MonthlySpread.tsx 동일 구조) ─

function DashboardWidgets({ monthKey, textData, compactMode }: { monthKey: string; textData: LayoutTextData; compactMode?: boolean }) {
  const dashboardKey = `${monthKey}-DASHBOARD`;
  const data = textData[dashboardKey] || {};
  const goalItems = parseChecklist(data.goals);
  const bucketItems = parseChecklist(data.bucketList);
  const dDayText = computeDDay(data.dDayDate);

  // compactMode에 따른 위젯바 텍스트 크기
  const barTextClass = compactMode ? 'text-[11px]' : 'text-[13px]';
  const profileBarTextClass = compactMode ? 'text-xs' : 'text-sm';

  return (
    <div className="relative z-10 w-full h-full flex flex-col gap-4">

      {/* ═══ Top Row (35%): Profile(30%) + Goals(flex-1) ═══ */}
      <div className="flex gap-4 h-[35%]">

        {/* Profile Widget */}
        <div
          data-widget="profile"
          className="w-[30%] border flex flex-col backdrop-blur-[1px] overflow-hidden"
          style={{
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
          }}
        >
          <div
            data-widget-bar
            className={`flex-shrink-0 text-center ${profileBarTextClass} py-1`}
            style={{
              background: 'var(--profile-header-bar-bg, #F9D4F0)',
              borderBottom: '1px solid var(--widget-border-color, var(--ui-stroke-color, #94a3b8))',
            }}
          >
            {data.profileName || 'NAME'}
          </div>
          <div className="flex-1 flex flex-col p-3 gap-2">
            <div
              className="flex-[2] w-full overflow-hidden relative"
              style={{ borderRadius: '8px' }}
            >
              {data.profileImage ? (
                <img src={data.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center border"
                  style={{
                    backgroundColor: 'var(--widget-surface-background, #ffffff)',
                    borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                  }}
                >
                  <span className="text-4xl opacity-30">👤</span>
                </div>
              )}
            </div>
            <div className="flex-1 flex items-center">
              <div
                className="w-full text-xs text-center rounded px-2 py-2"
                style={{
                  borderRadius: '8px',
                  backgroundColor: 'var(--widget-input-background, #f8fafc)',
                  border: '1px solid var(--widget-border-color, var(--ui-stroke-color, #94a3b8))',
                  color: 'var(--text-color-primary, #764737)',
                }}
              >
                {data.profileText || ''}
              </div>
            </div>
          </div>
        </div>

        {/* Goals Widget */}
        <div
          data-widget="goals"
          className="flex-1 border flex flex-col backdrop-blur-[1px] overflow-hidden"
          style={{
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
          }}
        >
          <div
            data-widget-bar
            className={`flex-shrink-0 text-center ${barTextClass} py-1`}
            style={{
              background: 'var(--goals-header-bar-bg, #FEDFDC)',
              borderBottom: '1px solid var(--widget-border-color, var(--ui-stroke-color, #94a3b8))',
            }}
          >
            Monthly Goals
          </div>
          <div className="flex-1 p-3 flex flex-col overflow-hidden">
            {/* 입력 필드 (앱 MonthlySpread.tsx 동일 — 정적) */}
            <div
              data-widget-input
              className="w-full text-sm border rounded-[4px] px-2 py-1.5 mb-2"
              style={{
                backgroundColor: 'var(--widget-input-background, #f8fafc)',
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                color: 'var(--text-color-primary, #764737)',
                opacity: goalItems.length > 0 ? 1 : 0.5,
              }}
            >
              {goalItems.length > 0 ? '' : 'Add goal…'}
            </div>
            {goalItems.length > 0 && (
              <div className="flex-1 flex flex-col gap-2 overflow-auto">
                {goalItems.map((item, i) => (
                  <div
                    key={i}
                    data-widget-input
                    className="flex items-center gap-2 px-2 py-1.5 border rounded-[4px]"
                    style={{
                      backgroundColor: 'var(--widget-surface-background, #ffffff)',
                      borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border"
                      style={{
                        borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                        fontSize: '10px',
                        color: 'var(--text-color-primary, #764737)',
                      }}
                    >
                      {item.checked ? '✓' : ''}
                    </span>
                    <span
                      className={`flex-1 text-xs ${item.checked ? 'line-through opacity-50' : ''}`}
                      style={{ color: 'var(--text-color-primary, #764737)' }}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Mid Row (35%): [D-Day + OhaAsa](30%) + CD Player(flex-1) ═══ */}
      <div className="flex gap-4 h-[35%]">

        {/* Left Column: D-Day + OhaAsa */}
        <div className="w-[30%] flex flex-col gap-4">

          {/* D-Day Widget — 앱: font-mono text-3xl font-bold */}
          <div
            data-widget="dday"
            className="flex-1 border flex flex-col backdrop-blur-[1px] overflow-hidden relative"
            style={{
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              backgroundColor: 'var(--widget-surface-background, #ffffff)',
            }}
          >
            {data.dDayBgImage && (
              <div
                className="absolute inset-0 bg-cover bg-center z-0"
                style={{ backgroundImage: `url(${data.dDayBgImage})` }}
              />
            )}
            {data.dDayBgImage && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-0" />
            )}
            <div
              data-widget-bar
              className={`flex-shrink-0 text-center ${barTextClass} py-1 relative z-10`}
              style={{
                background: 'var(--dday-header-bar-bg, #FCF5C8)',
                borderBottom: '1px solid var(--widget-border-color, var(--ui-stroke-color, #94a3b8))',
              }}
            >
              {data.dDayTitle || 'EVENT'}
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              {dDayText ? (
                <>
                  <span
                    className="font-mono text-3xl font-bold"
                    style={{ color: 'var(--text-color-primary, #764737)' }}
                  >
                    {dDayText}
                  </span>
                  {data.dDayDate && (
                    <span
                      className="text-[10px] mt-1"
                      style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.7 }}
                    >
                      {data.dDayDate}
                    </span>
                  )}
                </>
              ) : (
                <div className="opacity-30 text-xs font-semibold">D-Day</div>
              )}
            </div>
          </div>

          {/* OhaAsa Widget — 앱: 2열 레이아웃 */}
          <div
            data-widget="ohaasa"
            className="flex-1 border flex flex-col backdrop-blur-[1px] overflow-hidden"
            style={{
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              backgroundColor: 'var(--widget-surface-background, #ffffff)',
            }}
          >
            <div
              data-widget-bar
              className={`flex-shrink-0 text-center ${barTextClass} py-0.5`}
              style={{
                background: 'var(--ohaasa-header-bar-bg, #EBE7F5)',
                borderBottom: '1px solid var(--widget-border-color, var(--ui-stroke-color, #94a3b8))',
              }}
            >
              <span className="flex items-center justify-center w-full relative">
                <span className="text-center w-full truncate px-6">
                  {(() => {
                    const sign = (data as Record<string, string | undefined>).ohaasaSign || '';
                    return OHAASA_SIGN_LABELS[sign] || 'OhaAsa';
                  })()}
                </span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px]" style={{ opacity: 0.75 }}>▾</span>
              </span>
            </div>
            {/* 2열 레이아웃 — 앱 MonthlySpread.tsx 동일 */}
            <div
              className="flex-1 flex"
              style={{
                borderTop: '1px solid var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}
            >
              {/* 왼쪽: 순위 확인 버튼 */}
              <div
                className="flex-1 p-2 flex items-center justify-center"
                style={{
                  borderRight: '1px solid var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                }}
              >
                <a
                  href="https://x.com/Hi_Ohaasa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold rounded border"
                  style={{
                    backgroundColor: 'var(--widget-surface-background, #ffffff)',
                    borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  순위 확인
                </a>
              </div>
              {/* 오른쪽: 오늘의 오하아사 */}
              <div className="flex-1 p-2 flex flex-col items-center justify-center gap-1">
                <div
                  className="text-[10px] opacity-70 text-center leading-tight"
                  style={{ color: 'inherit' }}
                >
                  오늘의<br />오하아사
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CD Player Widget — 앱: data-widget="cd" flex-1 */}
        <div data-widget="cd" className="flex-1 relative">
          <div
            className="absolute inset-0 rounded-xl flex flex-row items-center p-3 gap-3 overflow-hidden"
            style={{
              backgroundColor: data.cdBodyBgImage ? 'transparent' : 'var(--cd-widget-background, #F4F5E1)',
              backgroundImage: data.cdBodyBgImage ? `url(${data.cdBodyBgImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {data.cdBodyBgImage && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />
            )}

            {/* CD Disc */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className="w-40 h-40 rounded-full overflow-hidden relative"
                style={{ backgroundColor: 'var(--cd-disc-color, #1e293b)' }}
              >
                {data.photoUrl ? (
                  <img src={data.photoUrl} alt="CD" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center"
                    style={{ backgroundColor: 'var(--cd-disc-color, #1e293b)', color: 'var(--text-color-primary, #764737)' }}
                  >
                    <span className="text-[8px]">NO DISC</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-full" />
                <div
                  className="absolute inset-[40%] rounded-full"
                  style={{ boxShadow: 'inset 0 0 0 var(--ui-stroke-width, 1px) var(--ui-stroke-color)' }}
                />
              </div>
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/30 backdrop-blur rounded-full flex items-center justify-center z-10 pointer-events-none"
                style={{ boxShadow: 'inset 0 0 0 var(--ui-stroke-width, 1px) var(--ui-stroke-color)' }}
              >
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
              </div>
            </div>

            {/* Control Panel */}
            <div className="relative z-10 flex-1 flex flex-col h-full justify-center gap-2 min-w-0">
              {/* Screen */}
              <div
                className="rounded p-2 mb-1 flex items-center h-16 relative overflow-hidden border"
                style={{
                  backgroundColor: 'var(--cd-screen-bg, #1e293b)',
                  borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                }}
              >
                <div className="absolute inset-0 bg-teal-500/5 pointer-events-none" />
                <span
                  className="w-full text-xs text-center"
                  style={{ color: 'var(--text-color-primary, #764737)' }}
                >
                  {data.musicTitle || 'TRACK 01...'}
                </span>
              </div>
              {/* LINK + 💿 두 버튼 (앱 MonthlySpread.tsx 동일 레이아웃) */}
              <div className="flex gap-2 justify-center">
                {data.musicUrl ? (
                  <a
                    href={data.musicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 flex-1 rounded border flex items-center justify-center gap-1"
                    style={{
                      backgroundColor: 'var(--cd-button-bg, #ffffff)',
                      borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                      textDecoration: 'none',
                    }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-color-primary, #764737)' }}>LINK</span>
                  </a>
                ) : (
                  <div
                    className="h-10 flex-1 rounded border flex items-center justify-center gap-1"
                    style={{
                      backgroundColor: 'var(--cd-button-bg, #ffffff)',
                      borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                    }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-color-primary, #764737)' }}>LINK</span>
                  </div>
                )}
                <div
                  className="h-10 w-10 rounded border flex items-center justify-center text-xl"
                  style={{
                    backgroundColor: 'var(--cd-button-bg, #ffffff)',
                    borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                    color: 'var(--text-color-primary, #764737)',
                  }}
                >
                  💿
                </div>
              </div>
              {/* 하단 점 3개 — 앱 동일 */}
              <div
                className="flex justify-between px-2 pt-1"
                style={{ borderTop: 'var(--ui-stroke-width, 1px) solid var(--ui-stroke-color)' }}
              >
                <div className="dg-cd-dot" style={{ backgroundColor: 'var(--ui-stroke-color)' }} />
                <div className="dg-cd-dot" style={{ backgroundColor: 'var(--ui-stroke-color)' }} />
                <div className="dg-cd-dot" style={{ backgroundColor: 'var(--ui-stroke-color)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Bot Row (flex-1): Bucket List ═══ */}
      <div className="flex-1 min-h-0">
        <div
          data-widget="bucket"
          className="h-full border flex flex-col backdrop-blur-[1px] overflow-hidden relative"
          style={{
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
          }}
        >
          {data.bucketBgImage && (
            <div
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{ backgroundImage: `url(${data.bucketBgImage})` }}
            />
          )}
          {data.bucketBgImage && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-0" />
          )}
          <div
            data-widget-bar
            className={`flex-shrink-0 text-center ${barTextClass} py-1 relative z-10`}
            style={{
              background: 'var(--bucket-header-bar-bg, #EFF1AA)',
              borderBottom: '1px solid var(--widget-border-color, var(--ui-stroke-color, #94a3b8))',
            }}
          >
            Bucket List
          </div>
          <div className="flex-1 p-3 pt-2 flex flex-col overflow-hidden relative z-10">
            {/* 입력 필드 (앱 MonthlySpread.tsx 동일 — 정적) */}
            <div
              data-widget-input
              className="w-full text-sm border rounded-[4px] px-2 py-1.5 mb-2"
              style={{
                backgroundColor: 'var(--widget-input-background, #f8fafc)',
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                color: 'var(--text-color-primary, #764737)',
                opacity: bucketItems.length > 0 ? 1 : 0.5,
              }}
            >
              {bucketItems.length > 0 ? '' : 'Add item…'}
            </div>
            {bucketItems.length > 0 && (
              <div className="flex-1 flex flex-col gap-2 overflow-auto">
                {bucketItems.map((item, i) => (
                  <div
                    key={i}
                    data-widget-input
                    className="flex items-center gap-2 px-2 py-1.5 border rounded-[4px]"
                    style={{
                      backgroundColor: 'var(--widget-surface-background, #ffffff)',
                      borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border"
                      style={{
                        borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                        fontSize: '10px',
                        color: 'var(--text-color-primary, #764737)',
                      }}
                    >
                      {item.checked ? '✓' : ''}
                    </span>
                    <span
                      className={`flex-1 text-xs ${item.checked ? 'line-through opacity-50' : ''}`}
                      style={{ color: 'var(--text-color-primary, #764737)' }}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SpreadCalendar (오른쪽 페이지 — 앱 MonthlySpread.tsx 동일 구조) ─

function SpreadCalendar({
  year,
  month,
  dateGroups,
  textData,
  compactMode,
}: {
  year: number;
  month: number;
  dateGroups: Map<string, ScrapItem[]>;
  textData: LayoutTextData;
  compactMode?: boolean;
}) {
  // 6×7 고정 42칸 (앱과 동일)
  const monthStart = new Date(year, month, 1);
  const startDow = monthStart.getDay();
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startDow);

  const cells: { date: Date; isInMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({ date: d, isInMonth: d.getFullYear() === year && d.getMonth() === month });
  }

  const weeks: { date: Date; isInMonth: boolean }[][] = [];
  for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const dashKey = `${monthKey}-DASHBOARD`;
  const dashData = textData[dashKey] || {};
  const dowBgKeys = ['dowSunBg', 'dowMonBg', 'dowTueBg', 'dowWedBg', 'dowThuBg', 'dowFriBg', 'dowSatBg'];

  // Calendar header background image
  const headerBgImage = dashData.monthHeaderBg || '';
  // Marquee text (localStorage 기반이라 textData에 직접 없을 수 있음)
  const marqueeText = (dashData as Record<string, string | undefined>).marqueeText || '';

  return (
    <div className="flex-1 flex flex-col gap-3" data-calendar-grid>

      {/* ═══ 3칸 그리드 헤더바 ═══ */}
      <div
        data-calendar-header-bar
        className="w-full border rounded-lg overflow-hidden flex-shrink-0"
        style={{
          borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          backgroundColor: 'var(--widget-surface-background, #ffffff)',
          backgroundImage: headerBgImage ? `url(${headerBgImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '52px',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: compactMode ? '100px 1fr 100px' : '140px 1fr 140px',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* 월 이름 */}
        <div className="min-w-0">
          <div
            className="w-full h-8 border rounded flex items-center justify-center overflow-hidden"
            style={{
              backgroundColor: 'var(--widget-surface-background, #ffffff)',
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              fontSize: compactMode ? '14px' : '16px',
              fontWeight: 700,
            }}
          >
            {new Date(year, month, 1).toLocaleString('en-US', { month: 'long' }).toUpperCase()}
          </div>
        </div>

        {/* 전광판 (마키) */}
        <div
          className="min-w-0 h-8 border rounded px-2 flex items-center overflow-hidden"
          style={{
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          }}
        >
          {marqueeText ? (
            <div className="dg-marquee" data-ui="calendar-marquee">
              <span className="dg-marquee__text">{marqueeText}</span>
            </div>
          ) : (
            <div
              className="w-full text-center text-[12px]"
              style={{ opacity: 0.4 }}
            >
              전광판
            </div>
          )}
        </div>

        {/* 년도 표시 (앱 MonthlySpread.tsx: < year > 화살표 포함) */}
        <div
          className="flex items-center justify-end gap-2 h-8 border rounded px-1"
          style={{
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          }}
        >
          {/* 이전 년도 화살표 */}
          <div
            className="flex items-center justify-center w-7 h-7"
            style={{ color: 'var(--text-color-primary, #764737)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </div>

          <span className={compactMode ? 'text-[11px]' : 'text-[13px]'} style={{ fontWeight: 600 }}>{year}</span>

          {/* 다음 년도 화살표 */}
          <div
            className="flex items-center justify-center w-7 h-7"
            style={{ color: 'var(--text-color-primary, #764737)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* 달력 컨테이너 (앱 MonthlySpread.tsx: border rounded overflow-hidden) */}
      <div
        className="flex-1 w-full border rounded overflow-hidden flex flex-col"
        style={{
          borderColor: 'var(--calendar-grid-line-color, var(--ui-stroke-color, #d1d5db))',
          backgroundColor: 'transparent',
        }}
      >

      {/* 요일 헤더 — 앱 MonthlySpread.tsx data-calendar-weekday-header 동일 구조 */}
      <div
        data-calendar-weekday-header
        className="grid grid-cols-7 h-9 flex-shrink-0"
        style={{
          backgroundColor: 'var(--calendar-weekday-header-bg, #FEDFDC)',
        }}
      >
        {WEEKDAYS.map((d, i) => {
          const bgImage = dashData[dowBgKeys[i]] || '';
          return (
            <div
              key={i}
              className={`flex items-center justify-center ${compactMode ? 'text-[10px]' : 'text-xs'} font-mono font-bold relative overflow-hidden`}
              style={{
                color: 'var(--text-color-primary, #764737)',
                borderRight: i < 6 ? '1px solid var(--calendar-grid-line-color, var(--ui-stroke-color, #d1d5db))' : 'none',
                borderBottom: '1px solid var(--calendar-grid-line-color, var(--ui-stroke-color, #d1d5db))',
                ...(bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
              }}
            >
              {bgImage && <span className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />}
              <span className="relative z-10">{d}</span>
            </div>
          );
        })}
      </div>

      {/* 6×7 그리드 — 앱: grid-cols-7, grid-template-rows: repeat(6,1fr) */}
      <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: 'repeat(6, 1fr)' }}>
        {weeks.map((week, wIdx) =>
          week.map((cell, cIdx) => {
            const dateKey = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}`;
            const dayItems = dateGroups.get(dateKey) || [];
            const hasItems = cell.isInMonth && dayItems.length > 0;
            const isToday = new Date().toDateString() === cell.date.toDateString();

            const coverImage = textData[dateKey]?.coverImage;
            const mainItem = dayItems.find(i => i.isMainItem);
            const displayImage = coverImage || mainItem?.metadata?.imageUrl || '';

            return (
              <div
                key={`${wIdx}-${cIdx}`}
                data-ui="calendar-cell"
                data-diary-date={dateKey}
                data-in-month={cell.isInMonth ? 'true' : 'false'}
                {...(isToday ? { 'data-today-cell': 'true' } : {})}
                {...(hasItems ? { 'data-date-link': dateKey } : {})}
                className="relative p-0.5 w-full h-full flex flex-col gap-0.5 overflow-hidden"
                style={{
                  backgroundColor: isToday
                    ? 'var(--calendar-today-highlight-bg, #FFFCE1)'
                    : cell.isInMonth
                      ? 'var(--calendar-cell-background, #ffffff)'
                      : '#ffffff',
                  borderRight: cIdx < 6 ? '1px solid var(--calendar-grid-line-color, #d1d5db)' : 'none',
                  borderBottom: wIdx < 5 ? '1px solid var(--calendar-grid-line-color, #d1d5db)' : 'none',
                }}
              >
                {displayImage ? (
                  <>
                    <div className="absolute inset-0 rounded-sm overflow-hidden z-0">
                      <img src={displayImage} alt="" className="w-full h-full object-cover opacity-90 mix-blend-multiply" loading="lazy" />
                    </div>
                    <span
                      className={`relative z-10 ${compactMode ? 'text-[8px]' : 'text-[9px]'} font-mono font-bold ml-0.5 px-1 py-0.5 rounded`}
                      style={{
                        color: 'var(--text-color-primary, #764737)',
                        opacity: cell.isInMonth ? 1 : 0.35,
                        textShadow: '0 0 2px rgba(255, 255, 255, 0.8), 0 0 4px rgba(255, 255, 255, 0.6)',
                      }}
                    >
                      {cell.date.getDate()}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className={`${compactMode ? 'text-[8px]' : 'text-[9px]'} font-mono font-bold ml-1`}
                      style={{ color: 'var(--text-color-primary, #764737)', opacity: cell.isInMonth ? 1 : 0.35 }}
                    >
                      {cell.date.getDate()}
                    </span>
                    {hasItems && (
                      <div className="flex flex-wrap gap-0.5 content-start">
                        {dayItems.slice(0, 3).map((item, di) => (
                          <div key={di} className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-70" />
                        ))}
                        {dayItems.length > 3 && (
                          <span className="text-[8px] leading-none" style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.5 }}>+</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
      </div>{/* 달력 컨테이너 닫기 */}
    </div>
  );
}

// ─── LinkDockBar (앱 LinkDock.tsx 비주얼 재현 — 정적) ─────────

function LinkDockBar({ links, monthKey }: { links: LinkDockItem[]; monthKey: string }) {
  // 기본 날짜: 해당 월의 1일
  const defaultDate = `${monthKey}-01`;

  return (
    <div data-ui="link-dock" className="w-full">
      <div
        className="flex items-center gap-2 flex-nowrap border rounded-lg px-3"
        style={{
          height: '52px',
          borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          backgroundColor: 'var(--widget-surface-background, #ffffff)',
        }}
      >
        {/* 날짜 입력 (정적) */}
        <div
          className="shrink-0 border rounded px-2 flex items-center text-[11px]"
          style={{
            width: 132,
            height: 32,
            backgroundColor: 'var(--widget-input-background, #f8fafc)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            color: 'var(--text-color-primary, #764737)',
          }}
        >
          {defaultDate}
        </div>

        {/* URL 입력 (정적 placeholder) */}
        <div
          className="flex-1 min-w-0 border rounded px-2 flex items-center text-[12px]"
          style={{
            height: 32,
            backgroundColor: 'var(--widget-input-background, #f8fafc)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            color: 'var(--text-color-primary, #764737)',
            opacity: 0.5,
          }}
        >
          여기 링크를 넣어주세요
        </div>

        {/* 추가 버튼 */}
        <div
          className="shrink-0 rounded flex items-center justify-center text-[12px] font-bold"
          style={{
            height: 32,
            minWidth: 64,
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
            border: 'var(--ui-stroke-width, 1px) solid var(--ui-stroke-color)',
            color: 'var(--text-color-primary, #764737)',
          }}
        >
          추가
        </div>

        {/* 사진 추가 아이콘 */}
        <div
          className="shrink-0 rounded flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
            border: 'var(--ui-stroke-width, 1px) solid var(--ui-stroke-color)',
            color: 'var(--text-color-primary, #764737)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── ScrapView (날짜 클릭 시 2페이지 스프레드 — 앱 FreeLayout 재현) ──

function formatDateDot(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

function ScrapView({ dateGroups, compactMode }: { dateGroups: Map<string, ScrapItem[]>; compactMode?: boolean }) {
  const spreadW = compactMode ? 1100 : 1400;
  const sortedKeys = [...dateGroups.keys()].sort();

  return (
    <div
      data-scrap-view
      className="absolute inset-0 z-[5]"
      style={{ display: 'none', position: 'absolute', zIndex: 5 }}
    >
      {[...dateGroups.entries()].map(([dateKey, dateItems]) => {
        // 날짜에서 day 추출
        const dayNum = parseInt(dateKey.split('-')[2], 10);

        return (
          <div
            key={dateKey}
            data-date-panel={dateKey}
            className="absolute inset-0 grid grid-cols-2 grid-rows-1 h-full"
            style={{ display: 'none' }}
          >
            {/* ── Left Page (FreeLayout 좌측) ── */}
            <div
              className="relative flex flex-col h-full"
              style={{ backgroundColor: 'transparent', backgroundImage: 'none' }}
            >
              {/* 헤더 — 앱: p-5 pb-2 border-b border-dashed h-14 */}
              <div
                className="p-5 pb-2 flex items-center justify-between z-20 relative h-14"
                style={{ borderBottom: '1px dashed var(--note-center-fold-line-color, rgba(148, 163, 184, 0.3))' }}
              >
                <div className="font-bold text-base" style={{ color: 'var(--ui-stroke-color, #44403c)', fontFamily: 'var(--font-handwriting, inherit)' }}>
                  {formatDateDot(dateKey)}
                </div>
              </div>

              {/* 하단 — PREV 버튼 */}
              <div className="mt-auto p-4 flex justify-start z-50">
                <button
                  data-prev-btn
                  data-current-date={dateKey}
                  className="flex items-center gap-1 font-bold text-xs px-2 py-1 rounded"
                  style={{ color: 'var(--ui-stroke-color, #a8a29e)', cursor: 'pointer', opacity: 0.6 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  PREV
                </button>
              </div>
            </div>

            {/* ── Right Page (FreeLayout 우측) ── */}
            <div
              className="relative flex flex-col h-full"
              style={{ backgroundColor: 'transparent', backgroundImage: 'none' }}
            >
              {/* 헤더 — 빈 공간 (앱에서는 UrlInput이 absolute로 위치) */}
              <div
                className="p-5 pb-2 flex justify-end items-center z-20 relative h-14"
                style={{ borderBottom: '1px dashed var(--note-center-fold-line-color, rgba(148, 163, 184, 0.3))' }}
              />

              {/* 하단 — 페이지번호 + NEXT 버튼 */}
              <div className="mt-auto p-4 flex justify-end items-center gap-4 z-50">
                <span className="font-mono tracking-widest" style={{ fontSize: '10px', color: 'var(--ui-stroke-color, #d6d3d1)', opacity: 0.5 }}>
                  NO. {dayNum}
                </span>
                <button
                  data-next-btn
                  data-current-date={dateKey}
                  className="flex items-center gap-1 font-bold text-xs px-2 py-1 rounded"
                  style={{ color: 'var(--ui-stroke-color, #a8a29e)', cursor: 'pointer', opacity: 0.6 }}
                >
                  NEXT
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Canvas Layer — 앱 BookSpreadView의 아이템 레이어 재현 ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 30 }}
            >
              {dateItems.map(item => {
                const pos = item.position;
                const hasPos = pos && (pos.x !== 0 || pos.y !== 0);
                if (hasPos) {
                  const leftPct = (pos.x / spreadW) * 100;
                  const topPct = (pos.y / 820) * 100;
                  const rotation = pos.rotation || 0;
                  const scale = pos.scale || 1;
                  return (
                    <div
                      key={item.id}
                      className="absolute pointer-events-auto"
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        zIndex: Math.min(pos.z || 0, 999),
                        transform: `rotate(${rotation}deg) scale(${scale})`,
                      }}
                    >
                      <ItemCard item={item} />
                    </div>
                  );
                }
                return (
                  <div key={item.id} className="pointer-events-auto" style={{ position: 'relative', margin: '16px' }}>
                    <ItemCard item={item} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 중앙 접힘선 */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: '1px',
        backgroundColor: 'var(--note-center-fold-line-color, rgba(148, 163, 184, 0.3))',
        zIndex: 10,
        transform: 'translateX(-50%)',
        pointerEvents: 'none' as const,
      }} />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export const DesktopSpreadView: React.FC<DesktopSpreadViewProps> = ({ items, textData, stylePref, linkDockItems }) => {
  const dailyItems = items.filter(i => i.diaryDate && isDailyDate(i.diaryDate));
  const dateGroups = groupByDate(dailyItems);
  const activeMonths = getActiveMonths(items, textData);

  if (activeMonths.length === 0) {
    return (
      <div className="dg-export-page">
        <div className="text-center py-20 opacity-40">
          <p className="text-lg font-semibold">아직 아이템이 없습니다</p>
        </div>
      </div>
    );
  }

  const primaryYear = getPrimaryYear(activeMonths);
  const firstMonth = activeMonths[0];

  return (
    <div className="dg-export-page">

      {/* ── Planner Container (1400×820, 뷰포트 자동 스케일링) ── */}
      <div className="dg-planner">

        {/* 키링 장식 — 앱 Keyring.tsx 재현 */}
        <Keyring stylePref={stylePref} />

        {/* Note Shell — 앱: data-note-shell */}
        <div
          data-note-shell
          className="absolute inset-0 bg-transparent rounded-lg flex z-10 overflow-hidden"
          style={{ border: '1px solid var(--note-outer-border-color, var(--ui-stroke-color, #764737))' }}
        >
          {/* BookSpreadView — 앱: note-paper-surface bg-custom-paper grid grid-cols-2 */}
          <div
            data-pages-wrapper
            data-note-spread
            className="relative w-full h-full note-paper-surface bg-custom-paper grid grid-cols-2"
          >
            {/* ═══ LEFT PAGE ═══ */}
            <div
              data-note-paper="left"
              className="flex-1 border-r relative flex flex-col p-8 gap-4 overflow-hidden"
              style={{
                backgroundColor: 'transparent',
                backgroundImage: 'none',
                borderRightColor: 'var(--note-center-fold-line-color, rgba(148, 163, 184, 0.3))',
                borderRightWidth: '2px',
              }}
            >
              {/* 월별 위젯 콘텐츠 (JS로 전환) */}
              <div data-widget-container className="flex-1 flex flex-col">
                {activeMonths.map(({ key: monthKey }, idx) => (
                  <div
                    key={monthKey}
                    data-month-content={monthKey}
                    className="flex-1 flex flex-col"
                    style={idx > 0 ? { display: 'none' } : undefined}
                  >
                    <DashboardWidgets monthKey={monthKey} textData={textData} compactMode={stylePref.compactMode} />
                  </div>
                ))}
              </div>

            </div>

            {/* ═══ RIGHT PAGE ═══ */}
            <div
              className="flex-1 relative flex flex-col p-8 gap-3 overflow-hidden"
            >
              {activeMonths.map(({ year, month, key: monthKey }, idx) => (
                <div
                  key={monthKey}
                  data-month-calendar={monthKey}
                  className="flex-1 flex flex-col gap-3"
                  style={idx > 0 ? { display: 'none' } : undefined}
                >
                  <SpreadCalendar
                    year={year}
                    month={month}
                    dateGroups={dateGroups}
                    textData={textData}
                    compactMode={stylePref.compactMode}
                  />

                  {/* 링크독 바 */}
                  <LinkDockBar
                    links={(linkDockItems || []).filter(li =>
                      li.assignedDate && li.assignedDate.startsWith(monthKey)
                    )}
                    monthKey={monthKey}
                  />
                </div>
              ))}
            </div>

            {/* ═══ ScrapView (날짜 클릭 시 2페이지 스프레드 — 앱 FreeLayout 재현) ═══ */}
            <ScrapView dateGroups={dateGroups} compactMode={stylePref.compactMode} />
          </div>
        </div>

        {/* ═══ Month Tabs (외부, 앱과 동일 위치) ═══ */}
        <div className="absolute top-8 -right-8 flex flex-col gap-1 z-0">
          {MONTH_TABS.map((label, i) => {
            const tabMonthKey = `${primaryYear}-${String(i + 1).padStart(2, '0')}`;
            const exists = activeMonths.some(m => m.key === tabMonthKey);
            const isFirst = firstMonth.key === tabMonthKey;
            return (
              <button
                key={label}
                data-month-tab
                data-tab-month={exists ? tabMonthKey : undefined}
                {...(isFirst ? { 'data-month-tab-active': 'true' } : {})}
                className={`w-12 h-10 rounded-r-md flex items-center pl-4 justify-start text-[10px] font-bold tracking-widest border border-l-0 transition-transform ${isFirst ? 'translate-x-0 font-black' : '-translate-x-1'}`}
                style={{
                  backgroundColor: isFirst ? 'var(--month-tab-bg-active)' : 'var(--month-tab-bg)',
                  borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, #764737))',
                  color: 'var(--month-tab-text-color)',
                  opacity: exists ? 1 : 0.3,
                  cursor: exists ? 'pointer' : 'default',
                }}
              >
                {label}
              </button>
            );
          })}

          {/* Star Scrap Page Tab — 앱 DesktopApp.tsx 동일 */}
          <button
            data-month-tab
            className="w-12 h-10 rounded-r-md flex items-center justify-center border border-l-0 -translate-x-1 mt-2"
            style={{
              backgroundColor: 'var(--month-tab-bg)',
              borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, #764737))',
              color: 'var(--month-tab-text-color)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesktopSpreadView;
