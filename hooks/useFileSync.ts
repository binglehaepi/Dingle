/**
 * 파일 동기화 훅
 * 
 * Electron 파일 시스템과 앱 상태를 동기화
 * - 자동 저장 (5초 디바운스)
 * - 초기 로드
 * - localStorage 마이그레이션
 */

import { useEffect, useRef, useCallback } from 'react';
import type * as React from 'react';
import { ScrapItem, LayoutTextData, DiaryStyle, LinkDockItem } from '../types';
import { 
  saveDiaryToFile, 
  loadDiaryFromFile, 
  migrateFromLocalStorage,
  getFileInfo 
} from '../services/fileStorage';
import { STORAGE_KEY, TEXT_DATA_KEY, STYLE_PREF_KEY, LINK_DOCK_KEY } from '../constants/appConstants';
import { migrateDiaryStyle } from '../utils/theme';
import { migrateScrapItemsDecoration } from '../utils/itemMigrations';

interface UseFileSyncProps {
  items: ScrapItem[];
  setItems: React.Dispatch<React.SetStateAction<ScrapItem[]>>;
  textData: LayoutTextData;
  setTextData: React.Dispatch<React.SetStateAction<LayoutTextData>>;
  linkDockItems: LinkDockItem[];
  setLinkDockItems: React.Dispatch<React.SetStateAction<LinkDockItem[]>>;
  diaryStyle: DiaryStyle;
  setDiaryStyle: React.Dispatch<React.SetStateAction<DiaryStyle>>;
  setMaxZ: React.Dispatch<React.SetStateAction<number>>;
  setToastMsg: React.Dispatch<React.SetStateAction<string>>;
}

