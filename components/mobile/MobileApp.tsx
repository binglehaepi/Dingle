import React, { useEffect, useState } from 'react';
import { ScrapItem, LayoutType, PageSide, DiaryStyle, LayoutTextData, FontId, UIPalette, UITokens } from '../../types';
import { DEFAULT_UI_PALETTE, DEFAULT_UI_TOKENS } from '../../constants/appConstants';
import { DEFAULT_FONT_ID, MOBILE_FONT_IDS } from '../../constants/fonts';
import MobileFAB from './MobileFAB';
import MobileMonthView from './MobileMonthView';
import MobileScrapView from './MobileScrapView';
import PaletteEditorModal from '../PaletteEditorModal';
import EmbedPreviewModal from '../EmbedPreviewModal';
import { EMBED_PREVIEW_EVENT, type EmbedPreviewOpenDetail } from '../../utils/embedPreview';

interface MobileAppProps {
  // 데이터
  items: ScrapItem[];
  currentLayout: LayoutType;
  currentDate: Date;
  diaryStyle: DiaryStyle;
  textData: LayoutTextData;
  
  // 상태 변경
  setCurrentLayout: (layout: LayoutType) => void;
  setCurrentDate: (date: Date) => void;
  setDiaryStyle?: (style: DiaryStyle) => void;
  onUpdateItem: (id: string, updates: Partial<ScrapItem>) => void;
  onDeleteItem: (id: string) => void;
  onUpdateText: (key: string, value: string) => void;
  
  // 아이템 생성
  onAddSticker: () => void;
  onAddLink: (url: string) => void;
  onAddImage: (file: File) => void;
  onAddVideo: (file: File) => void;
  
  // UI 상태
  loading: boolean;
  maxZ: number;
  onBringToFront: (id: string) => void;
}

