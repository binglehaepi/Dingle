/**
 * 사이드바 컴포넌트 - 다이어리 목록 + 관리 기능
 */

import React, { useEffect, useRef } from 'react';

interface DiaryMetadata {
  id: string;
  name: string;
  created: string;
  modified: string;
  color: string;
  thumbnail?: string;
  coverPattern?: 'solid' | 'dots' | 'stripes' | 'grid' | 'vintage';
  coverTexture?: 'smooth' | 'paper' | 'leather';
  keyring?: string;
}

interface SidebarProps {
  width: number;
  diaries: DiaryMetadata[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string, name: string) => void;
  onMinimize: () => void;
  onClose: () => void;
  onExportHTML?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  width,
  diaries,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onMinimize,
  onClose,
  onExportHTML,
}) => {
  const dragHeaderRef = useRef<HTMLDivElement>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = React.useState(false);
  
  // ✅ Electron 드래그 영역을 DOM에 직접 설정 (백업용 - CSS fallback)
  useEffect(() => {
    if (dragHeaderRef.current) {
      (dragHeaderRef.current.style as any)['-webkit-app-region'] = 'drag';
    }
    
    if (buttonContainerRef.current) {
      (buttonContainerRef.current.style as any)['-webkit-app-region'] = 'no-drag';
    }
  }, []);
  
  // ✅ 수동 드래그 구현 (Windows frameless 대응)
  useEffect(() => {
    if (!window.electron) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDown) {
        window.electron.dragMove(e.screenX, e.screenY);
      }
    };
    
    const handleMouseUp = () => {
      if (isMouseDown) {
        setIsMouseDown(false);
        window.electron.dragEnd();
      }
    };
    
    if (isMouseDown) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isMouseDown]);
  
  const handleMinimize = async () => {
    console.log('[Sidebar] Minimize clicked');
    console.log('[Sidebar] window.electron exists:', !!window.electron);
    console.log('[Sidebar] window.electron.minimize exists:', !!window.electron?.minimize);
    
    if (!window.electron?.minimize) {
      console.error('[Sidebar] minimize function not available');
      alert('윈도우 최소화 기능을 사용할 수 없습니다. 콘솔을 확인하세요.');
      return;
    }
    
    try {
      console.log('[Sidebar] Calling minimize...');
      const result = await window.electron.minimize();
      console.log('[Sidebar] Minimize result:', result);
      onMinimize();
    } catch (error) {
      console.error('[Sidebar] Minimize error:', error);
      alert(`최소화 실패: ${error}`);
    }
  };

  const handleClose = async () => {
    console.log('[Sidebar] Close clicked');
    console.log('[Sidebar] window.electron exists:', !!window.electron);
    console.log('[Sidebar] window.electron.close exists:', !!window.electron?.close);
    
    if (!window.electron?.close) {
      console.error('[Sidebar] close function not available');
      alert('윈도우 닫기 기능을 사용할 수 없습니다. 콘솔을 확인하세요.');
      return;
    }
    
    try {
      console.log('[Sidebar] Calling close...');
      const result = await window.electron.close();
      console.log('[Sidebar] Close result:', result);
      onClose();
    } catch (error) {
      console.error('[Sidebar] Close error:', error);
      alert(`닫기 실패: ${error}`);
    }
  };

  return (
    <div style={{
      width: `${width}px`,
      height: '100vh',
      backgroundColor: '#f9f7f4',
      borderRight: '1px solid #e8e4dd',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Nanum Gothic', sans-serif",
    }}>
      {/* 헤더 - 드래그 가능 영역 */}
      <div 
        ref={dragHeaderRef}
        onMouseDown={(e) => {
          // ✅ 수동 드래그 시작
          if (window.electron && window.electron.dragStart) {
            e.preventDefault();
            setIsMouseDown(true);
            window.electron.dragStart(e.screenX, e.screenY);
          }
        }}
        className="sidebar-drag-header"
        style={{
          padding: '16px',
          borderBottom: '1px solid #e8e4dd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9f7f4',
          cursor: 'move',
          userSelect: 'none',
        }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontFamily: "'Nanum Myeongjo', serif",
          fontWeight: '600',
          color: '#5a4a42',
        }}>
          DINGLE
        </h2>
        <div 
          ref={buttonContainerRef}
          style={{
            display: 'flex',
            gap: '8px',
          }}>
          <button
            onClick={handleMinimize}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#5a4a42',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            }}
          >
            ─
          </button>
          <button
            onClick={handleClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#5a4a42',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffebee';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* 다이어리 목록 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 12px',
      }}>
        {/* Diaries 섹션 헤더 */}
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#9a8a7a',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          paddingLeft: '4px',
        }}>
          Diaries
        </div>

        {/* 새 다이어리 버튼 */}
        <button
          onClick={onCreate}
          style={{
            width: '100%',
            padding: '10px 12px',
            marginBottom: '16px',
            border: '1px solid #e8e4dd',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#7a6a5a',
            fontFamily: "'Nanum Gothic', sans-serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#faf9f7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span style={{ fontSize: '16px' }}>➕</span>
          New Diary
        </button>

        {/* 다이어리 리스트 */}
        {diaries.map((diary) => (
          <div
            key={diary.id}
            onClick={() => onSelect(diary.id)}
            style={{
              padding: '10px 12px',
              marginBottom: '4px',
              borderRadius: '6px',
              backgroundColor: selectedId === diary.id ? '#f5f3f0' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
            onMouseEnter={(e) => {
              if (selectedId !== diary.id) {
                e.currentTarget.style.backgroundColor = '#faf9f7';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedId !== diary.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {/* 키링 */}
            {diary.keyring && (
              <div style={{
                fontSize: '20px',
                flexShrink: 0,
              }}>
                {diary.keyring}
              </div>
            )}
            
            {/* 색상 인디케이터 */}
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: diary.color,
              flexShrink: 0,
            }} />
            
            {/* 다이어리 이름 */}
            <div style={{
              flex: 1,
              overflow: 'hidden',
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: selectedId === diary.id ? '600' : '400',
                color: '#5a4a42',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {diary.name}
              </div>
            </div>

            {/* 삭제 버튼 */}
            {selectedId === diary.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(diary.id, diary.name);
                }}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#c97a7a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffe8e8';
                  e.currentTarget.style.borderRadius = '4px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                🗑️
              </button>
            )}
          </div>
        ))}

        {/* 빈 상태 */}
        {diaries.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#b4a494',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>📖</div>
            <p style={{ 
              fontSize: '14px', 
              margin: 0,
              fontFamily: "'Nanum Myeongjo', serif",
            }}>
              아직 다이어리가 없습니다
            </p>
          </div>
        )}
      </div>

      {/* Tools 섹션 */}
      {onExportHTML && (
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid #e8e4dd',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#9a8a7a',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            paddingLeft: '4px',
          }}>
            Tools
          </div>
          
          {/* HTML 공유하기 */}
          <button
            onClick={onExportHTML}
            disabled={!selectedId}
            style={{
              width: '100%',
              padding: '10px 12px',
              marginBottom: '8px',
              border: '1px solid #e8e4dd',
              borderRadius: '6px',
              backgroundColor: selectedId ? 'transparent' : '#f5f5f5',
              cursor: selectedId ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              color: selectedId ? '#5a4a42' : '#b4a494',
              fontFamily: "'Nanum Gothic', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedId) {
                e.currentTarget.style.backgroundColor = '#faf9f7';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedId) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span>📤</span>
            HTML로 공유하기
          </button>
        </div>
      )}

      {/* 폰트 import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&family=Nanum+Gothic:wght@400;700&display=swap');
      `}</style>
    </div>
  );
};

export default Sidebar;

