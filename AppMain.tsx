/**
 * AppMain - 메인 다이어리 애플리케이션 컴포넌트
 * 
 * overlay 모드와 app 모드 모두에서 작동하는 핵심 컴포넌트
 * 모든 hooks를 통합하고 DesktopApp/MobileApp에 props 전달
 */

import React, { useMemo, useEffect, Suspense } from 'react';
import { getSpreadWidth, DESIGN_HEIGHT, GLOBAL_SCRAP_PAGE_KEY } from './constants/appConstants';

// Hooks
import { useAppState } from './hooks/useAppState';
import { useDeviceMode } from './hooks/useDeviceMode';
import { useFitScale } from './hooks/useFitScale';
import { useItemHandlers } from './hooks/useItemHandlers';
import { useLayoutHandlers } from './hooks/useLayoutHandlers';
import { useStorageSync } from './hooks/useStorageSync';
import { useFileSync } from './hooks/useFileSync';

// Components
const DesktopApp = React.lazy(() => import('./components/DesktopApp'));
const MobileApp = React.lazy(() => import('./components/mobile/MobileApp'));
import PersistentYouTubePlayer from './components/PersistentYouTubePlayer';

// Backup
import BackupDialog from './components/BackupDialog';

// Music
import { useMusicStore } from './music/MusicStore';

// Utils
import { applyDiaryStyleToDocument } from './utils/theme';