export function useFileSync({
  items,
  setItems,
  textData,
  setTextData,
  linkDockItems,
  setLinkDockItems,
  diaryStyle,
  setDiaryStyle,
  setMaxZ,
  setToastMsg,
}: UseFileSyncProps) {
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadedRef = useRef(false);
  const lastSavedRef = useRef<string>('');
  const dbgRef = useRef<{ lastRateTs: number; windowRuns: number }>({ lastRateTs: 0, windowRuns: 0 });
  const DBG = !!import.meta.env.DEV && (typeof window !== 'undefined') && ((window as any).__DSD_DEBUG_DRAG ?? true);

  // ═══════════════════════════════════════════════════════
  // 🔄 초기 로드
  // ═══════════════════════════════════════════════════════

  useEffect(() => {
    if (isLoadedRef.current) return;
    isLoadedRef.current = true;

    const loadData = async () => {
      // Electron 환경인지 확인
      if (!window.electron) {
        console.log('ℹ️ Not in Electron, skipping file load');
        return;
      }

      try {
        console.log('📂 Loading diary from file...');

        // 파일에서 로드
        const data = await loadDiaryFromFile();

        if (data) {
          // maxZ 업데이트 및 z값 보정
          const loadedItems = migrateScrapItemsDecoration(data.items).map((item, index) => ({
            ...item,
            position: {
              x: item.position?.x ?? 100,
              y: item.position?.y ?? 100,
              z: item.position?.z ?? (index + 1), // z값이 없으면 순서대로 할당
              rotation: item.position?.rotation ?? 0,
              scale: item.position?.scale ?? 1
            }
          }));
          
          // 파일 데이터 사용
          setItems(loadedItems);
          setTextData(data.textData);
          setLinkDockItems(data.linkDockItems || []);
          
          setDiaryStyle(migrateDiaryStyle(data.stylePref));

          if (loadedItems.length > 0) {
            const highestZ = Math.max(...loadedItems.map(i => i.position.z));
            setMaxZ(highestZ + 1);
          }

          setToastMsg('✅ Loaded from file');
          setTimeout(() => setToastMsg(''), 2000);

          console.log('✅ Loaded from file:', data.items.length, 'items');
        } else {
          // 파일이 없으면 localStorage에서 마이그레이션 시도
          console.log('🔄 No file found, checking localStorage...');

          const migrationResult = await migrateFromLocalStorage(
            STORAGE_KEY,
            TEXT_DATA_KEY,
            STYLE_PREF_KEY
          );

          if (migrationResult.success) {
            console.log('✅ Migrated from localStorage');
            setToastMsg('✅ Migrated to file storage');
            setTimeout(() => setToastMsg(''), 2000);

            // 마이그레이션 후 다시 로드
            const migratedData = await loadDiaryFromFile();
            if (migratedData) {
              setItems(migratedData.items);
              setTextData(migratedData.textData);
              setLinkDockItems(migratedData.linkDockItems || []);
              
              setDiaryStyle(migrateDiaryStyle(migratedData.stylePref));

              // z값 보정
              const fixedItems = migratedData.items.map((item, index) => ({
                ...item,
                position: {
                  x: item.position?.x ?? 100,
                  y: item.position?.y ?? 100,
                  z: item.position?.z ?? (index + 1),
                  rotation: item.position?.rotation ?? 0,
                  scale: item.position?.scale ?? 1
                }
              }));
              setItems(fixedItems);
              
              if (fixedItems.length > 0) {
                const highestZ = Math.max(...fixedItems.map(i => i.position.z));
                setMaxZ(highestZ + 1);
              }
            }
          } else {
            console.log('ℹ️ No data to migrate, starting fresh');
          }
        }
      } catch (error) {
        console.error('❌ Load error:', error);
        setToastMsg('❌ Load failed');
        setTimeout(() => setToastMsg(''), 2000);
      }
    };

    loadData();
  }, [setItems, setTextData, setLinkDockItems, setDiaryStyle, setMaxZ, setToastMsg]);

  // ═══════════════════════════════════════════════════════
  // 💾 자동 저장
  // ═══════════════════════════════════════════════════════

  useEffect(() => {
    // Electron 환경이 아니면 스킵
    if (!window.electron) {
      return;
    }

    // 데이터가 변경되지 않았으면 스킵
    const t0 = performance.now();
    const currentData = JSON.stringify({ items, textData, linkDockItems, diaryStyle });
    const stringifyMs = performance.now() - t0;
    if (DBG) {
      const now = performance.now();
      const r = dbgRef.current;
      if (!r.lastRateTs) r.lastRateTs = now;
      r.windowRuns += 1;
      const dt = now - r.lastRateTs;
      if (dt >= 1000) {
        const rps = Math.round((r.windowRuns * 1000) / dt);
        const dragActive = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
        console.debug('[fileSync] effect RATE', {
          runsPerSec: rps,
          dtMs: Math.round(dt),
          windowRuns: r.windowRuns,
          dragActive,
          itemsLen: items.length,
          stringifyMs: Math.round(stringifyMs * 10) / 10,
        });
        r.lastRateTs = now;
        r.windowRuns = 0;
      }
    }
    if (currentData === lastSavedRef.current) {
      return;
    }

    // 기존 타이머 취소
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 5초 후 자동 저장
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        console.log('💾 Auto-saving...');

        const result = await saveDiaryToFile(items, textData, diaryStyle, linkDockItems);

        if (result.success) {
          lastSavedRef.current = currentData;
          console.log('✅ Auto-saved successfully');
          
          // 조용한 성공 표시 (너무 자주 표시하지 않기)
          // setToastMsg('💾 Saved');
          // setTimeout(() => setToastMsg(''), 1000);
        } else {
          console.error('❌ Auto-save failed:', result.error);
          setToastMsg('❌ Save failed');
          setTimeout(() => setToastMsg(''), 2000);
        }
      } catch (error) {
        console.error('❌ Auto-save error:', error);
      }
    }, 5000);

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [items, textData, linkDockItems, diaryStyle, setToastMsg]);

  // ═══════════════════════════════════════════════════════
  // 📤 수동 저장
  // ═══════════════════════════════════════════════════════

  const saveManually = useCallback(async () => {
    if (!window.electron) {
      setToastMsg('ℹ️ Use web backup instead');
      setTimeout(() => setToastMsg(''), 2000);
      return;
    }

    try {
      console.log('💾 Manual save...');

      const result = await saveDiaryToFile(items, textData, diaryStyle, linkDockItems);

      if (result.success) {
        lastSavedRef.current = JSON.stringify({ items, textData, linkDockItems, diaryStyle });
        setToastMsg('✅ Saved');
        setTimeout(() => setToastMsg(''), 2000);
        console.log('✅ Manual save successful');
      } else {
        console.error('❌ Manual save failed:', result.error);
        setToastMsg('❌ Save failed');
        setTimeout(() => setToastMsg(''), 2000);
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      setToastMsg('❌ Error');
      setTimeout(() => setToastMsg(''), 2000);
    }
  }, [items, textData, linkDockItems, diaryStyle, setToastMsg]);

  // ═══════════════════════════════════════════════════════
  // 📊 파일 정보 조회
  // ═══════════════════════════════════════════════════════

  const getInfo = useCallback(async () => {
    if (!window.electron) {
      return null;
    }

    return await getFileInfo();
  }, []);

  return {
    saveManually,
    getInfo,
  };
}




