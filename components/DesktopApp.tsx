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
import ExportPDFDialog from './ExportPDFDialog';
import PaletteEditorModal from './PaletteEditorModal';
// import LinkDecorationPanel from './LinkDecorationPanel'; // 제거됨
import EmbedPreviewModal from './EmbedPreviewModal';
import SettingsPanel from './panels/SettingsPanel';
import UIPanel from './panels/UIPanel';
import { EMBED_PREVIEW_EVENT, type EmbedPreviewOpenDetail } from '../utils/embedPreview';

interface DesktopAppProps {
  // State
  items: ScrapItem[];
  setItems: React.Dispatch<React.SetStateAction<ScrapItem[]>>;
  currentLayout: LayoutType;
  currentDate: Date;
  textData: LayoutTextData;
  setTextData: React.Dispatch<React.SetStateAction<LayoutTextData>>; // ✅ 백업/복원을 위해 추가
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
  
  // 텍스트 추가 모드
  const [isAddingText, setIsAddingText] = useState(false);
  // ✅ 슬라이드 패널 (설정/UI 탭)
  const [activePanel, setActivePanel] = useState<'settings' | 'ui' | null>(null);
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
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');
  
  // 팔레트 편집 모달
  const [showPaletteEditor, setShowPaletteEditor] = useState(false);

