import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrapItem, ScrapType, LayoutType, LayoutTextData, DiaryStyle, PageSide, FontId, UIPalette, UITokens, LinkDockItem } from '../types';
import { SPREAD_WIDTH, PAGE_WIDTH, DESIGN_HEIGHT, MONTHS, DEFAULT_UI_PALETTE, DEFAULT_UI_TOKENS } from '../constants/appConstants';

// Components
import UrlInput from './UrlInput';
import DecorationSelector from './DecorationSelector';
import Keyring from './Keyring';
import MobileToolbar from './MobileToolbar';
import BookSpreadView from './BookSpreadView';
import FreeLayout from './layouts/FreeLayout';
import MonthlySpread from './layouts/MonthlySpread';
import WeeklySpread from './layouts/WeeklySpread';
import DraggableItem from './DraggableItem';
import { ItemRenderer } from './ItemRenderer';
import YoutubeModal from './YoutubeModal';
import CreationModal from './CreationModal';
import ExportOptionsDialog, { ExportOptions } from './ExportOptionsDialog';
import PaletteEditorModal from './PaletteEditorModal';
import LinkDecorationPanel from './LinkDecorationPanel';
import EmbedPreviewModal from './EmbedPreviewModal';
import { EMBED_PREVIEW_EVENT, type EmbedPreviewOpenDetail } from '../utils/embedPreview';

interface DesktopAppProps {
  // State
  items: ScrapItem[];
  setItems: React.Dispatch<React.SetStateAction<ScrapItem[]>>;
  currentLayout: LayoutType;
  currentDate: Date;
  textData: LayoutTextData;
  diaryStyle: DiaryStyle;
  setDiaryStyle: React.Dispatch<React.SetStateAction<DiaryStyle>>;
  loading: boolean;
  snapToGridEnabled: boolean;
  setSnapToGridEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  toastMsg: string;
  pendingYoutube: any;
  setPendingYoutube: any;
  showCreationModal: boolean;
  setShowCreationModal: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Refs & Computed
  viewportRef: React.RefObject<HTMLDivElement>;
  bookRef: React.RefObject<HTMLDivElement>;
  // backgroundInputRef: React.RefObject<HTMLInputElement>; // Removed for MVP
  scale: number;
  designWidth: number;
  
  // Device
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  
  // Items
  leftPageItems: ScrapItem[];
  rightPageItems: ScrapItem[];
  
  // Handlers
  handleScrap: (url: string) => Promise<void>;
  handleUpload: (file: File) => Promise<void>;
  handleCreateManual: any;
  handleDateChange: (days: number) => void;
  handleMonthSelect: (monthIndex: number) => void;
  handleDateClick: (date: Date) => void;
  handleWeekSelect: (date: Date) => void;
  handleUpdateText: (key: string, field: string, value: string) => void;
  handleDecoration: any;
  // handleBackgroundUpload: any; // Removed for MVP
  handleSaveLayout: () => void;
  handleClearLayout: () => void;
  updatePosition: any;
  updateMetadata: any;
  bringToFront: any;
  handleDeleteItem: (id: string) => void;
  handleSetMainItem: (id: string) => void;
  confirmYoutube: any;
  changeLayout: (type: LayoutType) => void;
  setToastMsg: React.Dispatch<React.SetStateAction<string>>;
  onOpenBackup: () => void;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;

  // Link Dock
  linkDockItems: LinkDockItem[];
  setLinkDockItems: React.Dispatch<React.SetStateAction<LinkDockItem[]>>;
  onInsertLinksToDate: (dateKey: string, urls: string[]) => Promise<(string | null)[]>;
}

/**
 * 데스크톱/태블릿 UI 컴포넌트
 * 
 * App.tsx의 Desktop UI 부분을 분리
 */
