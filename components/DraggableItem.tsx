import React, { useRef, useState, useEffect } from 'react';
import { ScrapItem, ScrapPosition, BorderStyle } from '../types';

interface DraggableItemProps {
  item: ScrapItem;
  onUpdatePosition: (id: string, newPos: Partial<ScrapPosition>) => void;
  onBringToFront: (id: string) => void;
  onSelect?: (id: string) => void; // ✅ 선택된 오브젝트 편집 패널용 (MVP)
  onDelete: (id: string) => void;
  onSetMainItem: (id: string) => void;
  snapToGrid?: boolean;
  onDragStart?: () => void; // 📱 스와이프 제스처 비활성화용
  onDragEnd?: () => void;   // 📱 스와이프 제스처 재활성화용
  interactionScale?: number;  // 🔧 드래그 스케일 보정 (default: 1)
  children: React.ReactNode;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, onUpdatePosition, onBringToFront, onSelect, onDelete, onSetMainItem, snapToGrid = false, onDragStart, onDragEnd, interactionScale = 1, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const DBG = !!import.meta.env.DEV && (typeof window !== 'undefined') && ((window as any).__DSD_DEBUG_DRAG ?? true);
  const suppressNextClickRef = useRef(false);
  const hasIframeRef = useRef<boolean>(false);

  // --- Drag smoothing / local transform (no global state spam) ---
  const pendingDragRef = useRef<{
    pointerId: number | null;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    rafId: number | null;
    didStartDrag: boolean;
    // If we disabled iframe pointer events, remember to restore
    iframeDisabled: boolean;
  }>({
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    rafId: null,
    didStartDrag: false,
    iframeDisabled: false,
  });

  const dragDbgRef = useRef<{
    startTs: number;
    lastRateTs: number;
    totalMoves: number;
    windowMoves: number;
    lastStartTarget?: { tag?: string; cls?: string };
  }>({ startTs: 0, lastRateTs: 0, totalMoves: 0, windowMoves: 0 });
  
  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [isPointerActive, setIsPointerActive] = useState(false);