/**
 * 날짜 포맷 헬퍼
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

const AppMain: React.FC = () => {
  // ===== State Management =====
  const state = useAppState();
  const {
    items,
    setItems,
    currentLayout,
    currentDate,
    textData,
    setTextData,
    diaryStyle,
    setDiaryStyle,
    linkDockItems,
    setLinkDockItems,
    showBackupDialog,
    setShowBackupDialog,
    bookRef,
  } = state;

  // ===== Device & Viewport =====
  const deviceMode = useDeviceMode();
  const isMobile = deviceMode === 'mobile';
  const designWidth = isMobile ? DESIGN_HEIGHT : getSpreadWidth(diaryStyle.compactMode); // Mobile은 세로 모드
  const { ref: viewportRef, scale } = useFitScale(designWidth, DESIGN_HEIGHT);

  // ===== 날짜 기반 아이템 필터링 =====
  const currentDateKey = useMemo(() => {
    if (currentLayout === 'scrap_page') return GLOBAL_SCRAP_PAGE_KEY;
    if (currentLayout === 'monthly') return formatMonthKey(currentDate);
    return formatDateKey(currentDate);
  }, [currentDate, currentLayout]);

  const filteredItems = useMemo(() => {
    return items.filter(item => item.diaryDate === currentDateKey);
  }, [items, currentDateKey]);

  // 페이지별 아이템 (Desktop용)
  const leftPageItems = useMemo(() => {
    return filteredItems.filter(item => item.pageSide === 'left' || !item.pageSide);
  }, [filteredItems]);

  const rightPageItems = useMemo(() => {
    return filteredItems.filter(item => item.pageSide === 'right');
  }, [filteredItems]);

  // ===== Storage Sync =====
  // Electron 환경이면 FileSync, 아니면 StorageSync 사용
  const isElectron = typeof window !== 'undefined' && !!(window as any).electron;

  const storageSync = useStorageSync({
    state,
    formatDateKey,
    formatMonthKey,
  });

  const fileSync = useFileSync({
    items,
    setItems,
    textData,
    setTextData,
    linkDockItems,
    setLinkDockItems,
    diaryStyle,
    setDiaryStyle,
    setMaxZ: state.setMaxZ,
    setToastMsg: state.setToastMsg,
  });

  // ===== Handlers =====
  const itemHandlers = useItemHandlers({
    state,
    isMobile,
    pageOffset: 0, // Mobile에서 스크롤 오프셋 (현재는 0)
    formatDateKey,
    formatMonthKey,
  });

  const layoutHandlers = useLayoutHandlers({
    state,
    handleSaveLayout: isElectron ? fileSync.saveManually : storageSync.handleSaveLayout,
    formatDateKey,
    formatMonthKey,
  });

  // Link Dock에서 날짜별 링크 삽입
  const onInsertLinksToDate = async (dateKey: string, urls: string[]) => {
    const results = await Promise.all(
      urls.map(url => itemHandlers.handleScrapToDate(url, dateKey))
    );
    return results;
  };

  // ===== Theme 적용 =====
  useEffect(() => {
    applyDiaryStyleToDocument(diaryStyle);
  }, [diaryStyle]);

  // ===== Font 복원 (초기 로드 시) =====
  useEffect(() => {
    const savedFont = localStorage.getItem('dingle:font');
    if (savedFont) {
      document.documentElement.setAttribute('data-font', savedFont);
    }
  }, []);

  // ===== 백업 다이얼로그 핸들러 =====
  const handleOpenBackup = () => {
    setShowBackupDialog(true);
  };

  // ===== Render =====
  const commonProps = {
    // State
    items,
    setItems,
    currentLayout,
    currentDate,
    textData,
    setTextData, // ✅ 백업/복원을 위해 추가
    diaryStyle,
    setDiaryStyle,
    loading: state.loading,
    snapToGridEnabled: state.snapToGridEnabled,
    setSnapToGridEnabled: state.setSnapToGridEnabled,
    toastMsg: state.toastMsg,
    pendingYoutube: state.pendingYoutube,
    setPendingYoutube: state.setPendingYoutube,
    showCreationModal: state.showCreationModal,
    setShowCreationModal: state.setShowCreationModal,
    
    // Refs & Computed
    viewportRef,
    bookRef,
    // backgroundInputRef: state.backgroundInputRef, // Removed for MVP
    scale,
    designWidth,
    deviceMode,
    
    // Items
    leftPageItems,
    rightPageItems,
    
    // Handlers
    handleScrap: itemHandlers.handleScrap,
    handleUpload: itemHandlers.handleUpload,
    handleCreateManual: itemHandlers.handleCreateManual,
    handleAddText: itemHandlers.handleAddText,
    handleDateChange: layoutHandlers.handleDateChange,
    handleMonthSelect: layoutHandlers.handleMonthSelect,
    handleDateClick: layoutHandlers.handleDateClick,
    handleWeekSelect: layoutHandlers.handleWeekSelect,
    handleUpdateText: layoutHandlers.handleUpdateText,
    handleDecoration: itemHandlers.handleDecoration,
    // handleBackgroundUpload: itemHandlers.handleBackgroundUpload, // Removed for MVP
    handleSaveLayout: isElectron ? fileSync.saveManually : storageSync.handleSaveLayout,
    handleClearLayout: layoutHandlers.handleClearLayout,
    updatePosition: itemHandlers.updatePosition,
    updateMetadata: itemHandlers.updateMetadata,
    bringToFront: itemHandlers.bringToFront,
    handleDeleteItem: itemHandlers.handleDeleteItem,
    handleSetMainItem: itemHandlers.handleSetMainItem,
    confirmYoutube: itemHandlers.confirmYoutube,
    changeLayout: layoutHandlers.changeLayout,
    setToastMsg: state.setToastMsg,
    onOpenBackup: handleOpenBackup,
    setCurrentDate: state.setCurrentDate,
    
    // Link Dock
    linkDockItems,
    setLinkDockItems,
    onInsertLinksToDate,
  };

  const music = useMusicStore();

  return (
    <>
      {/* 전역 백그라운드 음악 플레이어 */}
      <PersistentYouTubePlayer />
      
      <Suspense fallback={
        <div style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9f7f4',
        }}>
          <div style={{ fontSize: '18px', color: '#9a8a7a' }}>Loading...</div>
        </div>
      }>
        {isMobile ? (
          <MobileApp {...commonProps} />
        ) : (
          <DesktopApp {...commonProps} />
        )}
      </Suspense>

      {/* 백업 다이얼로그 */}
      {showBackupDialog && (
        <BackupDialog
          items={items}
          setItems={setItems}
          textData={textData}
          setTextData={setTextData}
          diaryStyle={diaryStyle}
          setDiaryStyle={setDiaryStyle}
          linkDockItems={linkDockItems}
          setLinkDockItems={setLinkDockItems}
          setMaxZ={state.setMaxZ}
          setToastMsg={state.setToastMsg}
          onClose={() => setShowBackupDialog(false)}
        />
      )}

      {/* 음악 재생 오류 Toast */}
      {music.errorMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'rgba(239, 68, 68, 0.95)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 10000,
            maxWidth: '400px',
            fontSize: '14px',
            lineHeight: '1.5',
            whiteSpace: 'pre-line',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            🎵 음악 재생 오류
          </div>
          {music.errorMessage}
        </div>
      )}
    </>
  );
};

export default AppMain;