  const {
    items,
    setItems,
    currentLayout,
    currentDate,
    textData,
    setTextData,
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
    
    // PDF 내보내기 전 UI 상태 저장
    const previousPanel = activePanel;
    let sideTabs: Element | null = null;
    let originalTabDisplay: string | undefined;
    let notePagesWrapper: HTMLElement | null = null;
    let originalStyle: any = null;

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

      // 3. Export 모드 활성화
      console.log('📄 Activating export mode');
      document.body.setAttribute('data-export-mode', 'true');

      // 4. 설정 패널 숨김 (먼저 숨김)
      console.log('📋 Hiding settings panel for PDF export');
      setActivePanel(null);

      // 5. 월별 탭 숨김 (오른쪽 JAN, FEB, MAR... 탭들)
      sideTabs = document.querySelector('.absolute.top-8.-right-8');
      if (sideTabs) {
        originalTabDisplay = (sideTabs as HTMLElement).style.display;
        (sideTabs as HTMLElement).style.display = 'none';
        console.log('📋 Hidden side tabs for PDF export');
      }

      // 6. 툴바 숨김
      setHideToolbar(true);

      // 7. 노트 영역 찾기 및 위치 조정
      notePagesWrapper = document.querySelector('[data-pages-wrapper]') as HTMLElement;
      if (notePagesWrapper) {
        // 원래 스타일 저장
        originalStyle = {
          position: notePagesWrapper.style.position,
          top: notePagesWrapper.style.top,
          left: notePagesWrapper.style.left,
          width: notePagesWrapper.style.width,
          height: notePagesWrapper.style.height,
          transform: notePagesWrapper.style.transform,
          zIndex: notePagesWrapper.style.zIndex,
        };
        
        // 노트 영역을 화면 좌상단으로 이동 및 크기 고정
        notePagesWrapper.style.position = 'fixed';
        notePagesWrapper.style.top = '0';
        notePagesWrapper.style.left = '0';
        notePagesWrapper.style.width = '1100px';
        notePagesWrapper.style.height = '820px';
        notePagesWrapper.style.transform = 'none';
        notePagesWrapper.style.zIndex = '999999';
        console.log('📄 Note area positioned for export (1100x820)');
      }

      // 8. 렌더링 완료 대기 (UI 변경사항 완전 반영 위해 시간 증가)
      await new Promise(resolve => setTimeout(resolve, 800));

      // 9. 내보내기 실행
      console.log('📄 Exporting PDF...');
      let result;
      // PNG export removed - only PDF supported
      result = await window.electron.exportPDF();

      // 10. Export 모드 해제
      document.body.removeAttribute('data-export-mode');

      // 11. 노트 영역 복원
      if (notePagesWrapper && originalStyle) {
        Object.assign(notePagesWrapper.style, originalStyle);
        console.log('✅ Restored note area position');
      }

      // 12. 툴바 다시 표시
      setHideToolbar(false);

      // 13. 설정 패널 복원
      setActivePanel(previousPanel);

      // 14. 월별 탭 복원
      if (sideTabs) {
        (sideTabs as HTMLElement).style.display = originalTabDisplay || '';
        console.log('✅ Restored side tabs');
      }

      // 15. SNS 임베드 복원
      if (options.safeMode) {
        snsEmbedElements.forEach(el => {
          el.style.display = '';
        });
        console.log(`✅ Restored ${snsEmbedElements.length} SNS embed(s)`);
      }

      // 16. 워터마크 제거
      if (watermarkElement) {
        watermarkElement.remove();
      }

      // 17. 결과 표시
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
      
      // 에러 시에도 모든 UI 복원
      document.body.removeAttribute('data-export-mode');
      
      if (notePagesWrapper && originalStyle) {
        Object.assign(notePagesWrapper.style, originalStyle);
      }
      
      setHideToolbar(false);
      setActivePanel(previousPanel);
      
      if (sideTabs) {
        (sideTabs as HTMLElement).style.display = originalTabDisplay || '';
      }
      
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
      className="w-screen flex flex-col items-center justify-center relative font-handwriting select-none bg-cover bg-center transition-all duration-500"
      style={{ 
        minHeight: '100vh',
        height: 'auto',
        backgroundColor: 'var(--app-background)',
        backgroundImage: diaryStyle.backgroundImage ? `url(${diaryStyle.backgroundImage})` : undefined,
        touchAction: 'pan-x pan-y',
        overflow: 'auto',
        padding: '40px 20px',
      }}
    >
      
      {/* VIEWPORT CONTAINER */}
      <div 
        ref={viewportRef} 
        className="relative w-full overflow-visible"
        style={{ 
          height: 'var(--app-h)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        {/* Settings Panel - Fixed Position (다이어리 밖) */}
        {!isMobile && activePanel && (
          <div 
            className="border transition-transform duration-300 ease-in-out overflow-y-auto"
            style={{
              position: 'fixed',
              left: 0,
              top: '50%',
              transform: activePanel ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-100%)',
              width: '300px',
              height: '80vh',
              maxHeight: '800px',
              background: (() => {
                // 테마 배경색을 가져와서 투명도 적용
                const themeColor = diaryStyle.uiPalette?.monthTabBgActive || '#fef3c7';
                // hex를 rgba로 변환 (간단한 방법)
                return themeColor + 'F5'; // F5 = 약 96% 불투명도
              })(),
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, #764737))',
              color: 'var(--month-tab-text-color)',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px',
              boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
              zIndex: 9999,
            }}
            ref={(el) => {
              // Fixed panel ref
            }}
            onMouseEnter={() => {
              // 패널 영역에 마우스 진입 시 클릭 활성화
              if (window.electron?.send) {
                window.electron.send('set-ignore-mouse-events', false);
              }
            }}
          >
                {activePanel === 'settings' && (
                  <SettingsPanel
                    onClose={() => setActivePanel(null)}
                    onExportPDF={() => {
                      setShowPDFDialog(true);
                    }}
                    onOpenBackup={onOpenBackup}
                    onManualSave={handleSaveLayout}
                    compactMode={diaryStyle.compactMode}
                    onCompactModeChange={(compact) => {
                      setDiaryStyle(prev => ({ ...prev, compactMode: compact }));
                    }}
                    keyringFrame={diaryStyle.keyringFrame}
                    onKeyringFrameChange={(frame) => {
                      setDiaryStyle(prev => ({ ...prev, keyringFrame: frame }));
                      setToastMsg('키링 참 테두리 변경됨!');
                      setTimeout(() => setToastMsg(''), 1500);
                    }}
                    // ✅ 백업/복원을 위한 props 추가
                    items={items}
                    textData={textData}
                    setTextData={setTextData}
                    diaryStyle={diaryStyle}
                    linkDockItems={linkDockItems}
                    setItems={setItems}
                    setDiaryStyle={setDiaryStyle}
                    setLinkDockItems={setLinkDockItems}
                  />
                )}
            {activePanel === 'ui' && (
              <UIPanel
                onClose={() => setActivePanel(null)}
                onApplyTheme={(theme) => {
                  setDiaryStyle(prev => ({
                    ...prev,
                    uiPalette: theme.uiPalette,
                    uiTokens: theme.uiTokens,
                  }));
                  setToastMsg(`${theme.name} 테마 적용됨!`);
                  setTimeout(() => setToastMsg(''), 1500);
                }}
                onShowAdvanced={() => {
                  setShowPaletteEditor(true);
                  setActivePanel(null);
                }}
                stickers={diaryStyle.stickers || []}
                onStickerAdd={(sticker) => {
                  setDiaryStyle(prev => ({
                    ...prev,
                    stickers: [...(prev.stickers || []), sticker],
                  }));
                  setToastMsg('스티커 추가됨!');
                  setTimeout(() => setToastMsg(''), 1500);
                }}
                onStickerDelete={(stickerId) => {
                  setDiaryStyle(prev => ({
                    ...prev,
                    stickers: (prev.stickers || []).filter(s => s.id !== stickerId),
                  }));
                  setToastMsg('스티커 삭제됨!');
                  setTimeout(() => setToastMsg(''), 1500);
                }}
              />
            )}
          </div>
        )}

        {/* PLANNER CONTAINER */}
        <div 
          className="relative"
          style={{
            width: `${designWidth}px`,
            height: `${DESIGN_HEIGHT}px`,
            transform: activePanel 
              ? `scale(${scale}) translateX(150px)` 
              : `scale(${scale}) translateX(0)`,
            transformOrigin: 'center',
            overflow: 'visible',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={() => {
            // 다이어리 영역에 마우스 진입 시 클릭 활성화
            if (window.electron?.send) {
              window.electron.send('set-ignore-mouse-events', false);
            }
          }}
          onMouseLeave={() => {
            // 투명 영역으로 마우스 이동 시 클릭 관통
            if (window.electron?.send) {
              window.electron.send('set-ignore-mouse-events', true, { forward: true });
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            e.preventDefault();
            
            const stickerType = e.dataTransfer.getData('sticker-type');
            
            if (stickerType === 'default') {
              // 기본 스티커
              const url = e.dataTransfer.getData('sticker-url');
              const name = e.dataTransfer.getData('sticker-name');
              
              handleDecoration(ScrapType.STICKER, {
                title: name,
                url: '',
                stickerConfig: { imageUrl: url }
              });
            } else if (stickerType === 'uploaded') {
              // 업로드한 스티커
              const filePath = e.dataTransfer.getData('sticker-path');
              const name = e.dataTransfer.getData('sticker-name');
              const thumbnail = e.dataTransfer.getData('sticker-thumbnail');
              
              handleDecoration(ScrapType.STICKER, {
                title: name,
                url: '',
                stickerConfig: { imageUrl: thumbnail || filePath }
              });
            }
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
              ref={(el) => {
                if (bookRef) bookRef.current = el;
              }}
              className="flex-1 relative"
              style={{
                cursor: isAddingText ? 'text' : 'default',
                userSelect: 'none',
              }}
              onMouseDown={(e) => {
                // 공통 target 변수
                const target = e.target as HTMLElement;
                
                // 🎯 핸들 클릭인 경우 DesktopApp 핸들러 무시 (DraggableItem에서 처리)
                const handleType = target.closest('[data-handle-type]')?.getAttribute('data-handle-type');
                if (handleType === 'rotate' || handleType === 'resize') {
                  return;
                }
                
                // ✅ 스크랩 아이템이 아닌 곳 클릭 시 선택 해제
                const isScrapItem = !!target.closest('[data-scrap-item]');
                console.log('🖱️ 클릭 체크:', { isScrapItem, selectedItemId, target: target.className });
                
                if (!isScrapItem && selectedItemId) {
                  console.log('✅ 배경 클릭 - 선택 해제 실행');
                  setSelectedItemId(null);
                }
                
                // ✅ 텍스트 추가 모드일 때
                if (isAddingText) {
                  
                  // 드래그 가능한 아이템을 클릭한 경우 텍스트 추가 취소
                  if (target.closest('[data-draggable="true"]') || target.closest('button') || target.closest('input') || target.closest('textarea')) {
                    setIsAddingText(false);
                    setToastMsg('');
                    return;
                  }
                  
                  // 그 외의 모든 경우 (배경 포함) 텍스트 추가
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // 클릭 위치 계산 (스케일 고려)
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / scale;
                  const y = (e.clientY - rect.top) / scale;
                  
                  console.log('📝 텍스트 아이템 생성:', { x, y, scale });
                  
                  // 텍스트 아이템 생성
                  const newId = crypto.randomUUID();
                  const dateKey = currentLayout === 'scrap_page' 
                    ? 'SCRAP' 
                    : `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                  const pageSide = x >= (designWidth / 2) ? 'right' : 'left';
                  
                  const newItem: ScrapItem = {
                    id: newId,
                    type: 'NOTE' as any,
                    position: {
                      x,
                      y,
                      z: Date.now(),
                      rotation: 0,
                      scale: 1
                    },
                    metadata: {
                      title: "Text Note",
                      subtitle: "",
                      url: "",
                      noteConfig: {
                        text: "",
                        fontSize: '14px',
                        isEditing: true
                      }
                    },
                    diaryDate: dateKey,
                    pageSide,
                    createdAt: Date.now()
                  };
                  
                  console.log('✅ 텍스트 아이템 생성 완료:', newItem);
                  
                  setItems(prev => {
                    const updated = [...prev, newItem];
                    console.log('📦 아이템 목록 업데이트:', updated.length);
                    return updated;
                  });
                  setIsAddingText(false);
                  setToastMsg('');
                  return;
                }
                
                // ✅ 다이어리 배경은 드래그 불가능 (카드만 드래그 가능)
                // 배경만 클릭한 경우 - 아무것도 하지 않음
                if (e.target === e.currentTarget || target.closest('.flex-1.relative') === e.currentTarget) {
                  return;
                }
                
                // 카드, 버튼, 입력 필드 등은 각자 처리
                if (
                  target.closest('[data-scrap-item]') ||
                  target.closest('button') ||
                  target.closest('input') ||
                  target.closest('textarea') ||
                  target.closest('[data-draggable]') ||
                  target.closest('[data-month-tab]') ||
                  target.closest('[data-charm]')
                ) {
                  return;
                }
              }}
            >
              {/* LINK BAR */}
              {(currentLayout === 'free' || currentLayout === 'scrap_page') && (
                <UrlInput 
                  onScrap={handleScrap} 
                  onUpload={handleUpload} 
                  onCreateOpen={undefined}
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
                      onSelect={(id) => {
                        setSelectedItemId(id);
                      }}
                      onDelete={handleDeleteItem}
                      onSetMainItem={handleSetMainItem}
                      snapToGrid={currentLayout === 'scrap_page' || (currentLayout === 'free' && snapToGridEnabled)}
                      hideControls={false}
                      isSelected={selectedItemId === item.id}
                    >
                      <ItemRenderer item={item} onUpdateMetadata={updateMetadata} onDeleteItem={handleDeleteItem} onUpdateText={handleUpdateText} textData={textData} />
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
                        compactMode={diaryStyle.compactMode}
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
                    w-12 h-10 rounded-r-md flex items-center pl-4 justify-start text-[10px] font-bold tracking-widest border border-l-0 transition-transform active:scale-95 touch-manipulation
                    ${(currentLayout !== 'scrap_page' && currentDate.getMonth() === i) ? 'translate-x-0 font-black' : '-translate-x-1 hover:translate-x-0'}
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
                onClick={() => {
                  changeLayout('scrap_page');
                  setActivePanel(null); // 패널 닫기
                }}
                className={`
                  w-12 h-12 rounded-r-md flex items-center justify-center border border-l-0 transition-transform active:scale-95 mt-2 touch-manipulation
                  ${currentLayout === 'scrap_page' ? 'translate-x-0' : '-translate-x-1 hover:translate-x-0'}
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
              
              {/* Settings Tab */}
              <button 
                data-month-tab
                {...(activePanel === 'settings' ? { 'data-month-tab-active': 'true' } : {})}
                onClick={() => {
                  const newPanel = activePanel === 'settings' ? null : 'settings';
                  setActivePanel(newPanel);
                }}
                className={`
                  w-12 h-12 rounded-r-md flex items-center justify-center border border-l-0 transition-transform active:scale-95 mt-2 touch-manipulation
                  ${activePanel === 'settings' ? 'translate-x-0' : '-translate-x-1 hover:translate-x-0'}
                `}
                style={{
                  backgroundColor: activePanel === 'settings' ? 'var(--month-tab-bg-active)' : 'var(--month-tab-bg)',
                  borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, #764737))',
                  color: 'var(--month-tab-text-color)'
                }}
                title="설정"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* UI Tab */}
              <button 
                data-month-tab
                {...(activePanel === 'ui' ? { 'data-month-tab-active': 'true' } : {})}
                onClick={() => {
                  const newPanel = activePanel === 'ui' ? null : 'ui';
                  setActivePanel(newPanel);
                }}
                className={`
                  w-12 h-12 rounded-r-md flex items-center justify-center border border-l-0 transition-transform active:scale-95 mt-1 touch-manipulation
                  ${activePanel === 'ui' ? 'translate-x-0' : '-translate-x-1 hover:translate-x-0'}
                `}
                style={{
                  backgroundColor: activePanel === 'ui' ? 'var(--month-tab-bg-active)' : 'var(--month-tab-bg)',
                  borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, #764737))',
                  color: 'var(--month-tab-text-color)'
                }}
                title="꾸미기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.747 18.747 0 00-3.471 2.987 10.04 10.04 0 014.815 4.815 18.748 18.748 0 002.987-3.472l3.386-5.079A1.902 1.902 0 0020.599 1.5zm-8.3 14.025a18.76 18.76 0 001.896-1.207 8.026 8.026 0 00-4.513-4.513A18.75 18.75 0 008.475 11.7l-.278.5a5.26 5.26 0 013.601 3.602l.502-.278zM6.75 13.5A3.75 3.75 0 003 17.25a1.5 1.5 0 01-1.601 1.497.75.75 0 00-.7 1.123 5.25 5.25 0 009.8-2.62 3.75 3.75 0 00-3.75-3.75z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Keyring (Decorative) - Desktop only */}
          {!isMobile && (
            <div className="absolute top-10 -left-2 z-50">
              <Keyring 
                charm={diaryStyle.keyring}
                frameType={diaryStyle.keyringFrame}
                charmImage={diaryStyle.keyringImage}
                onCharmChange={(newCharm) => {
                  setDiaryStyle(prev => ({ ...prev, keyring: newCharm }));
                  setToastMsg('키링 변경됨!');
                  setTimeout(() => setToastMsg(''), 1500);
                }}
                onCharmImageChange={(newImage) => {
                  setDiaryStyle(prev => ({ ...prev, keyringImage: newImage }));
                  setToastMsg('키링 사진 변경됨!');
                  setTimeout(() => setToastMsg(''), 1500);
                }}
              />
            </div>
          )}

          {/* ⭐ 오른쪽 Diary Drag Handle (별 모양) - Desktop only */}
          {!isMobile && window.electron?.send && (
            <div 
              className="diary-drag-handle"
              style={{
                position: 'absolute',
                right: '-50px',
                bottom: '20px',
                width: '36px',
                height: '36px',
                cursor: 'grab',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 1000,
                userSelect: 'none',
                animation: 'star-glow 2.5s ease-in-out infinite',
              }}
              onMouseEnter={(e) => {
                // 드래그 핸들 영역에 마우스 진입 시 클릭 활성화
                if (window.electron?.send) {
                  window.electron.send('set-ignore-mouse-events', false);
                }
                const el = e.currentTarget;
                el.style.transform = 'scale(1.25) rotate(36deg)';
                el.style.animation = 'none';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                if (!el.classList.contains('dragging')) {
                  el.style.transform = 'scale(1) rotate(0deg)';
                  el.style.animation = 'star-glow 2.5s ease-in-out infinite';
                }
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'scale(1.25) rotate(36deg)';
                el.style.animation = 'none';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                if (!el.classList.contains('dragging')) {
                  el.style.transform = 'scale(1) rotate(0deg)';
                  el.style.animation = 'star-glow 2.5s ease-in-out infinite';
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const el = e.currentTarget;
                el.classList.add('dragging');
                el.style.cursor = 'grabbing';
                el.style.transform = 'scale(1.2) rotate(72deg)';
                el.style.animation = 'none';
                
                window.electron.send('window:dragStart', e.screenX, e.screenY);
                console.log('⭐ 오른쪽 별 핸들 드래그 시작');
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  window.electron.send?.('window:dragMove', moveEvent.screenX, moveEvent.screenY);
                };
                
                const handleMouseUp = () => {
                  window.electron.send?.('window:dragEnd');
                  console.log('⭐ 오른쪽 별 핸들 드래그 종료');
                  
                  el.classList.remove('dragging');
                  el.style.cursor = 'grab';
                  el.style.transform = 'scale(1) rotate(0deg)';
                  el.style.animation = 'star-glow 2.5s ease-in-out infinite';
                  
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              title="다이어리를 드래그하세요"
            >
              {/* 완벽한 5꽃잎 별 */}
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ pointerEvents: 'none' }}>
                <path 
                  className="star-path"
                  d="M 20,5 C 21,5 22,9 23,12 C 24,15 27,16 30,17 C 33,18 35,20 34,21 C 33,22 30,24 27,25 C 24,26 23,30 22,33 C 21,36 20,37 20,37 C 20,37 19,36 18,33 C 17,30 16,26 13,25 C 10,24 7,22 6,21 C 5,20 7,18 10,17 C 13,16 16,15 17,12 C 18,9 19,5 20,5 Z"
                  fill="none"
                  stroke="var(--month-tab-border-color, #D4C5B9)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{
                    transition: 'all 0.25s',
                    filter: 'drop-shadow(0 2px 4px rgba(212, 197, 185, 0.2))',
                  }}
                />
              </svg>
            </div>
          )}

          {/* ⭐ 왼쪽 Diary Drag Handle (별 모양) - Desktop only */}
          {!isMobile && window.electron?.send && (
            <div 
              className="diary-drag-handle diary-drag-handle-left"
              style={{
                position: 'absolute',
                left: '-50px',
                bottom: '20px',
                width: '36px',
                height: '36px',
                cursor: 'grab',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 1000,
                userSelect: 'none',
                animation: 'star-glow 2.5s ease-in-out infinite',
              }}
              onMouseEnter={(e) => {
                // 드래그 핸들 영역에 마우스 진입 시 클릭 활성화
                if (window.electron?.send) {
                  window.electron.send('set-ignore-mouse-events', false);
                }
                const el = e.currentTarget;
                el.style.transform = 'scale(1.25) rotate(36deg)';
                el.style.animation = 'none';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                if (!el.classList.contains('dragging')) {
                  el.style.transform = 'scale(1) rotate(0deg)';
                  el.style.animation = 'star-glow 2.5s ease-in-out infinite';
                }
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'scale(1.25) rotate(36deg)';
                el.style.animation = 'none';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                if (!el.classList.contains('dragging')) {
                  el.style.transform = 'scale(1) rotate(0deg)';
                  el.style.animation = 'star-glow 2.5s ease-in-out infinite';
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const el = e.currentTarget;
                el.classList.add('dragging');
                el.style.cursor = 'grabbing';
                el.style.transform = 'scale(1.2) rotate(72deg)';
                el.style.animation = 'none';
                
                window.electron.send('window:dragStart', e.screenX, e.screenY);
                console.log('⭐ 왼쪽 별 핸들 드래그 시작');
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  window.electron.send?.('window:dragMove', moveEvent.screenX, moveEvent.screenY);
                };
                
                const handleMouseUp = () => {
                  window.electron.send?.('window:dragEnd');
                  console.log('⭐ 왼쪽 별 핸들 드래그 종료');
                  
                  el.classList.remove('dragging');
                  el.style.cursor = 'grab';
                  el.style.transform = 'scale(1) rotate(0deg)';
                  el.style.animation = 'star-glow 2.5s ease-in-out infinite';
                  
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              title="다이어리를 드래그하세요"
            >
              {/* 완벽한 5꽃잎 별 */}
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ pointerEvents: 'none' }}>
                <path 
                  className="star-path"
                  d="M 20,5 C 21,5 22,9 23,12 C 24,15 27,16 30,17 C 33,18 35,20 34,21 C 33,22 30,24 27,25 C 24,26 23,30 22,33 C 21,36 20,37 20,37 C 20,37 19,36 18,33 C 17,30 16,26 13,25 C 10,24 7,22 6,21 C 5,20 7,18 10,17 C 13,16 16,15 17,12 C 18,9 19,5 20,5 Z"
                  fill="none"
                  stroke="var(--month-tab-border-color, #D4C5B9)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{
                    transition: 'all 0.25s',
                    filter: 'drop-shadow(0 2px 4px rgba(212, 197, 185, 0.2))',
                  }}
                />
              </svg>
            </div>
          )}

        </div>
      </div>

      {/* UI Overlays */}


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

      {/* 링크/임베드 꾸미기 패널 제거됨 */}

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
      
      {/* PDF Export Dialog */}
      {showPDFDialog && (
        <ExportPDFDialog
          onConfirm={async () => {
            setShowPDFDialog(false);
            if (window.electron) {
              const result = await window.electron.exportPDF();
              if (result.success) {
                alert(`PDF가 저장되었습니다!\n${result.filePath}`);
              } else if (!result.canceled) {
                alert(`PDF 저장 실패: ${result.error}`);
              }
            }
          }}
          onCancel={() => setShowPDFDialog(false)}
        />
      )}
      
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

