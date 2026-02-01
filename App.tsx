import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { STORAGE_KEY, TEXT_DATA_KEY, STYLE_PREF_KEY, LINK_DOCK_KEY } from './constants/appConstants';
import { UpdateNotification } from './components/UpdateNotification';
import AppMain from './AppMain';
import { MusicProvider } from './music/MusicStore';

type WindowMode = 'app' | 'overlay';
type DetectedMode = WindowMode | 'unknown';

function getWindowModeFromLocation(): WindowMode | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('windowMode');
    if (m === 'app') return 'app';
    if (m === 'overlay') return 'overlay';
    // alias: legacy note -> overlay
    if (m === 'note') return 'overlay';
    return null;
  } catch {
    return null;
  }
}

function debugModeLabel(m: WindowMode | null): string {
  return m ?? '<null>';
}

const OverlayModeView: React.FC = () => {
  const [locked, setLocked] = useState(false);

  // ✅ renderer 생존 핸드셰이크(overlay가 보이게 만드는 트리거)
  useEffect(() => {
    try {
      console.log('[renderer] hasOverlayAlive=', !!window.electron?.overlayRendererAlive);
      window.electron?.overlayRendererAlive?.();
    } catch {
      // ignore
    }
  }, []);

  // ✅ UI 준비 핸드셰이크: 실제 React 커밋 이후에만 보내서 “빈/흰 화면” 순간을 차단
  useEffect(() => {
    let raf = 0;
    try {
      raf = requestAnimationFrame(() => {
        try {
          window.electron?.sendOverlayUiReady?.();
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
    return () => {
      try { cancelAnimationFrame(raf); } catch { /* ignore */ }
    };
  }, []);

  // overlay 상태 로드 + 기본 잠금 OFF(이동 가능)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // 기본 잠금 OFF로 강제(이동/조작 가능)
        await window.electron?.setOverlayLocked?.(false);
        if (!alive) return;
        const st = await window.electron?.getOverlayState?.();
        if (!alive) return;
        if (st) setLocked(!!st.locked);
      } catch {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <MusicProvider>
      <div className={`overlayRoot ${locked ? 'overlayLocked' : 'overlayUnlocked'}`}>
        <div className="overlayViewport">
          {/* React가 실제로 커밋되었음을 보장하는 마커(디버깅/검증용) */}
          <div id="overlay-ui-ready" style={{ display: 'none' }} />
          <Suspense fallback={null}>
            <AppMain />
          </Suspense>
        </div>
      </div>
    </MusicProvider>
  );
};

// Static imports for production build reliability (no lazy loading issues)
// const LazyAppMain = React.lazy(() => import('./AppMain'));
// const LazyDiaryManager = React.lazy(() => import('./components/DiaryManager'));

const App: React.FC = () => {
  const initial = (() => {
    const q = getWindowModeFromLocation();
    if (q) return q;
    // query가 비었는데 electron이면 IPC fallback 전까지 unknown으로 두어
    // note 창에서 AppMain이 잠깐이라도 렌더되는 플래시를 방지한다.
    if (typeof window !== 'undefined' && (window as any).electron) return 'unknown' as const;
    return 'app' as const;
  })();

  const [windowMode, setWindowMode] = useState<DetectedMode>(initial);

  // ✅ overlay 인식/URL 확정 로그(요구사항)
  useEffect(() => {
    try {
      console.log('[renderer] href=', window.location.href);
      console.log('[renderer] parsedWindowMode=', debugModeLabel(getWindowModeFromLocation()));
    } catch {
      // ignore
    }
  }, []);

  // mode class 적용: html/body/root 모두에 mode-app/mode-overlay 반영
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.classList.remove('mode-app', 'mode-note', 'mode-overlay', 'mode-unknown');
    body.classList.remove('mode-app', 'mode-note', 'mode-overlay', 'mode-unknown');

    if (windowMode === 'unknown') {
      html.classList.add('mode-unknown');
      body.classList.add('mode-unknown');
      return;
    }
    const cls = windowMode === 'overlay' ? 'mode-overlay' : 'mode-app';
    html.classList.add(cls);
    body.classList.add(cls);
  }, [windowMode]);

  // query 우선 + IPC fallback
  useEffect(() => {
    const q = getWindowModeFromLocation();
    if (q) {
      setWindowMode(q);
      console.log('[renderer] detected windowMode=', q, 'location=', window.location.href);
      return;
    }

    const api = window.electron as any;
    if (!api?.getWindowMode) {
      setWindowMode('app');
      console.log('[renderer] detected windowMode=', 'app', 'location=', window.location.href);
      return;
    }

    (async () => {
      try {
        const m = (await window.electron.getWindowMode()) as WindowMode;
        setWindowMode(m);
        console.log('[renderer] detected windowMode=', m, 'location=', window.location.href);
      } catch (e) {
        setWindowMode('app');
        console.log('[renderer] detected windowMode=', 'app', 'location=', window.location.href, 'fallbackError=', e);
      }
    })();
  }, []);

  // unknown일 때는 아무것도 렌더하지 않는다(노트 창에서 AppMain 플래시 금지)
  if (windowMode === 'unknown') return null;
  if (windowMode === 'overlay') return <OverlayModeView />;
  
  // 단일 다이어리 모드: app 모드도 AppMain 표시 (DiaryManager 제거)
  return (
    <>
      <UpdateNotification />
      <OverlayModeView />
    </>
  );
};

export default App;
