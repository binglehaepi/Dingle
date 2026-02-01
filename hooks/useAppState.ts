import { useState, useRef } from 'react';
import { ScrapItem, LayoutType, LayoutTextData, DiaryStyle, PageSide, LinkDockItem } from '../types';
import { DEFAULT_UI_PALETTE, DEFAULT_UI_TOKENS, STYLE_PREF_KEY, LAYOUT_PREF_KEY } from '../constants/appConstants';
import { migrateDiaryStyle } from '../utils/theme';
import { DEFAULT_FONT_ID } from '../constants/fonts';

/**
 * 앱 전역 State 관리 훅
 * 
 * App.tsx의 모든 useState를 한 곳에서 관리
 */
export function useAppState() {
  // 📦 Items & Layout
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [currentLayout, setCurrentLayout] = useState<LayoutType>(() => {
    try {
      if (typeof window === 'undefined') return 'monthly';
      
      // ✅ 프리뷰 모드에서는 항상 'monthly' (다른 다이어리의 레이아웃 영향 방지)
      const params = new URLSearchParams(window.location.search);
      const isPreview = params.get('preview') === 'true';
      if (isPreview) {
        return 'monthly';
      }
      
      const saved = localStorage.getItem(LAYOUT_PREF_KEY);
      if (!saved) return 'monthly';
      // ✅ 호환: JSON.stringify된 값(예: "\"monthly\"")과 plain string(예: "monthly") 모두 허용
      let parsed: unknown;
      try {
        parsed = JSON.parse(saved);
      } catch {
        parsed = saved;
      }
      if (typeof parsed === 'string') {
        const v = parsed as LayoutType;
        if (v === 'monthly' || v === 'weekly' || v === 'free' || v === 'scrap_page') return v;
      }
      return 'monthly';
    } catch {
      return 'monthly';
    }
  });
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [textData, setTextData] = useState<LayoutTextData>({});
  
  // 🎨 Style
  const [diaryStyle, setDiaryStyle] = useState<DiaryStyle>(() => {
    const fallback: DiaryStyle = {
      coverColor: '#ffffff',
      coverPattern: 'quilt',
      keyring: 'https://i.ibb.co/V0JFcWp8/0000-1.png',
      backgroundImage: '',
      fontId: DEFAULT_FONT_ID,
      uiPalette: DEFAULT_UI_PALETTE,
      uiTokens: DEFAULT_UI_TOKENS,
      dashboardUseNotePaperOverride: false,
      dashboardNotePaperBackground: undefined,
      compactMode: true, // ✅ 기본값: 1100px (컴팩트)
    };

    try {
      if (typeof window === 'undefined') return fallback;
      const saved = localStorage.getItem(STYLE_PREF_KEY);
      if (!saved) return fallback;
      return migrateDiaryStyle(JSON.parse(saved));
    } catch {
      return fallback;
    }
  });
  
  // 🔄 UI State
  const [loading, setLoading] = useState(false);
  const [maxZ, setMaxZ] = useState(10);
  const [toastMsg, setToastMsg] = useState('');
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(false);

  // 🔗 Link Dock State
  const [linkDockItems, setLinkDockItems] = useState<LinkDockItem[]>([]);
  
  // 📱 Mobile State
  const [activeSide, setActiveSide] = useState<PageSide>('left');
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  
  // 🎬 Modal State
  const [pendingYoutube, setPendingYoutube] = useState<{ url: string; metadata: any; targetDateKey?: string } | null>(null);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  
  // 📌 Refs
  const bookRef = useRef<HTMLDivElement>(null);
  // const backgroundInputRef = useRef<HTMLInputElement>(null); // Removed for MVP
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  return {
    // Items & Layout
    items,
    setItems,
    currentLayout,
    setCurrentLayout,
    currentDate,
    setCurrentDate,
    textData,
    setTextData,
    
    // Style
    diaryStyle,
    setDiaryStyle,
    
    // UI State
    loading,
    setLoading,
    maxZ,
    setMaxZ,
    toastMsg,
    setToastMsg,
    snapToGridEnabled,
    setSnapToGridEnabled,

    // Link Dock
    linkDockItems,
    setLinkDockItems,
    
    // Mobile
    activeSide,
    setActiveSide,
    isDraggingItem,
    setIsDraggingItem,
    
    // Modals
    pendingYoutube,
    setPendingYoutube,
    showCreationModal,
    setShowCreationModal,
    showBackupDialog,
    setShowBackupDialog,
    
    // Refs
    bookRef,
    // backgroundInputRef, // Removed for MVP
    autoSaveTimerRef,
  };
}

export type AppState = ReturnType<typeof useAppState>;

