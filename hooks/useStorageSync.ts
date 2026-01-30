import { useEffect } from 'react';
import { ScrapItem, ScrapType, LayoutTextData, DiaryStyle, LinkDockItem } from '../types';
import { saveToStorage, loadFromStorage } from '../services/storage';
import { 
  STORAGE_KEY, 
  TEXT_DATA_KEY, 
  STYLE_PREF_KEY, 
  LAYOUT_PREF_KEY,
  LINK_DOCK_KEY
} from '../constants/appConstants';
import { AppState } from './useAppState';
import { migrateDiaryStyle } from '../utils/theme';
import { migrateScrapItemsDecoration } from '../utils/itemMigrations';

/**
 * 저장소 동기화 훅
 * 
 * - 앱 시작 시 데이터 로드
 * - 자동 저장 (디바운스)
 * - 수동 저장/삭제
 */

interface StorageSyncProps {
  state: AppState;
  formatDateKey: (date: Date) => string;
  formatMonthKey: (date: Date) => string;
}

export function useStorageSync({ state, formatDateKey, formatMonthKey }: StorageSyncProps) {
  const {
    items,
    setItems,
    currentLayout,
    currentDate,
    textData,
    setTextData,
    diaryStyle,
    setDiaryStyle,
    setMaxZ,
    setToastMsg,
    autoSaveTimerRef,
    linkDockItems,
    setLinkDockItems,
  } = state;

  // --- 1. 앱 시작 시 데이터 로드 ---
  useEffect(() => {
    // ✅ 프리뷰 모드에서는 localStorage 로드 스킵 (postMessage로만 데이터 받음)
    const params = new URLSearchParams(window.location.search);
    const isPreview = params.get('preview') === 'true';
    if (isPreview) {
      return;
    }
    
    // Load Items
    const parsedItems = loadFromStorage(STORAGE_KEY);
    if (parsedItems.length > 0) {
      // Ensure legacy items have valid dates and pageSide
      const migratedItems = migrateScrapItemsDecoration(parsedItems.map(item => ({
        ...item,
        diaryDate: item.diaryDate || formatDateKey(new Date(item.createdAt)),
        pageSide: item.pageSide || 'left'
      })));
      setItems(migratedItems);

      const highestZ = Math.max(...migratedItems.map(i => i.position.z || 1));
      setMaxZ(highestZ + 1);
    }

    // Load Text Data
    const savedTextData = localStorage.getItem(TEXT_DATA_KEY);
    if (savedTextData) {
      try {
        setTextData(JSON.parse(savedTextData));
      } catch (e) {
        console.error("Failed to load text data", e);
      }
    }

    // Style은 useAppState에서 localStorage 기반으로 초기화된다.
    // (여기서 다시 setDiaryStyle을 하면, 초기 UI 조작과 레이스가 날 수 있어 스킵)

    // Load Link Dock Items
    const savedDock = localStorage.getItem(LINK_DOCK_KEY);
    if (savedDock) {
      try {
        setLinkDockItems(JSON.parse(savedDock) as LinkDockItem[]);
      } catch (e) {
        console.error('Failed to load link dock items', e);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- 2. 자동 저장 타이머 정리 ---
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveTimerRef]);

  // --- 2.5 테마(Style) 변경 즉시 저장 (새로고침 유지) ---
  useEffect(() => {
    try {
      localStorage.setItem(STYLE_PREF_KEY, JSON.stringify(diaryStyle));
    } catch (e) {
      console.error('Failed to persist style pref', e);
    }
  }, [diaryStyle]);

  // --- 3. 수동 저장 ---
  const handleSaveLayout = () => {
    try {
      saveToStorage(STORAGE_KEY, items);
      localStorage.setItem(TEXT_DATA_KEY, JSON.stringify(textData));
      localStorage.setItem(STYLE_PREF_KEY, JSON.stringify(diaryStyle));
      localStorage.setItem(LINK_DOCK_KEY, JSON.stringify(linkDockItems));
      setToastMsg('Saved');
      setTimeout(() => setToastMsg(''), 2000);
    } catch (e: any) {
      console.error("Save failed", e);
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        setToastMsg('Storage Full!');
        alert("Storage Full! Images are taking up too much space. Please delete some items.");
      } else {
        setToastMsg('Error');
      }
    }
  };

  // --- 4. 자동 저장 (디바운스) ---
  const triggerAutoSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(TEXT_DATA_KEY, JSON.stringify(textData));
        localStorage.setItem(STYLE_PREF_KEY, JSON.stringify(diaryStyle));
        localStorage.setItem(LINK_DOCK_KEY, JSON.stringify(linkDockItems));
        saveToStorage(STORAGE_KEY, items);
        console.log('✅ 자동 저장 완료');
      } catch (err: any) {
        console.error('❌ 자동 저장 실패:', err);
        if (err.name === 'QuotaExceededError') {
          setToastMsg('저장 공간 부족!');
          setTimeout(() => setToastMsg(''), 2000);
        }
      }
    }, 1000); // 1초 디바운스
  };

  return {
    handleSaveLayout,
    triggerAutoSave,
  };
}




