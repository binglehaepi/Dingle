/**
 * DiaryHTMLView — HTML 내보내기 전용 정적 React 컴포넌트
 *
 * renderToStaticMarkup으로 변환될 순수 정적 컴포넌트.
 * 클라이언트 사이드 상호작용은 htmlExport.ts의 바닐라 JS에서 처리.
 *
 * PC/아이패드 전용 단일 뷰 (모바일은 추후 별도 설계)
 */

import React from 'react';
import { ScrapItem, LayoutTextData, DiaryStyle, LinkDockItem } from '../../types';
import { DesktopSpreadView } from './DesktopSpreadView';

// ─── Types ───────────────────────────────────────────────────────
interface DiaryHTMLViewProps {
  items: ScrapItem[];
  textData: LayoutTextData;
  stylePref: DiaryStyle;
  linkDockItems?: LinkDockItem[];
}

// ─── Main Component ──────────────────────────────────────────────

export const DiaryHTMLView: React.FC<DiaryHTMLViewProps> = ({ items, textData, stylePref, linkDockItems }) => {
  return (
    <DesktopSpreadView items={items} textData={textData} stylePref={stylePref} linkDockItems={linkDockItems} />
  );
};

export default DiaryHTMLView;