const DesktopApp: React.FC<DesktopAppProps> = (props) => {
  // 툴바 숨김 상태 (캡처 시 사용)
  const [hideToolbar, setHideToolbar] = useState(false);
  // ✅ 고급 설정 패널 (MVP UI 개선)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  // ✅ 선택된 아이템 (링크/임베드 꾸미기 MVP)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [embedPreview, setEmbedPreview] = useState<{ url: string; title?: string } | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const DBG = !!import.meta.env.DEV && (typeof window !== 'undefined') && ((window as any).__DSD_DEBUG_DRAG ?? true);
  const pageSideDbgRef = useRef<{ lastRateTs: number; windowCalls: number }>({ lastRateTs: 0, windowCalls: 0 });

  // 링크 카드 클릭 confirm/더블클릭 모달 오동작 방지용 전역 플래그
  useEffect(() => {
    try {
      (window as any).__dsd_isInteracting = isInteracting;
    } catch {
      // ignore
    }
    return () => {
      try {
        (window as any).__dsd_isInteracting = false;
      } catch {
        // ignore
      }
    };
  }, [isInteracting]);
  
  // 내보내기 옵션 다이얼로그
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');
  
  // 팔레트 편집 모달
  const [showPaletteEditor, setShowPaletteEditor] = useState(false);

  const {
    items,
    setItems,
    currentLayout,
    currentDate,
    textData,
    diaryStyle,
    setDiaryStyle,
    loading,
    snapToGridEnabled,
    setSnapToGridEnabled,
    toastMsg,
    pendingYoutube,
    setPendingYoutube,
    showCreationModal,
    setShowCreationModal,
    viewportRef,
    bookRef,
    // backgroundInputRef, // Removed for MVP
    scale,
    designWidth,
    deviceMode,
    leftPageItems,
    rightPageItems,
    handleScrap,
    handleUpload,
    handleCreateManual,
    handleDateChange,
    handleMonthSelect,
    handleDateClick,
    handleWeekSelect,
    handleUpdateText,
    handleDecoration,
    // handleBackgroundUpload, // Removed for MVP
    handleSaveLayout,
    handleClearLayout,
    updatePosition,
    updateMetadata,
    bringToFront,
    handleDeleteItem,
    handleSetMainItem,
    confirmYoutube,
    changeLayout,
    setToastMsg,
    onOpenBackup,
    setCurrentDate,
    linkDockItems,
    setLinkDockItems,
    onInsertLinksToDate,
  } = props;

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return items.find((i) => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  const isLinkEmbedLikeSelected = useMemo(() => {
    const it = selectedItem;
    if (!it) return false;
    if (it.metadata?.platform) return true;
    return (
      it.type === ScrapType.TWITTER ||
      it.type === ScrapType.INSTAGRAM ||
      it.type === ScrapType.PINTEREST ||
      it.type === ScrapType.YOUTUBE ||
      it.type === ScrapType.SPOTIFY ||
      it.type === ScrapType.TIKTOK ||
      it.type === ScrapType.VIMEO
    );
  }, [selectedItem]);

  // ✅ 링크 카드 클릭 → 앱 내부 모달 미리보기
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<EmbedPreviewOpenDetail>).detail;
      if (!detail?.url) return;
      if (detail.trigger && detail.trigger !== 'dblclick') return; // ✅ 더블클릭만 오픈
      if (isInteracting) return; // ✅ 드래그/리사이즈/회전 중 오픈 방지
      setEmbedPreview({ url: detail.url, title: detail.title });
    };
    window.addEventListener(EMBED_PREVIEW_EVENT, handler);
    return () => window.removeEventListener(EMBED_PREVIEW_EVENT, handler);
  }, [isInteracting]);

  const isMobileOrTablet = deviceMode === 'mobile' || deviceMode === 'tablet';
  const isMobile = deviceMode === 'mobile';

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
    setDiaryStyle(prev => ({
      ...prev,
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
    }));
    setToastMsg('테마 적용됨!');
    setTimeout(() => setToastMsg(''), 1500);
  };


  // 옵션과 함께 내보내기
  const handleExportWithOptions = async (options: ExportOptions) => {
    let snsEmbedElements: HTMLElement[] = [];
    let watermarkElement: HTMLDivElement | null = null;

    try {
      // 1. 안전 모드: SNS 임베드 숨김
      if (options.safeMode) {
        console.log('🔒 Safe mode enabled: Hiding SNS embeds');
        
        // SNS 임베드 요소 찾기
        snsEmbedElements = Array.from(
          document.querySelectorAll('[data-sns-embed]')
        ) as HTMLElement[];
        
        // 임베드 숨기고 placeholder 표시
        snsEmbedElements.forEach(el => {
          el.style.display = 'none';
        });
        
        console.log(`🔒 Hidden ${snsEmbedElements.length} SNS embed(s)`);
      }

      // 2. 워터마크 추가
      if (options.watermark && options.watermarkText) {
        console.log('💧 Watermark:', options.watermarkText, 'at', options.watermarkPosition);
        
        // 워터마크 div 생성
        watermarkElement = document.createElement('div');
        watermarkElement.textContent = options.watermarkText;
        watermarkElement.style.position = 'fixed';
        watermarkElement.style.zIndex = '9999';
        watermarkElement.style.padding = '8px 16px';
        watermarkElement.style.background = 'rgba(0, 0, 0, 0.5)';
        watermarkElement.style.color = 'white';
        watermarkElement.style.fontSize = '14px';
        watermarkElement.style.fontWeight = 'bold';
        watermarkElement.style.borderRadius = '4px';
        watermarkElement.style.pointerEvents = 'none';
        
        // 위치 설정
        switch (options.watermarkPosition) {
          case 'top-left':
            watermarkElement.style.top = '20px';
            watermarkElement.style.left = '20px';
            break;
          case 'top-right':
            watermarkElement.style.top = '20px';
            watermarkElement.style.right = '20px';
            break;
          case 'bottom-left':
            watermarkElement.style.bottom = '20px';
            watermarkElement.style.left = '20px';
            break;
          case 'bottom-right':
            watermarkElement.style.bottom = '20px';
            watermarkElement.style.right = '20px';
            break;
          case 'center':
            watermarkElement.style.top = '50%';
            watermarkElement.style.left = '50%';
            watermarkElement.style.transform = 'translate(-50%, -50%)';
            break;
        }
        
        document.body.appendChild(watermarkElement);
      }

      // 3. 툴바 숨김
      setHideToolbar(true);

      // 4. 렌더링 완료 대기
      await new Promise(resolve => setTimeout(resolve, 300));

      // 5. 내보내기 실행
      let result;
      // PNG export removed - only PDF supported
      result = await window.electron.exportPDF();

      // 6. 툴바 다시 표시
      setHideToolbar(false);

      // 7. SNS 임베드 복원
      if (options.safeMode) {
        snsEmbedElements.forEach(el => {
          el.style.display = '';
        });
        console.log(`✅ Restored ${snsEmbedElements.length} SNS embed(s)`);
      }

      // 8. 워터마크 제거
      if (watermarkElement) {
        watermarkElement.remove();
      }

      // 9. 결과 표시
      if (result.success && result.filePath) {
        const formatName = options.format.toUpperCase();
        const safeMode = options.safeMode ? ' (안전 모드)' : '';
        setToastMsg(`✅ ${formatName} exported!${safeMode}`);
        setTimeout(() => setToastMsg(''), 2000);
      } else if (!result.canceled) {
        setToastMsg('❌ Export failed');
        setTimeout(() => setToastMsg(''), 2000);
      }
    } catch (error) {
      console.error(error);
      setHideToolbar(false);
      
      // 에러 시에도 복원
      if (options.safeMode) {
        snsEmbedElements.forEach(el => {
          el.style.display = '';
        });
      }
      if (watermarkElement) {
        watermarkElement.remove();
      }
      
      setToastMsg('❌ Error');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  return (
    <div 
      data-font={diaryStyle.fontId || 'noto'}
      className="w-screen flex flex-col items-center justify-center relative font-handwriting select-none bg-cover bg-center transition-all duration-500"
      style={{ 
        height: 'var(--app-h)',
        backgroundColor: 'var(--app-background)',
        backgroundImage: diaryStyle.backgroundImage ? `url(${diaryStyle.backgroundImage})` : undefined,
        touchAction: 'pan-x pan-y'
      }}
    >
      
      {/* VIEWPORT CONTAINER */}
      <div 
        ref={viewportRef} 
        className="relative w-full overflow-hidden"
        style={{ 
          height: 'var(--app-h)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* PLANNER CONTAINER */}
        <div 
          className="relative"
          style={{
            width: `${designWidth}px`,
            height: `${DESIGN_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center',
          }}
        >
          
          {/* Main Book Body */}
          <div
            data-note-shell
            className="absolute inset-0 bg-transparent rounded-lg flex z-10 overflow-hidden"
            style={{ border: '1px solid var(--note-outer-border-color, var(--ui-stroke-color, #764737))' }}
          >
            
            {/* Paper Texture & Layout Render */}
            <div 
              ref={bookRef}
              className="flex-1 relative"
            >
              {/* LINK BAR */}
              {(currentLayout === 'free' || currentLayout === 'scrap_page') && (
                <UrlInput 
                  onScrap={handleScrap} 
                  onUpload={handleUpload} 
                  onCreateOpen={() => setShowCreationModal(true)} 
                  isLoading={loading}
                  className="absolute top-5 right-8" 
                />
              )}

              {/* PagesWrapper (2페이지 전용) */}
              {(currentLayout === 'free' || currentLayout === 'monthly' || currentLayout === 'scrap_page') && !isMobile && (
                <BookSpreadView
                  leftPageItems={leftPageItems}
                  rightPageItems={rightPageItems}
                  wrapperClassName="note-paper-surface bg-custom-paper grid grid-cols-2"
                  renderItem={(item) => (
                    <DraggableItem 
                      item={item}
                      interactionScale={scale}
                      onDragStart={() => setIsInteracting(true)}
                      onDragEnd={() => setIsInteracting(false)}
                      onUpdatePosition={(id, pos) => {
                        updatePosition(id, pos);
                        
                        // PC/태블릿: x 좌표 기준 pageSide 자동 갱신
                        if (pos.x !== undefined) {
                          if (DBG) {
                            const now = performance.now();
                            const r = pageSideDbgRef.current;
                            if (!r.lastRateTs) r.lastRateTs = now;
                            r.windowCalls += 1;
                            const dt = now - r.lastRateTs;
                            if (dt >= 1000) {
                              const cps = Math.round((r.windowCalls * 1000) / dt);
                              const dragActive = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
                              console.debug('[setItems] pageSideUpdate RATE', {
                                callsPerSec: cps,
                                windowCalls: r.windowCalls,
                                dtMs: Math.round(dt),
                                dragActive,
                              });
                              r.lastRateTs = now;
                              r.windowCalls = 0;
                            }
                          }
                          const newPageSide: 'left' | 'right' = pos.x >= PAGE_WIDTH ? 'right' : 'left';
                          setItems(prev => prev.map(i => 
                            i.id === id ? { ...i, pageSide: newPageSide } : i
                          ));
                        }
                      }}
                      onBringToFront={bringToFront}
                      onSelect={(id) => setSelectedItemId(id)}
                      onDelete={handleDeleteItem}
                      onSetMainItem={handleSetMainItem}
                      snapToGrid={currentLayout === 'scrap_page' || (currentLayout === 'free' && snapToGridEnabled)}
                    >
                      <ItemRenderer item={item} onUpdateMetadata={updateMetadata} />
                    </DraggableItem>
                  )}
                >
                  {currentLayout === 'free' && (
                    <FreeLayout 
                      currentDate={currentDate} 
                      onPrevDay={() => handleDateChange(-1)} 
                      onNextDay={() => handleDateChange(1)}
                      snapToGrid={snapToGridEnabled}
                      onToggleGrid={() => {
                        setSnapToGridEnabled(prev => !prev);
                        setToastMsg(snapToGridEnabled ? '그리드 OFF' : '그리드 ON');
                        setTimeout(() => setToastMsg(''), 1000);
                      }}
                    />
                  )}
                  {currentLayout === 'scrap_page' && (
                    <FreeLayout 
                      currentDate={currentDate} 
                      isStaticPage={true}
                      snapToGrid={true}
                    />
                  )}
                  {currentLayout === 'monthly' && (
                    <div
                      className="contents"
                      data-dashboard-scope="monthly"
                      style={
                        diaryStyle.dashboardUseNotePaperOverride && diaryStyle.dashboardNotePaperBackground
                          ? ({ ['--note-paper-background']: diaryStyle.dashboardNotePaperBackground } as React.CSSProperties)
                          : undefined
                      }
                    >
                      <MonthlySpread 
                        currentDate={currentDate} 
                        items={items} 
                        textData={textData}
                        onDateClick={handleDateClick}
                        onWeekSelect={handleWeekSelect}
                        onUpdateText={handleUpdateText}
                        onYearChange={(year) => {
                          const newDate = new Date(currentDate);
                          newDate.setFullYear(year);
                          setCurrentDate(newDate);
                          setToastMsg(`${year}년`);
                          setTimeout(() => setToastMsg(''), 1000);
                        }}
                        linkDockItems={linkDockItems}
                        setLinkDockItems={setLinkDockItems}
                        onInsertLinksToDate={onInsertLinksToDate}
                      />
                    </div>
                  )}
                </BookSpreadView>
              )}

              {/* Weekly는 1페이지 UI */}
              {currentLayout === 'weekly' && (
                <WeeklySpread 
                  currentDate={currentDate} 
                  items={items} 
                  textData={textData}
                  onUpdateText={handleUpdateText}
                />
              )}
            </div>
          </div>

          {/* Side Tabs (Indices) - Desktop only */}
          {!isMobile && (
            <div className="absolute top-8 -right-8 flex flex-col gap-1 z-0">
              {MONTHS.map((m, i) => (
                <button 
                  key={m}
                  data-month-tab
                  {...((currentLayout !== 'scrap_page' && currentDate.getMonth() === i) ? { 'data-month-tab-active': 'true' } : {})}
                  onClick={() => handleMonthSelect(i)}
                  className={`
                    w-12 h-10 rounded-r-md flex items-center pl-2 text-[10px] font-bold tracking-widest border border-l-0 transition-transform hover:translate-x-1 active:scale-95 touch-manipulation
                    ${(currentLayout !== 'scrap_page' && currentDate.getMonth() === i) ? 'translate-x-1 font-black' : ''}
                  `}
                  style={{
                    backgroundColor: (currentLayout !== 'scrap_page' && currentDate.getMonth() === i) ? 'var(--month-tab-bg-active)' : 'var(--month-tab-bg)',
                    borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, #764737))',
                    color: 'var(--month-tab-text-color)'
                  }}
                >
                  {m}
                </button>
              ))}
              
              {/* Star Scrap Page Tab */}
              <button 
                data-month-tab
                {...(currentLayout === 'scrap_page' ? { 'data-month-tab-active': 'true' } : {})}
                onClick={() => changeLayout('scrap_page')}
                className={`
                  w-12 h-12 rounded-r-md flex items-center justify-center border border-l-0 transition-transform hover:translate-x-1 active:scale-95 mt-2 touch-manipulation
                  ${currentLayout === 'scrap_page' ? 'translate-x-1' : ''}
                `}
                style={{
                  backgroundColor: currentLayout === 'scrap_page' ? 'var(--month-tab-bg-active)' : 'var(--month-tab-bg)',
                  borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, #764737))',
                  color: 'var(--month-tab-text-color)'
                }}
                title="My Scrap Page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Keyring (Decorative) - Desktop only */}
          {!isMobile && (
            <div className="absolute top-10 -left-2 z-50">
              <Keyring 
                charm={diaryStyle.keyring} 
                onCharmChange={(newCharm) => {
                  setDiaryStyle(prev => ({ ...prev, keyring: newCharm }));
                  setToastMsg('키링 변경됨!');
                  setTimeout(() => setToastMsg(''), 1500);
                }}
              />
            </div>
          )}

        </div>
      </div>

      {/* UI Overlays */}

      {/* Desktop: 우측 툴바 (간소화) */}
      {deviceMode === 'desktop' && !hideToolbar && (
        <div className="fixed top-8 right-8 z-[100] flex flex-col gap-3">
          {/* 설정 버튼 (주요 버튼) */}
          <button 
            onClick={() => setShowPaletteEditor(true)}
            className="w-12 h-12 bg-white rounded-full shadow-md border border-stone-200 flex items-center justify-center text-stone-600 hover:text-pink-500 hover:scale-105 active:scale-95 transition-all touch-manipulation relative"
            title="색상 팔레트 편집 (1:1 매핑)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
            </svg>
          </button>

          {/* 고급 설정 버튼 (토글) */}
          <button 
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className={`w-12 h-12 bg-white rounded-full shadow-md border border-stone-200 flex items-center justify-center text-stone-600 hover:text-purple-500 hover:scale-105 active:scale-95 transition-all touch-manipulation ${showSettingsPanel ? 'ring-2 ring-purple-500' : ''}`}
            title="고급 설정"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>

          {/* 고급 설정 패널 (조건부 렌더링) */}
          {showSettingsPanel && (
            <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4 flex flex-col gap-2 min-w-[200px]">
              <div className="text-xs font-bold text-stone-500 mb-2 pb-2 border-b border-stone-200">고급 설정</div>
              
              {/* 데코레이션 */}
              <div className="mb-2">
                <div className="text-xs text-stone-500 mb-1">데코레이션</div>
                <DecorationSelector onSelect={handleDecoration} />
              </div>

              {/* 내보내기 & 백업 */}
              <div className="text-xs text-stone-500 mb-1 pt-2 border-t border-stone-200">내보내기 & 백업</div>
              
              {window.electron && (
                <button 
                  onClick={() => {
                    setExportFormat('pdf');
                    setShowExportOptions(true);
                  }}
                  className="w-full px-3 py-2 bg-stone-50 hover:bg-red-50 rounded-lg text-left text-sm text-stone-700 hover:text-red-600 transition-colors flex items-center gap-2"
                  title="Export as PDF"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  PDF 내보내기
                </button>
              )}

              <button 
                onClick={onOpenBackup}
                className="w-full px-3 py-2 bg-stone-50 hover:bg-green-50 rounded-lg text-left text-sm text-stone-700 hover:text-green-600 transition-colors flex items-center gap-2"
                title="Backup & Restore"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                  <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                백업 & 복원
              </button>

              {/* 위험한 작업 */}
              <div className="text-xs text-stone-500 mb-1 pt-2 border-t border-stone-200">위험한 작업</div>
              
              <button 
                onClick={handleClearLayout}
                className="w-full px-3 py-2 bg-stone-50 hover:bg-red-50 rounded-lg text-left text-sm text-stone-700 hover:text-red-600 transition-colors flex items-center gap-2"
                title="Clear Page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                페이지 비우기
              </button>
            </div>
          )}

        </div>
      )}

      {/* Mobile/Tablet: FAB 버튼 */}
      {isMobileOrTablet && (
        <MobileToolbar 
          onSave={handleSaveLayout}
          onClear={handleClearLayout}
          onBackgroundUpload={() => {}} // Disabled for MVP
          onDecoration={handleDecoration}
          onMonthSelect={handleMonthSelect}
          onScrapPageOpen={() => changeLayout('scrap_page')}
          backgroundInputRef={undefined} // Disabled for MVP
          currentMonth={currentDate.getMonth()}
          isScrapPage={currentLayout === 'scrap_page'}
          activeSide={'left' as PageSide}
        />
      )}

      {/* Modals */}
      {pendingYoutube && <YoutubeModal onConfirm={confirmYoutube} onCancel={() => setPendingYoutube(null)} />}
      {showCreationModal && <CreationModal onConfirm={handleCreateManual} onCancel={() => setShowCreationModal(false)} />}

      {/* 🎀 링크/임베드 꾸미기 패널 (선택된 아이템 기준) */}
      {selectedItem && isLinkEmbedLikeSelected && (
        <LinkDecorationPanel
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onChangeDecoration={(next) => updateMetadata(selectedItem.id, { decoration: next })}
        />
      )}

      {/* 🔎 링크/임베드 미리보기 모달 */}
      <EmbedPreviewModal
        isOpen={!!embedPreview}
        url={embedPreview?.url || ''}
        title={embedPreview?.title}
        onClose={() => setEmbedPreview(null)}
      />
      
      {/* Export Options Dialog */}
      <ExportOptionsDialog
        isOpen={showExportOptions}
        onClose={() => setShowExportOptions(false)}
        onExport={handleExportWithOptions}
      />
      
      {/* Palette Editor Modal */}
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
      
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl animate-bounce">
          {toastMsg}
        </div>
      )}

    </div>
  );
};

export default DesktopApp;

