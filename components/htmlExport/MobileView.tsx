/**
 * MobileView — 모바일 전용 순차 나열 레이아웃
 *
 * 900px 미만에서 표시되는 간단한 세로 레이아웃.
 * 월별 → 날짜별로 아이템 카드를 세로로 나열합니다.
 */

import React from 'react';
import { ScrapItem, LayoutTextData, DiaryStyle } from '../../types';
import { ItemCard } from './ItemCards';

// ─── Types ───────────────────────────────────────────────────────
interface MobileViewProps {
  items: ScrapItem[];
  textData: LayoutTextData;
  stylePref: DiaryStyle;
}

// ─── Helpers ─────────────────────────────────────────────────────

/** YYYY-MM-DD 형식인지 확인 */
function isDailyDate(dateKey: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
}

/** 아이템을 날짜별로 그룹핑 */
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

/** 날짜별 그룹을 월별로 재그룹핑 */
function groupByMonth(dateGroups: Map<string, ScrapItem[]>): Map<string, Map<string, ScrapItem[]>> {
  const result = new Map<string, Map<string, ScrapItem[]>>();
  for (const [dateKey, items] of dateGroups) {
    const monthKey = dateKey.slice(0, 7); // YYYY-MM
    if (!result.has(monthKey)) result.set(monthKey, new Map());
    result.get(monthKey)!.set(dateKey, items);
  }
  return result;
}

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function formatDateDisplay(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  const [y, m, d] = parts.map(Number);
  const date = new Date(y, m - 1, d);
  const dow = WEEKDAYS_KO[date.getDay()];
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${dow})`;
}

// ─── Main Component ──────────────────────────────────────────────

export const MobileView: React.FC<MobileViewProps> = ({ items, textData, stylePref }) => {
  const dailyItems = items.filter(i => i.diaryDate && isDailyDate(i.diaryDate));
  const dateGroups = groupByDate(dailyItems);
  const monthGroups = groupByMonth(dateGroups);

  if (monthGroups.size === 0) {
    return (
      <div className="dg-mobile-empty">
        <p>아직 아이템이 없어요</p>
      </div>
    );
  }

  return (
    <>
      <header className="dg-mobile-header">
        <h1 className="dg-mobile-header__title">My Dingle Diary</h1>
      </header>

      {[...monthGroups.entries()].map(([monthKey, dates]) => {
        const [y, m] = monthKey.split('-').map(Number);
        return (
          <section key={monthKey} className="dg-mobile-month">
            <h2 className="dg-mobile-month__title">
              {y}년 {MONTH_LABELS[m - 1]}
            </h2>

            {[...dates.entries()].map(([dateKey, dateItems]) => (
              <div key={dateKey} className="dg-mobile-date">
                <div className="dg-mobile-date__header">
                  <span className="dg-mobile-date__label">{formatDateDisplay(dateKey)}</span>
                  <span className="dg-mobile-date__count">{dateItems.length}개</span>
                </div>
                <div className="dg-mobile-date__items">
                  {dateItems.map(item => (
                    <div key={item.id} className="dg-mobile-item">
                      <ItemCard item={item} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}

      <footer className="dg-footer">
        <p>Made with 💕 <strong>Dingle</strong> — Digital Scrap Diary</p>
      </footer>
    </>
  );
};

export default MobileView;
