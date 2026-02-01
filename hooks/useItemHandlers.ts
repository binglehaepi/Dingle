import { useCallback, useRef } from 'react';
import type * as React from 'react';
import { ScrapItem, ScrapType, ScrapMetadata, ScrapPosition, Platform } from '../types';
import { parseUrlType } from '../services/urlParser';
import { fetchMetadata } from '../services/apiClient';
import { compressImage } from '../services/imageUtils';
import { SPREAD_WIDTH, PAGE_WIDTH, DESIGN_HEIGHT, GLOBAL_SCRAP_PAGE_KEY, STYLE_PREF_KEY } from '../constants/appConstants';
import { AppState } from './useAppState';

interface ItemHandlersProps {
  state: AppState;
  isMobile: boolean;
  pageOffset: number;
  formatDateKey: (date: Date) => string;
  formatMonthKey: (date: Date) => string;
}

/**
 * 아이템 CRUD 핸들러 훅
 * 
 * - 아이템 생성 (스크랩, 업로드, 수동)
 * - 아이템 수정 (위치, 메타데이터)
 * - 아이템 삭제
 * - 아이템 관리 (메인 설정, z-index)
 */
export function useItemHandlers({ state, isMobile, pageOffset, formatDateKey, formatMonthKey }: ItemHandlersProps) {
  const {
    items,
    setItems,
    currentLayout,
    currentDate,
    setMaxZ,
    loading,
    setLoading,
    setToastMsg,
    pendingYoutube,
    setPendingYoutube,
    setShowCreationModal,
    diaryStyle,
    setDiaryStyle,
  } = state;

  const DBG = !!(import.meta as any).env?.DEV && (typeof window !== 'undefined') && ((window as any).__DSD_DEBUG_DRAG ?? true);
  const setItemsDbgRef = useRef<{
    lastRateTs: number;
    windowCalls: number;
    totalCalls: number;
    lastSample?: { id: string; keys: string[] };
  }>({ lastRateTs: 0, windowCalls: 0, totalCalls: 0 });

  type AABB = { x: number; y: number; w: number; h: number };

  const estimateBoxFor = (type: ScrapType, platform?: Platform) => {
    // 스티커/테이프: 작은 크기 (60x60)
    if (type === ScrapType.STICKER || type === ScrapType.TAPE) {
      return { w: 60, h: 60 };
    }

    // 텍스트 노트: 중간 크기
    if (type === ScrapType.NOTE) {
      return { w: 300, h: 150 };
    }

    // MVP: 링크/임베드 계열은 대체로 넓은 카드
    const p = platform?.toLowerCase();
    if (
      p === 'twitter' ||
      p === 'instagram' ||
      p === 'pinterest' ||
      p === 'youtube' ||
      p === 'spotify' ||
      p === 'tiktok' ||
      p === 'vimeo' ||
      p === 'aladin' ||
      p === 'googlemap' ||
      p === 'link'
    ) {
      return { w: 420, h: 360 };
    }

    if (
      type === ScrapType.TWITTER ||
      type === ScrapType.INSTAGRAM ||
      type === ScrapType.PINTEREST ||
      type === ScrapType.YOUTUBE ||
      type === ScrapType.SPOTIFY ||
      type === ScrapType.TIKTOK ||
      type === ScrapType.VIMEO
    ) {
      return { w: 420, h: 360 };
    }

    // 기본(폴라로이드/메모 등)
    return { w: 280, h: 380 };
  };

  const aabbIntersects = (a: AABB, b: AABB) => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  const findAutoPosition = (prevItems: ScrapItem[], targetDateKey: string, boxW: number, boxH: number): { x: number; y: number } => {
    // MVP: 우측 페이지 영역 안에서만 자동 배치 (겹침 방지)
    const margin = 24;
    const minX = PAGE_WIDTH + margin;
    const maxX = SPREAD_WIDTH - margin - boxW;
    const minY = 110;
    const maxY = DESIGN_HEIGHT - margin - boxH;

    const occupied: AABB[] = prevItems
      .filter((it) => it.diaryDate === targetDateKey)
      .map((it) => {
        const scale = it.position.scale || 1;
        const size = estimateBoxFor(it.type, it.metadata?.platform as any);
        return {
          x: it.position.x,
          y: it.position.y,
          w: size.w * scale,
          h: size.h * scale,
        };
      });

    const step = 20;
    for (let y = minY; y <= maxY; y += step) {
      for (let x = minX; x <= maxX; x += step) {
        const candidate: AABB = { x, y, w: boxW, h: boxH };
        if (!occupied.some((o) => aabbIntersects(candidate, o))) {
          return { x, y };
        }
      }
    }

    // 공간이 부족하면 기존 랜덤 스폰 규칙으로 fallback
    return {
      x: (PAGE_WIDTH + (PAGE_WIDTH / 2)) + (Math.random() * 60 - 30),
      y: (DESIGN_HEIGHT / 2) + (Math.random() * 60 - 30),
    };
  };

  // --- 아이템 삭제 ---
  const handleDeleteItem = useCallback((id: string) => {
    if (!id) {
      console.error("❌ 삭제 실패: ID가 없습니다!", { id });
      setToastMsg('삭제 오류');
      setTimeout(() => setToastMsg(''), 2000);
      return;
    }

    console.log("🗑️ 삭제 시도:", { id });
    
    if (window.confirm("이 아이템을 삭제하시겠습니까?")) {
      setItems(prev => {
        const filtered = prev.filter(item => item.id !== id);
        console.log("✅ 삭제 완료:", { 
          삭제된_ID: id, 
          이전_개수: prev.length, 
          현재_개수: filtered.length 
        });
        return filtered;
      });
      setToastMsg('삭제됨');
      setTimeout(() => setToastMsg(''), 1000);
    }
  }, [setItems, setToastMsg]);

  // --- 메인 아이템 설정 (스크랩 페이지 추가/제거) ---
  const handleSetMainItem = useCallback((id: string) => {
    setItems(prev => {
      const targetItem = prev.find(i => i.id === id);
      if (!targetItem) {
        console.error("❌ 아이템을 찾을 수 없습니다:", id);
        return prev;
      }
      
      // 1. 현재 페이지에서 메인 아이템 설정
      const updatedItems = prev.map(item => {
        if (item.diaryDate === targetItem.diaryDate) {
          return {
            ...item,
            isMainItem: item.id === id ? !item.isMainItem : false
          };
        }
        return item;
      });
      
      // 2. 스크랩 페이지에 추가/제거 (토글)
      const isAlreadyInScrapPage = prev.some(
        item => item.metadata.sourceId === id && item.diaryDate === GLOBAL_SCRAP_PAGE_KEY
      );
      
      if (isAlreadyInScrapPage) {
        console.log("⭐ 스크랩 페이지에서 제거:", id);
        const filtered = updatedItems.filter(
          item => !(item.metadata.sourceId === id && item.diaryDate === GLOBAL_SCRAP_PAGE_KEY)
        );
        setToastMsg('스크랩 제거됨');
        setTimeout(() => setToastMsg(''), 1000);
        return filtered;
      } else {
        console.log("⭐ 스크랩 페이지에 추가:", id);
        const scrapCopy: ScrapItem = {
          ...targetItem,
          id: crypto.randomUUID(),
          diaryDate: GLOBAL_SCRAP_PAGE_KEY,
          metadata: {
            ...targetItem.metadata,
            sourceId: id
          },
          position: {
            ...targetItem.position,
            x: 400 + (Math.random() * 200 - 100),
            y: 300 + (Math.random() * 200 - 100),
          },
          createdAt: Date.now()
        };
        
        setToastMsg('⭐ 스크랩 추가됨!');
        setTimeout(() => setToastMsg(''), 1500);
        return [...updatedItems, scrapCopy];
      }
    });
  }, [setItems, setToastMsg]);

  // --- 배경 이미지 업로드 (MVP에서 제거됨) ---
  // const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { ... };

  // --- URL 스크랩 ---
  const handleScrap = useCallback(async (url: string) => {
    // ✅ URL 검증 추가
    try {
      new URL(url);
    } catch {
      setToastMsg('❌ 올바른 URL을 입력해주세요');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }
    
    setLoading(true);
    try {
      const type = parseUrlType(url);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('요청 시간 초과')), 15000)
      );
      
      const metadata = await Promise.race([
        fetchMetadata(url, type),
        timeoutPromise
      ]) as ScrapMetadata;
      
      if (type === ScrapType.YOUTUBE) {
        setPendingYoutube({ url, metadata });
        setLoading(false);
        return;
      }
      
      addItem(type, metadata);
      setToastMsg('스크랩 완료!');
      setTimeout(() => setToastMsg(''), 1500);
    } catch (error) {
      console.error('스크랩 실패:', error);
      setToastMsg('스크랩 실패! 다시 시도해주세요');
      setTimeout(() => setToastMsg(''), 3000);
      
      const type = parseUrlType(url);
      const fallbackMetadata: ScrapMetadata = {
        title: "링크 스크랩",
        subtitle: "수동으로 편집하세요",
        description: "자동 로드에 실패했습니다",
        url: url,
        imageUrl: `https://picsum.photos/seed/${Date.now()}/400/400`,
        themeColor: "#64748b",
        isEditable: true,
        ...(type === ScrapType.TWITTER && {
          tweetId: url.match(/status\/(\d+)/)?.[1] || 'unknown'
        })
      };
      addItem(type, fallbackMetadata);
    } finally {
      if (parseUrlType(url) !== ScrapType.YOUTUBE) setLoading(false);
    }
  }, [currentDate, currentLayout]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- URL 스크랩 (특정 날짜로 생성: Link Dock 전용) ---
  const handleScrapToDate = useCallback(async (url: string, targetDateKey: string) => {
    // ✅ URL 검증 추가
    try {
      new URL(url);
    } catch {
      setToastMsg('❌ 올바른 URL을 입력해주세요');
      setTimeout(() => setToastMsg(''), 3000);
      return null;
    }
    
    if (!targetDateKey) return null;
    setLoading(true);
    try {
      const type = parseUrlType(url);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('요청 시간 초과')), 15000)
      );

      const metadata = await Promise.race([
        fetchMetadata(url, type),
        timeoutPromise
      ]) as ScrapMetadata;

      if (type === ScrapType.YOUTUBE) {
        // YouTube는 기존 모달 흐름 재사용 (confirm 시 targetDateKey 반영)
        setPendingYoutube({ url, metadata, targetDateKey });
        setLoading(false);
        return null;
      }

      const id = spawnItem(type, metadata, { targetDateKey });
      setToastMsg('링크 추가됨');
      setTimeout(() => setToastMsg(''), 1200);
      return id;
    } catch (error) {
      console.error('스크랩 실패:', error);
      setToastMsg('추가 실패');
      setTimeout(() => setToastMsg(''), 2000);

      const type = parseUrlType(url);
      const fallbackMetadata: ScrapMetadata = {
        title: "링크 스크랩",
        subtitle: "수동으로 편집하세요",
        description: "자동 로드에 실패했습니다",
        url: url,
        imageUrl: `https://picsum.photos/seed/${Date.now()}/400/400`,
        themeColor: "#64748b",
        isEditable: true,
        ...(type === ScrapType.TWITTER && {
          tweetId: url.match(/status\/(\d+)/)?.[1] || 'unknown'
        })
      };

      const id = spawnItem(type, fallbackMetadata, { targetDateKey });
      return id;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setToastMsg, setPendingYoutube]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- 수동 생성 ---
  const handleCreateManual = (type: ScrapType, metadata: ScrapMetadata) => {
    addItem(type, metadata);
    setShowCreationModal(false);
  };

  // --- 데코레이션 추가 ---
  const handleDecoration = (type: ScrapType, metadata: ScrapMetadata) => {
    addItem(type, metadata);
  };

  // --- 이미지 업로드 ---
  const addPhotoSticker = useCallback(async (targetDateKey: string, file: File) => {
    if (!targetDateKey) return null;
    try {
      const result = await compressImage(file, 600, 0.7);
      
      if (result) {
        const metadata: ScrapMetadata = {
          title: "Image",
          subtitle: "Upload",
          description: "",
          imageUrl: result,
          url: "", 
          isEditable: false,
          stickerConfig: {
            imageUrl: result,
            emoji: undefined
          }
        };
        const id = spawnItem(ScrapType.STICKER, metadata, { targetDateKey });
        return id;
      }
    } catch (e) {
      console.error("Upload processing failed", e);
      setToastMsg('Error');
    }
    return null;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Back-compat: 기존 호출부(file만 전달)는 현재 컨텍스트(date/month/scrap)에 따라 생성
  const handleUpload = useCallback(async (file: File, targetDateKey?: string) => {
    // Determine context (spawnItem과 동일 규칙)
    let effectiveKey = formatDateKey(currentDate);
    if (currentLayout === 'monthly') effectiveKey = formatMonthKey(currentDate);
    if (currentLayout === 'scrap_page') effectiveKey = GLOBAL_SCRAP_PAGE_KEY;
    if (targetDateKey) effectiveKey = targetDateKey;
    return await addPhotoSticker(effectiveKey, file);
  }, [addPhotoSticker, currentDate, currentLayout, formatDateKey, formatMonthKey]);

  // --- 아이템 추가 (내부 함수) ---
  const addItem = (type: ScrapType, metadata: ScrapMetadata) => spawnItem(type, metadata);

  const spawnItem = (
    type: ScrapType,
    metadata: ScrapMetadata,
    opts?: { targetDateKey?: string }
  ) => {
    const designW = SPREAD_WIDTH;
    const designH = DESIGN_HEIGHT;
    
    // Determine context
    let targetDateKey = formatDateKey(currentDate);
    if (currentLayout === 'monthly') targetDateKey = formatMonthKey(currentDate);
    if (currentLayout === 'scrap_page') targetDateKey = GLOBAL_SCRAP_PAGE_KEY;
    if (opts?.targetDateKey) targetDateKey = opts.targetDateKey;

    const id = crypto.randomUUID();
    const createdAt = Date.now();
    const rotation = (Math.random() * 4) - 2;
    const scale = type === ScrapType.STICKER || type === ScrapType.TAPE ? 1.0 : 0.5;
    const est = estimateBoxFor(type, metadata?.platform as any);
    const boxW = est.w * scale;
    const boxH = est.h * scale;

    setItems((prev) => {
      // Spawn location (기본: 기존 규칙, 단 LinkDock/날짜 지정은 AABB 기반 자동 배치)
      let baseX: number;
      let baseY: number;

      const isTargetingSpecificDate = !!opts?.targetDateKey && targetDateKey === opts?.targetDateKey;
      // opts.targetDateKey로 명시 생성된 아이템은 "드래그 가능한 영역(우측 페이지)"에 안정적으로 배치한다.
      // (월/달력 UI 위에 겹치면 hit-test가 먹혀 드래그가 안 되는 케이스 방지)
      if (!isMobile && isTargetingSpecificDate) {
        const pos = findAutoPosition(prev, targetDateKey, boxW, boxH);
        baseX = pos.x;
        baseY = pos.y;
      } else if (isMobile) {
        baseX = (PAGE_WIDTH / 2) + (Math.random() * 100 - 50);
        baseY = (designH / 2) + (Math.random() * 100 - 50);
      } else if (currentLayout === 'monthly') {
        baseX = (PAGE_WIDTH / 2) + (Math.random() * 60 - 30);
        baseY = (designH / 2) + (Math.random() * 60 - 30);
      } else {
        baseX = (designW / 2) + (Math.random() * 100 - 50);
        baseY = (designH / 2) + (Math.random() * 100 - 50);
      }

      // z는 prev 기반으로 안전하게 증가시킴
      const highestZ = prev.reduce((m, it) => Math.max(m, it.position?.z || 1), 1);
      const z = highestZ + 1;
      setMaxZ(z + 1);

      const newItem: ScrapItem = {
        id,
        type,
        metadata,
        position: {
          x: baseX + (isMobile ? pageOffset : 0),
          y: baseY,
          z,
          rotation,
          scale
        },
        w: boxW,  // ✅ 아이템 너비 설정
        h: boxH,  // ✅ 아이템 높이 설정
        createdAt,
        diaryDate: targetDateKey,
        borderStyle: 'none',
        pageSide: (baseX + (isMobile ? pageOffset : 0)) >= PAGE_WIDTH ? 'right' : 'left'
      };

      return [...prev, newItem];
    });

    // maxZ는 위에서 setMaxZ(z+1)로 동기화됨
    return id;
  };

  // --- YouTube 확인 ---
  const confirmYoutube = (config: { mode: 'cd' | 'player'; startTime: number }) => {
    if (pendingYoutube) {
      const updatedMetadata = { ...pendingYoutube.metadata, youtubeConfig: config };
      // Link Dock에서 들어온 경우: targetDateKey를 우선 적용
      if (pendingYoutube.targetDateKey) {
        spawnItem(ScrapType.YOUTUBE, updatedMetadata, { targetDateKey: pendingYoutube.targetDateKey });
      } else {
        addItem(ScrapType.YOUTUBE, updatedMetadata);
      }
      setPendingYoutube(null);
    }
  };

  // --- 텍스트 노트 추가 ---
  const handleAddText = () => {
    const metadata: ScrapMetadata = {
      title: '',
      url: '',
      noteConfig: {
        text: '',
        isEditing: true,
        fontSize: '14px'
      }
    };
    
    spawnItem(ScrapType.NOTE, metadata);
    setToastMsg('📝 텍스트 추가');
    setTimeout(() => setToastMsg(''), 1000);
  };

  // --- 아이템 업데이트 ---
  const updatePosition = useCallback((id: string, newPos: Partial<ScrapPosition>) => {
    if (DBG) {
      const now = performance.now();
      const ref = setItemsDbgRef.current;
      if (!ref.lastRateTs) ref.lastRateTs = now;
      ref.totalCalls += 1;
      ref.windowCalls += 1;
      ref.lastSample = { id, keys: Object.keys(newPos || {}) };
      const dt = now - ref.lastRateTs;
      if (dt >= 1000) {
        const cps = Math.round((ref.windowCalls * 1000) / dt);
        const dragActive = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
        console.debug('[setItems] updatePosition RATE', {
          callsPerSec: cps,
          windowCalls: ref.windowCalls,
          dtMs: Math.round(dt),
          totalCalls: ref.totalCalls,
          dragActive,
          sample: ref.lastSample,
        });
        ref.lastRateTs = now;
        ref.windowCalls = 0;
      }
    }
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, position: { ...item.position, ...newPos } };
      }
      return item;
    }));
  }, [setItems]);

  const updateMetadata = useCallback((id: string, newMeta: Partial<ScrapMetadata>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, metadata: { ...item.metadata, ...newMeta } } : item
    ));
  }, [setItems]);

  const bringToFront = useCallback((id: string) => {
    setMaxZ(prev => {
      const newMax = prev + 1;
      setItems(items => items.map(item => 
        item.id === id ? { ...item, position: { ...item.position, z: newMax } } : item
      ));
      return newMax;
    });
  }, [setItems, setMaxZ]);

  return {
    handleDeleteItem,
    handleSetMainItem,
    // handleBackgroundUpload, // Removed for MVP
    handleScrap,
    handleScrapToDate,
    handleCreateManual,
    handleDecoration,
    handleUpload,
    addPhotoSticker,
    confirmYoutube,
    handleAddText,
    updatePosition,
    updateMetadata,
    bringToFront,
  };
}