  // State for resizing
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, initialScale: 1 });

  // State for rotating
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState({ angle: 0 });

  const disableIframesPointerEvents = () => {
    const el = ref.current;
    if (!el) return;
    const iframes = Array.from(el.querySelectorAll('iframe')) as HTMLIFrameElement[];
    for (const iframe of iframes) {
      if (!(iframe as any).dataset) continue;
      const ds = (iframe as any).dataset as DOMStringMap;
      if (ds.__dsdPrevPe === undefined) {
        ds.__dsdPrevPe = iframe.style.pointerEvents || '';
      }
      iframe.style.pointerEvents = 'none';
    }
  };

  const restoreIframesPointerEvents = () => {
    const el = ref.current;
    if (!el) return;
    const iframes = Array.from(el.querySelectorAll('iframe')) as HTMLIFrameElement[];
    for (const iframe of iframes) {
      const ds = (iframe as any).dataset as DOMStringMap | undefined;
      if (!ds) continue;
      if (ds.__dsdPrevPe !== undefined) {
        iframe.style.pointerEvents = ds.__dsdPrevPe;
        delete ds.__dsdPrevPe;
      } else {
        iframe.style.pointerEvents = '';
      }
    }
  };

  // For small cards, iframe hit-testing can swallow pointerdown (especially when iframe fills the card).
  // To keep small-card drag stable, disable iframe pointer events when scale is small (and always during drag).
  useEffect(() => {
    // Cache whether this item currently contains an iframe (used to avoid losing pointer events during "potential drag")
    try {
      const el = ref.current;
      hasIframeRef.current = !!el?.querySelector?.('iframe');
    } catch {
      hasIframeRef.current = false;
    }

    const scale = item.position.scale || 1;
    const small = scale < 0.8;
    if (isDragging || small) {
      disableIframesPointerEvents();
      pendingDragRef.current.iframeDisabled = true;
    } else if (pendingDragRef.current.iframeDisabled) {
      restoreIframesPointerEvents();
      pendingDragRef.current.iframeDisabled = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.position.scale, isDragging]);

  // Clear local drag vars once global position catches up (prevents snap-back flicker after commit)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isDragging) return;
    const ds = (el as any).dataset as DOMStringMap | undefined;
    if (!ds) return;
    if (ds.__dsdDragPending !== '1') return;
    // When not dragging, always drop the local overrides; global state should now be authoritative.
    el.style.removeProperty('--dsd-drag-x');
    el.style.removeProperty('--dsd-drag-y');
    delete ds.__dsdDragPending;
  }, [item.position.x, item.position.y, isDragging]);

  // --- Drag Handlers ---
  const handlePointerDown = (e: React.PointerEvent) => {
    // 🔗 입력/버튼은 드래그 시작 방지 (링크(<a>)는 "움직였을 때만 드래그"로 처리)
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea')) {
      if (DBG) {
        const blockedBy =
          (target.closest('button') && 'button') ||
          (target.closest('input') && 'input') ||
          (target.closest('textarea') && 'textarea') ||
          'unknown';
        console.debug('[drag] pointerDown BLOCKED', {
          itemId: item.id,
          blockedBy,
          tag: (target as any)?.tagName,
          className: (target as any)?.className,
        });
      }
      // ✅ 드래그는 막되, "선택"은 가능해야 꾸미기 패널을 열 수 있음
      onBringToFront(item.id);
      onSelect?.(item.id);
      return;
    }
    
    onBringToFront(item.id);
    onSelect?.(item.id);
    // "potential drag" 시작: 아직 preventDefault 하지 않아 링크 클릭/더블클릭은 유지됨.
    setIsPointerActive(true);
    pendingDragRef.current.pointerId = e.pointerId;
    pendingDragRef.current.startClientX = e.clientX;
    pendingDragRef.current.startClientY = e.clientY;
    pendingDragRef.current.startX = item.position.x;
    pendingDragRef.current.startY = item.position.y;
    pendingDragRef.current.lastX = item.position.x;
    pendingDragRef.current.lastY = item.position.y;
    pendingDragRef.current.didStartDrag = false;
    // Capture는 여기서 해도 되지만, 실제 드래그가 시작될 때만 하는 편이 클릭을 덜 방해한다.

    // Debug counters (rate-limited to ~1 log/sec)
    if (DBG) {
      const now = performance.now();
      dragDbgRef.current.startTs = now;
      dragDbgRef.current.lastRateTs = now;
      dragDbgRef.current.totalMoves = 0;
      dragDbgRef.current.windowMoves = 0;
      dragDbgRef.current.lastStartTarget = {
        tag: (target as any)?.tagName,
        cls: (target as any)?.className,
      };
      console.debug('[drag] START', {
        itemId: item.id,
        interactionScale,
        itemScale: item.position.scale,
        targetTag: dragDbgRef.current.lastStartTarget.tag,
        targetClass: dragDbgRef.current.lastStartTarget.cls,
      });
    }
  };

  // --- Resize Handlers ---
  const handleResizeDown = (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent drag start
      
      // Capture pointer for smooth touch tracking
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      
      onBringToFront(item.id);
      onDragStart?.(); // ✅ 리사이즈 중 모달 오픈 방지용
      setIsResizing(true);
      setResizeStart({
          x: e.clientX,
          initialScale: item.position.scale || 1
      });
  };

  // --- Rotate Handlers ---
  const handleRotateDown = (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Capture pointer for smooth touch tracking
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      
      onBringToFront(item.id);
      onDragStart?.(); // ✅ 회전 중 모달 오픈 방지용
      setIsRotating(true);
      // We calculate initial angle relative to the center of the item is handled in move
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // Logic for resizing
      if (isResizing) {
          const deltaX = e.clientX - resizeStart.x;
          // Scale sensitivity: 0.005 per pixel. 
          const newScale = Math.max(0.3, Math.min(4, resizeStart.initialScale + (deltaX * 0.005)));
          
          onUpdatePosition(item.id, { scale: newScale });
          return;
      }

      // Logic for rotating
      if (isRotating && ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          const dx = e.clientX - centerX;
          const dy = e.clientY - centerY;
          
          // Calculate angle in degrees
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          
          // Adjust so the handle feels natural (offset by 45 or 90 deg if needed, but atan2 is standard)
          // Adding 45 degrees because the handle is at bottom-left corner usually
          angle = angle - 135; 

          onUpdatePosition(item.id, { rotation: angle });
          return;
      }

      // Logic for dragging
      if ((isDragging || pendingDragRef.current.pointerId != null) && ref.current) {
          // Only react to the active pointer
          const pid = pendingDragRef.current.pointerId;
          if (pid != null && (e as any).pointerId != null && (e as any).pointerId !== pid) return;

          const dx = (e.clientX - pendingDragRef.current.startClientX) / interactionScale;
          const dy = (e.clientY - pendingDragRef.current.startClientY) / interactionScale;

          // If this item contains an iframe, we can lose subsequent pointer events before "real drag" begins.
          // As soon as we see *any* meaningful movement, proactively disable iframe hit-testing so we keep receiving move/up.
          if (!pendingDragRef.current.didStartDrag && hasIframeRef.current) {
            const dist2Early = dx * dx + dy * dy;
            if (dist2Early >= 1 && !pendingDragRef.current.iframeDisabled) {
              disableIframesPointerEvents();
              pendingDragRef.current.iframeDisabled = true;
            }
          }

          // Start dragging only after a small threshold (keeps link clicks working)
          if (!pendingDragRef.current.didStartDrag) {
            const dist2 = dx * dx + dy * dy;
            if (dist2 < 16) { // 4px threshold in design coords
              return;
            }
            pendingDragRef.current.didStartDrag = true;
            setIsDragging(true);
            onDragStart?.();
            if (typeof window !== 'undefined') (window as any).__DSD_DRAG_ACTIVE = true;

            // Capture pointer to keep moves stable even when leaving element
            try {
              (ref.current as any)?.setPointerCapture?.(pid as number);
            } catch {
              // ignore
            }

            // During drag, make sure iframes can't steal events
            disableIframesPointerEvents();
            pendingDragRef.current.iframeDisabled = true;
          }

          if (DBG) {
            const now = performance.now();
            dragDbgRef.current.totalMoves += 1;
            dragDbgRef.current.windowMoves += 1;
            const dt = now - dragDbgRef.current.lastRateTs;
            if (dt >= 1000) {
              const mps = Math.round((dragDbgRef.current.windowMoves * 1000) / dt);
              console.debug('[drag] MOVE_RATE', {
                itemId: item.id,
                movesPerSec: mps,
                windowMoves: dragDbgRef.current.windowMoves,
                dtMs: Math.round(dt),
                interactionScale,
                itemScale: item.position.scale,
              });
              dragDbgRef.current.lastRateTs = now;
              dragDbgRef.current.windowMoves = 0;
            }
          }

          let newX = pendingDragRef.current.startX + dx;
          let newY = pendingDragRef.current.startY + dy;

          // 🔧 간소화된 Boundary Check - Y축만 제한 (X축은 자유롭게)
          // Desktop에서 왼쪽/오른쪽 페이지 이동을 위해 X축 제한 제거
          const minY = -200; // 상단 여유
          const maxY = 1000; // 하단 여유 (DESIGN_HEIGHT 820 + 여유)
          
          newY = Math.max(minY, Math.min(maxY, newY));
          // newX는 제한 없음 (페이지 경계를 자유롭게 넘나들 수 있음)

          // Magnetic Grid Logic (Snap to 20px)
          if (snapToGrid) {
              const gridSize = 20;
              newX = Math.round(newX / gridSize) * gridSize;
              newY = Math.round(newY / gridSize) * gridSize;
          }

          pendingDragRef.current.lastX = newX;
          pendingDragRef.current.lastY = newY;

          // raf-throttle: update only CSS vars (no React rerender, no global state)
          const el = ref.current;
          if (!el) return;
          if (pendingDragRef.current.rafId == null) {
            pendingDragRef.current.rafId = window.requestAnimationFrame(() => {
              pendingDragRef.current.rafId = null;
              const el2 = ref.current;
              if (!el2) return;
              (el2 as any).dataset.__dsdDragPending = '1';
              el2.style.setProperty('--dsd-drag-x', `${pendingDragRef.current.lastX}px`);
              el2.style.setProperty('--dsd-drag-y', `${pendingDragRef.current.lastY}px`);
            });
          }
      }
    };

    const stopInteraction = (opts?: { commit?: boolean; reason?: string }) => {
      const commit = opts?.commit ?? true;
      const wasDragging = isDragging;
      const wasResizing = isResizing;
      const wasRotating = isRotating;
      setIsDragging(false);
      setIsPointerActive(false);
      setIsResizing(false);
      setIsRotating(false);
      if (wasDragging || wasResizing || wasRotating) {
        onDragEnd?.(); // 📱 드래그 종료 알림
        if (typeof window !== 'undefined') (window as any).__DSD_DRAG_ACTIVE = false;
        if (DBG) {
          const now = performance.now();
          const dur = dragDbgRef.current.startTs ? (now - dragDbgRef.current.startTs) : 0;
          console.debug('[drag] END', {
            itemId: item.id,
            durationMs: Math.round(dur),
            totalMoves: dragDbgRef.current.totalMoves,
            interactionScale,
            itemScale: item.position.scale,
            reason: opts?.reason,
          });
        }
      }

      // If we actually dragged, commit once to global state on end.
      if (commit && pendingDragRef.current.pointerId != null && pendingDragRef.current.didStartDrag) {
        onUpdatePosition(item.id, { x: pendingDragRef.current.lastX, y: pendingDragRef.current.lastY });
        // Suppress the synthetic click that may follow a drag (especially when starting on <a>)
        suppressNextClickRef.current = true;
        setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 0);
      }

      // Best-effort release pointer capture (in case we stop via ESC/blur/visibilitychange)
      try {
        const pid = pendingDragRef.current.pointerId;
        if (pid != null) (ref.current as any)?.releasePointerCapture?.(pid);
      } catch {
        // ignore
      }

      // reset pending drag
      pendingDragRef.current.pointerId = null;
      pendingDragRef.current.didStartDrag = false;
      if (pendingDragRef.current.rafId != null) {
        try {
          window.cancelAnimationFrame(pendingDragRef.current.rafId);
        } catch {
          // ignore
        }
        pendingDragRef.current.rafId = null;
      }

      // restore iframe pointer events if we changed them (except small-card lock, handled by effect)
      const scaleNow = item.position.scale || 1;
      const smallNow = scaleNow < 0.8;
      if (pendingDragRef.current.iframeDisabled && !smallNow) {
        restoreIframesPointerEvents();
        pendingDragRef.current.iframeDisabled = false;
      }
    };

    const handlePointerUp = () => stopInteraction({ commit: true, reason: 'pointerup' });
    const handlePointerCancel = () => stopInteraction({ commit: true, reason: 'pointercancel' });
    const handleMouseUp = () => stopInteraction({ commit: true, reason: 'mouseup' });
    const handleWindowBlur = () => stopInteraction({ commit: true, reason: 'blur' });
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopInteraction({ commit: true, reason: 'visibilitychange' });
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // ESC는 "취소"로 취급: 위치 commit 없이 강제 종료
        stopInteraction({ commit: false, reason: 'esc' });
      }
    };

    if (isPointerActive || isDragging || isResizing || isRotating) {
      // Use capture so we get events as early as possible in the propagation chain.
      window.addEventListener('pointermove', handlePointerMove, true);
      window.addEventListener('pointerup', handlePointerUp, true);
      window.addEventListener('pointercancel', handlePointerCancel, true);
      // Fallback: some environments still deliver mouseup even when pointer events are flaky
      window.addEventListener('mouseup', handleMouseUp, true);

      window.addEventListener('blur', handleWindowBlur);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerCancel, true);
      window.removeEventListener('mouseup', handleMouseUp, true);

      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPointerActive, isDragging, isResizing, isRotating, resizeStart, item.id, onUpdatePosition, snapToGrid, onDragStart, onDragEnd, interactionScale, item.position.scale, item.position.x, item.position.y]);

  const deleteItem = (e: React.MouseEvent) => {
      e.stopPropagation();
      console.log("🖱️ 삭제 버튼 클릭:", { 
        itemId: item.id, 
        itemType: item.type,
        diaryDate: item.diaryDate 
      });
      
      if (!item.id) {
        console.error("❌ item.id가 undefined입니다!");
        alert("삭제할 수 없습니다: 아이템 ID가 없습니다.");
        return;
      }
      
      onDelete(item.id);
  };
  
  const toggleMainItem = (e: React.MouseEvent) => {
      e.stopPropagation();
      console.log("⭐ 별표 버튼 클릭:", { 
        itemId: item.id, 
        isCurrentlyMain: item.isMainItem,
        diaryDate: item.diaryDate,
        hasSourceId: !!item.metadata.sourceId
      });
      
      if (!item.id) {
        console.error("❌ item.id가 undefined입니다!");
        return;
      }
      
      onSetMainItem(item.id);
  };

  // Dynamic Styles (keeping the visual logic but removing the toggle button)
  const getBorderClasses = (style?: BorderStyle) => {
      switch(style) {
          case 'stitch': return 'border-2 border-dashed border-stone-400/50 p-2 rounded-xl'; 
          case 'marker': return 'border-4 border-stone-800 p-1 rounded-sm';
          case 'tape': return 'shadow-[0_0_0_8px_rgba(255,255,255,0.4)] rounded-none';
          case 'shadow': return 'drop-shadow-[10px_10px_15px_rgba(0,0,0,0.5)]';
          default: return '';
      }
  };

  return (
    <div
      ref={ref}
      onPointerDownCapture={handlePointerDown}
      onClickCapture={(e) => {
        if (!suppressNextClickRef.current) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      className={`absolute select-none touch-none transition-shadow group/item ${isDragging ? 'z-50 cursor-grabbing drop-shadow-2xl' : 'cursor-grab'} ${getBorderClasses(item.borderStyle)}`}
      style={{
        transform: `translate(var(--dsd-drag-x, ${item.position.x}px), var(--dsd-drag-y, ${item.position.y}px)) rotate(${item.position.rotation}deg) scale(${item.position.scale || 1})`,
        zIndex: isDragging || isResizing || isRotating ? 9999 : item.position.z,
        transformOrigin: 'center center', // Better for rotation
        touchAction: 'none' // Prevent browser touch gestures
      }}
    >
      {/* Content */}
      <div className={isResizing || isRotating ? 'pointer-events-none' : ''}>
         {children}
      </div>

      {/* --- Controls Overlay (Visible on Hover) --- */}
      
      {/* 1. Delete Button (Top Right) */}
      <button 
          onPointerDown={(e) => e.stopPropagation()} // FIX: Prevent drag start
          onClick={deleteItem}
          className="absolute -top-3 -right-3 w-10 h-10 bg-[var(--ui-danger-bg)] rounded-full text-[var(--ui-danger-text)] shadow-md flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity hover:scale-110 active:scale-95 z-50 no-drag touch-manipulation hover:bg-[var(--ui-danger-hover)]"
          title="Delete Item"
      >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
      </button>

      {/* 2. Rotate Handle (Bottom Left) - Replaces Border Button */}
      <div 
          onPointerDown={handleRotateDown}
          className={`
            absolute -bottom-3 -left-3 w-10 h-10 bg-[var(--ui-primary-bg)] rounded-full text-[var(--ui-primary-text)] shadow-md flex items-center justify-center 
            cursor-ew-resize opacity-0 group-hover/item:opacity-100 transition-opacity hover:scale-110 active:scale-95 z-50 no-drag touch-manipulation
            hover:bg-[var(--ui-primary-hover)]
            ${isRotating ? 'opacity-100 scale-110 bg-[var(--ui-primary-hover)]' : ''}
          `}
          title="Rotate"
      >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
      </div>

      {/* 3. Main Item Toggle (Top Center) - 별표로 스크랩 페이지 추가 */}
      <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggleMainItem}
          className={`
            absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all z-50 no-drag touch-manipulation active:scale-95
            ${item.metadata.sourceId || item.isMainItem ? 'bg-yellow-400 text-white scale-110 ring-2 ring-yellow-200' : 'bg-white text-stone-300 hover:text-yellow-400 opacity-0 group-hover/item:opacity-100'}
          `}
          title={item.metadata.sourceId ? "스크랩됨 (클릭하여 제거)" : item.isMainItem ? "스크랩 페이지에서 제거" : "⭐ 클릭하여 스크랩 페이지에 추가"}
      >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a1 1 0 01.894.553l2.991 6.062 6.696.973a1 1 0 01.555 1.705l-4.846 4.723 1.144 6.669a1 1 0 01-1.45 1.054L10 18.347l-5.989 3.146a1 1 0 01-1.45-1.054l1.144-6.669L.555 11.293a1 1 0 01.555-1.705l6.696-.973L9.106 2.553A1 1 0 0110 2z" clipRule="evenodd" />
          </svg>
      </button>

      {/* Resize Handle (Bottom Right) */}
      <div 
        onPointerDown={handleResizeDown}
        className={`
            absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 
            flex items-center justify-center cursor-nwse-resize z-50 text-slate-400 hover:text-purple-600 hover:bg-purple-50 active:scale-95 transition-all
            opacity-0 group-hover/item:opacity-100 ${isResizing ? 'opacity-100 bg-purple-100 text-purple-600' : ''} no-drag touch-manipulation
        `}
        title="Drag to resize"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>

      {/* Debug/Info Scale Label (Optional, visible when resizing) */}
      {isResizing && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              {Math.round((item.position.scale || 1) * 100)}%
          </div>
      )}
    </div>
  );
};

export default DraggableItem;