const MobileApp: React.FC<MobileAppProps> = (props) => {
  const {
    items,
    currentLayout,
    currentDate,
    diaryStyle,
    textData,
    setCurrentLayout,
    setCurrentDate,
    setDiaryStyle,
    onUpdateItem,
    onDeleteItem,
    onUpdateText,
    onAddSticker,
    onAddLink,
    onAddImage,
    onAddVideo,
    loading,
    maxZ,
    onBringToFront
  } = props;

  const [activeSide, setActiveSide] = useState<PageSide>('left');
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [showPaletteEditor, setShowPaletteEditor] = useState(false);
  const [embedPreview, setEmbedPreview] = useState<{ url: string; title?: string } | null>(null);

  // 링크 카드 클릭 confirm 오동작 방지용 전역 플래그(모바일)
  useEffect(() => {
    try {
      (window as any).__dsd_isDraggingItem = isDraggingItem;
    } catch {
      // ignore
    }
    return () => {
      try {
        (window as any).__dsd_isDraggingItem = false;
      } catch {
        // ignore
      }
    };
  }, [isDraggingItem]);

  // 월 화면 vs 스크랩 페이지 분기
  const isMonthly = currentLayout === 'monthly';

  // ✅ 링크 카드 클릭 → 앱 내부 모달 미리보기
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<EmbedPreviewOpenDetail>).detail;
      if (!detail?.url) return;
      if (detail.trigger && detail.trigger !== 'dblclick') return; // ✅ 더블클릭만 오픈
      if (isDraggingItem) return; // ✅ 드래그 중 오픈 방지
      setEmbedPreview({ url: detail.url, title: detail.title });
    };
    window.addEventListener(EMBED_PREVIEW_EVENT, handler);
    return () => window.removeEventListener(EMBED_PREVIEW_EVENT, handler);
  }, [isDraggingItem]);

  // 폰트 순환 변경 (4종만)
  const handleFontToggle = () => {
    if (!setDiaryStyle) return;
    const fonts: FontId[] = [...MOBILE_FONT_IDS];
    const currentFont = diaryStyle.fontId || DEFAULT_FONT_ID;
    const currentIndex = fonts.indexOf(currentFont);
    const nextIndex = (currentIndex + 1) % fonts.length;
    const nextFont = fonts[nextIndex];
    setDiaryStyle({ ...diaryStyle, fontId: nextFont });
  };

  // 팔레트/토큰 저장 핸들러
  const handleThemeSave = (data: {
    palette: UIPalette;
    uiTokens: UITokens;
    dashboardUseNotePaperOverride: boolean;
    dashboardNotePaperBackground?: string;
    notePaperBackgroundImage?: string;
    notePaperBackgroundFit?: 'contain' | 'cover' | 'zoom';
    notePaperBackgroundZoom?: number;
    centerShadowEnabled: boolean;
    centerShadowColor?: string;
    centerShadowOpacity: number;
    centerShadowWidth: number;
  }) => {
    if (!setDiaryStyle) return;
    setDiaryStyle({
      ...diaryStyle,
      uiPalette: data.palette,
      uiTokens: data.uiTokens,
      dashboardUseNotePaperOverride: data.dashboardUseNotePaperOverride,
      dashboardNotePaperBackground: data.dashboardNotePaperBackground,
      notePaperBackgroundImage: data.notePaperBackgroundImage,
      notePaperBackgroundFit: data.notePaperBackgroundFit,
      notePaperBackgroundZoom: data.notePaperBackgroundZoom,
      centerShadowEnabled: data.centerShadowEnabled,
      centerShadowColor: data.centerShadowColor,
      centerShadowOpacity: data.centerShadowOpacity,
      centerShadowWidth: data.centerShadowWidth,
    });
  };

  return (
    <div 
      data-font={diaryStyle.fontId || 'noto'}
      className="relative w-full overflow-hidden"
      style={{ 
        height: 'var(--app-h, 100vh)',
        backgroundColor: 'var(--app-background)'
      }}
    >
      {/* 📅 월간 레이아웃: 프로필/달력 탭 */}
      {isMonthly && (
        <MobileMonthView
          items={items}
          currentDate={currentDate}
          textData={textData}
          dashboardNotePaperOverride={
            diaryStyle.dashboardUseNotePaperOverride ? diaryStyle.dashboardNotePaperBackground : undefined
          }
          activeSide={activeSide}
          onSideChange={setActiveSide}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onUpdateText={onUpdateText}
          isDraggingItem={isDraggingItem}
          setIsDraggingItem={setIsDraggingItem}
          maxZ={maxZ}
          onBringToFront={onBringToFront}
          onDateClick={(date) => {
            // 날짜 클릭 → 일기 페이지로 전환
            setCurrentDate(date);
            setCurrentLayout('free');
          }}
        />
      )}

      {/* 🔎 링크/임베드 미리보기 모달 */}
      <EmbedPreviewModal
        isOpen={!!embedPreview}
        url={embedPreview?.url || ''}
        title={embedPreview?.title}
        onClose={() => setEmbedPreview(null)}
      />

      {/* 📝 스크랩 페이지 & 일기 페이지: 단일 캔버스 */}
      {(currentLayout === 'scrap_page' || currentLayout === 'free') && (
        <MobileScrapView
          items={items}
          diaryStyle={diaryStyle}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          isDraggingItem={isDraggingItem}
          setIsDraggingItem={setIsDraggingItem}
          maxZ={maxZ}
          onBringToFront={onBringToFront}
          currentLayout={currentLayout}
          currentDate={currentDate}
          onBackToMonth={() => setCurrentLayout('monthly')}
        />
      )}

      {/* 우측 상단 버튼들 */}
      {setDiaryStyle && (
        <div className="fixed top-4 right-4 z-[9998] flex gap-2">
          {/* 팔레트 편집 버튼 */}
          <button
            onClick={() => setShowPaletteEditor(true)}
            className="w-12 h-12 bg-white rounded-full shadow-lg border border-stone-200 flex items-center justify-center text-stone-600 active:scale-95 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* 폰트 토글 버튼 */}
          <button
            onClick={handleFontToggle}
            className="w-12 h-12 bg-white rounded-full shadow-lg border border-stone-200 flex items-center justify-center text-stone-600 active:scale-95 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
      )}

      {/* 🎨 모바일 FAB (추가 버튼) */}
      <MobileFAB
        onAddSticker={onAddSticker}
        onAddLink={onAddLink}
        onAddImage={onAddImage}
        onAddVideo={onAddVideo}
        currentLayout={currentLayout}
        onLayoutChange={setCurrentLayout}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
      />

      {/* 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full mx-auto" />
            <p className="mt-3 text-sm text-gray-600">처리 중...</p>
          </div>
        </div>
      )}

      {/* 팔레트 편집 모달 */}
      <PaletteEditorModal
        isOpen={showPaletteEditor}
        currentPalette={diaryStyle.uiPalette || DEFAULT_UI_PALETTE}
        currentUiTokens={diaryStyle.uiTokens || DEFAULT_UI_TOKENS}
        currentDashboardUseNotePaperOverride={!!diaryStyle.dashboardUseNotePaperOverride}
        currentDashboardNotePaperBackground={diaryStyle.dashboardNotePaperBackground}
        currentNotePaperBackgroundImage={diaryStyle.notePaperBackgroundImage}
        currentNotePaperBackgroundFit={diaryStyle.notePaperBackgroundFit}
        currentNotePaperBackgroundZoom={diaryStyle.notePaperBackgroundZoom}
        currentCenterShadowEnabled={diaryStyle.centerShadowEnabled}
        currentCenterShadowColor={diaryStyle.centerShadowColor}
        currentCenterShadowOpacity={diaryStyle.centerShadowOpacity}
        currentCenterShadowWidth={diaryStyle.centerShadowWidth}
        onClose={() => setShowPaletteEditor(false)}
        onSave={handleThemeSave}
      />
    </div>
  );
};

export default MobileApp;

