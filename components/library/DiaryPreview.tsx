/**
 * 다이어리 프리뷰 컴포넌트 - 읽기 전용 미리보기
 */

import React, { useState, useEffect } from 'react';
import { ScrapItem } from '../../types';
import AppMain from '../../AppMain';
import { MusicProvider } from '../../music/MusicStore';

interface DiaryPreviewProps {
  diaryId: string | null;
  onOpen: (diaryId: string) => void;
}

const DiaryPreview: React.FC<DiaryPreviewProps> = ({ diaryId, onOpen }) => {
  // ✅ 모든 hooks를 최상단에 선언 (조건부 return 전에)
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1.0); // 동적 scale 계산 (책 형태 고정 레이아웃)
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 다이어리 데이터 로드
  useEffect(() => {
    if (!diaryId) {
      setPreviewData(null);
      return;
    }

    console.log('[DiaryPreview] Loading preview for diary:', diaryId);

    const loadPreview = async () => {
      console.log('[DiaryPreview] Starting load...', { 
        diaryId, 
        hasElectron: !!window.electron,
        hasDiaryLoad: !!(window.electron?.diaryLoad)
      });
      
      if (!window.electron) {
        console.error('[DiaryPreview] ❌ window.electron not available');
        alert('❌ [DiaryPreview] Electron API를 사용할 수 없습니다.\n\n앱을 재시작해주세요.');
        return;
      }
      
      if (!window.electron.diaryLoad) {
        console.error('[DiaryPreview] ❌ window.electron.diaryLoad not available');
        alert('❌ [DiaryPreview] diaryLoad API를 사용할 수 없습니다.\n\npreload 스크립트가 제대로 로드되지 않았을 수 있습니다.');
        return;
      }
      
      setLoading(true);
      setPreviewData(null); // ✅ 이전 데이터 즉시 초기화 (깜빡임 방지)
      
      try {
        console.log('[DiaryPreview] Calling window.electron.diaryLoad...');
        const result = await window.electron.diaryLoad(diaryId);
        console.log('[DiaryPreview] Load result:', {
          success: result.success,
          itemCount: result.data?.items?.length || 0,
          hasStylePref: !!result.data?.stylePref,
          hasTextData: !!result.data?.textData,
          hasLinkDock: !!result.data?.linkDockItems,
          diaryId: diaryId
        });
        
        if (result.success && result.data) {
          console.log('[DiaryPreview] ✅ Data loaded successfully:', {
            items: result.data.items?.length || 0,
            style: result.data.stylePref ? 'present' : 'missing'
          });
          setPreviewData(result.data);
        } else {
          console.error('[DiaryPreview] ❌ Load failed:', result.error);
          alert(`❌ [DiaryPreview] 다이어리 로드 실패:\n\n${result.error || '알 수 없는 오류'}`);
        }
      } catch (error) {
        console.error('[DiaryPreview] ❌ Exception:', error);
        alert(`❌ [DiaryPreview] 오류 발생:\n\n${String(error)}\n\n개발자 도구(F12)를 열어 자세한 정보를 확인하세요.`);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [diaryId]);

  // 하나의 이미지처럼 비율 유지하며 전체 확대/축소
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // 고정 비율 (1400:860)
      const fixedWidth = 1400;
      const fixedHeight = 860;
      
      // ✅ padding(40px)을 고려한 실제 사용 가능 영역
      const availableWidth = containerWidth - 80; // 좌우 40px씩
      const availableHeight = containerHeight - 80; // 상하 40px씩
      
      // 비율을 유지하면서 컨테이너에 맞춤 (스크롤 없이 전체가 보이도록)
      const scaleX = availableWidth / fixedWidth;
      const scaleY = availableHeight / fixedHeight;
      const newScale = Math.min(scaleX, scaleY, 1.0); // 둘 중 작은 값 (최대 1.0)
      
      setScale(newScale);
    };
    
    const timer = setTimeout(updateScale, 100);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [diaryId]);

  // 선택된 다이어리 없음
  if (!diaryId) {
    return (
      <div style={{
        flex: 1,
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f7f4',
        fontFamily: "'Nanum Gothic', sans-serif",
      }}>
        <div style={{
          textAlign: 'center',
          color: '#b4a494',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.3 }}>📖</div>
          <p style={{ 
            fontSize: '18px', 
            margin: 0,
            fontFamily: "'Nanum Myeongjo', serif",
          }}>
            다이어리를 선택하세요
          </p>
        </div>
      </div>
    );
  }

  // 로딩 중
  if (loading) {
    console.log('[DiaryPreview] Loading state visible');
    return (
      <div style={{
        flex: 1,
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f7f4',
        fontFamily: "'Nanum Gothic', sans-serif",
      }}>
        <div style={{
          textAlign: 'center',
          color: '#9a8a7a',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '16px', margin: 0 }}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  // ✅ 데이터 로드 실패 또는 비어있음
  if (!previewData) {
    console.log('[DiaryPreview] No preview data available');
    return (
      <div style={{
        flex: 1,
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff3cd',
        fontFamily: "'Nanum Gothic', sans-serif",
        padding: '40px',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '600px',
          padding: '40px',
          backgroundColor: 'white',
          border: '3px dashed #ff6b6b',
          borderRadius: '16px',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
          <h2 style={{ 
            fontSize: '24px', 
            margin: '0 0 16px 0',
            fontFamily: "'Nanum Myeongjo', serif",
            color: '#d63031',
          }}>
            프리뷰 로드 실패
          </h2>
          <p style={{ 
            fontSize: '16px', 
            margin: '0 0 20px 0',
            color: '#636e72',
            lineHeight: '1.6',
          }}>
            다이어리 데이터를 불러올 수 없습니다.<br />
            파일이 손상되었거나 아직 저장되지 않았을 수 있습니다.
          </p>
          <pre style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'left',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '200px',
          }}>
            {JSON.stringify({ 
              diaryId, 
              hasElectron: !!window.electron,
              timestamp: new Date().toISOString(),
            }, null, 2)}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            🔄 새로고침
          </button>
        </div>
      </div>
    );
  }

  console.log('[DiaryPreview] Rendering preview with data:', {
    itemCount: previewData.items?.length,
    hasStyle: !!previewData.stylePref,
  });

  // 프리뷰 표시
  return (
    <div style={{
      flex: 1,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f9f7f4',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* 상단 드래그 바 (투명) - 제거: 프리뷰와 겹침 */}
      
      {/* 프리뷰 영역 - 스크롤 없이 중앙 정렬 */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px', // ✅ 가로/세로 여백 추가
          overflow: 'hidden', // ✅ 스크롤 금지
        }}>
        <div style={{
          width: '1400px',     // 고정 크기
          height: '860px',     // 고정 크기
          transform: `scale(${scale})`,
          transformOrigin: 'center', // ✅ 중앙 기준 확대/축소
          boxShadow: '0 20px 60px rgba(90, 74, 66, 0.15)',
          borderRadius: '12px',
          border: '1px solid #e8e4dd',
          backgroundColor: '#fff',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          // ✅ 선명도 개선
          imageRendering: 'crisp-edges',
          WebkitFontSmoothing: 'antialiased',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        }}>
          {/* 프리뷰 내용 - AppMain 직접 렌더링 */}
          <div style={{
            width: '100%',
            height: '100%',
            overflow: 'auto', // 스크롤 허용으로 잘림 방지
            backgroundColor: '#f5f3f0',
            pointerEvents: 'none', // 프리뷰는 읽기 전용
          }}>
            {previewData && diaryId ? (
              <MusicProvider key={diaryId}>
                <AppMain key={diaryId} />
              </MusicProvider>
            ) : (
              <div style={{ 
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#b4a494',
              }}>
                <p>프리뷰를 불러올 수 없습니다</p>
              </div>
            )}
          </div>

          {/* 오버레이: "열기" 버튼 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(249, 247, 244, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s',
            pointerEvents: 'none',
          }}
          className="preview-overlay"
          >
            <button
              onClick={() => onOpen(diaryId)}
              style={{
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: '600',
                color: '#fff',
                backgroundColor: '#9a8a7a',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: "'Nanum Gothic', sans-serif",
                boxShadow: '0 6px 20px rgba(154, 138, 122, 0.4)',
                transition: 'all 0.2s',
                pointerEvents: 'auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#8a7a6a';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(154, 138, 122, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#9a8a7a';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(154, 138, 122, 0.4)';
              }}
            >
              📖 다이어리 열기
            </button>
          </div>
        </div>
      </div>

      {/* 스타일: 호버 시 오버레이 표시 */}
      <style>{`
        .preview-overlay:hover {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default DiaryPreview;
