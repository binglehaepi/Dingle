/**
 * 다이어리 관리자 컴포넌트 - 서재 스타일
 * 
 * 여러 다이어리를 생성/선택/삭제할 수 있는 UI
 * 미니모드의 빈티지/아날로그 느낌과 조화
 */

import React, { useState, useEffect } from 'react';

/**
 * 북커버 패턴 스타일 생성
 */
function getCoverPatternStyle(pattern?: string, color?: string): string {
  const baseColor = color || '#ffc9d4';
  
  switch (pattern) {
    case 'dots':
      return `radial-gradient(circle, ${baseColor} 1.5px, transparent 1.5px)`;
    case 'stripes':
      return `repeating-linear-gradient(45deg, transparent, transparent 10px, ${baseColor} 10px, ${baseColor} 11px)`;
    case 'grid':
      return `repeating-linear-gradient(0deg, ${baseColor} 0px, ${baseColor} 1px, transparent 1px, transparent 15px),
              repeating-linear-gradient(90deg, ${baseColor} 0px, ${baseColor} 1px, transparent 1px, transparent 15px)`;
    case 'vintage':
      return `repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.03) 3px)`;
    case 'solid':
    default:
      return 'none';
  }
}

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

const DiaryManager: React.FC = () => {
  const [diaries, setDiaries] = useState<DiaryMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDiaryName, setNewDiaryName] = useState('');
  const [newDiaryColor, setNewDiaryColor] = useState('#ffc9d4');
  const [newDiaryCoverPattern, setNewDiaryCoverPattern] = useState<'solid' | 'dots' | 'stripes' | 'grid' | 'vintage'>('solid');

  // 다이어리 목록 로드
  useEffect(() => {
    loadDiaries();
  }, []);

  const loadDiaries = async () => {
    if (!window.electron) return;
    
    setLoading(true);
    try {
      const result = await window.electron.diaryList();
      if (result.success) {
        setDiaries(result.diaries);
      }
    } catch (error) {
      console.error('Failed to load diaries:', error);
    } finally {
      setLoading(false);
    }
  };

  // 새 다이어리 생성
  const handleCreate = async () => {
    console.log('[DiaryManager] handleCreate called', { 
      hasElectron: !!window.electron, 
      name: newDiaryName, 
      trimmed: newDiaryName.trim() 
    });
    
    if (!window.electron || !newDiaryName.trim()) {
      console.log('[DiaryManager] Create blocked - no electron or empty name');
      return;
    }

    try {
      console.log('[DiaryManager] Creating diary...');
      const result = await window.electron.diaryCreate(newDiaryName.trim(), newDiaryColor, newDiaryCoverPattern);
      console.log('[DiaryManager] Create result:', result);
      
      if (result.success) {
        await loadDiaries();
        setShowCreateDialog(false);
        setNewDiaryName('');
        setNewDiaryColor('#ffc9d4');
        setNewDiaryCoverPattern('solid');
      }
    } catch (error) {
      console.error('Failed to create diary:', error);
    }
  };

  // 다이어리 열기
  const handleOpen = async (diaryId: string) => {
    if (!window.electron) return;

    try {
      const result = await window.electron.diaryOpenInOverlay(diaryId);
      if (result.success) {
        console.log('Diary opened in overlay:', diaryId);
      }
    } catch (error) {
      console.error('Failed to open diary:', error);
    }
  };

  // 다이어리 삭제
  const handleDelete = async (diaryId: string, diaryName: string) => {
    if (!window.electron) return;

    const confirmed = confirm(`"${diaryName}" 다이어리를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    try {
      const result = await window.electron.diaryDelete(diaryId);
      if (result.success) {
        await loadDiaries();
      }
    } catch (error) {
      console.error('Failed to delete diary:', error);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f7f4',
        fontFamily: "'Nanum Gothic', sans-serif",
      }}>
        <div style={{ fontSize: '18px', color: '#9a8a7a' }}>📚 서재를 열고 있습니다...</div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f9f7f4',
      overflow: 'auto',
      fontFamily: "'Nanum Gothic', sans-serif",
      border: '1px solid #8a7a6a',
      boxSizing: 'border-box',
    }}>
      {/* 커스텀 윈도우 컨트롤 */}
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        display: 'flex',
        gap: '8px',
        zIndex: 1000,
        WebkitAppRegion: 'no-drag',
      } as React.CSSProperties}>
        <button
          onClick={() => window.electron?.minimize?.()}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#5a4a42',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(90, 74, 66, 0.1)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ─
        </button>
        <button
          onClick={() => window.electron?.close?.()}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#5a4a42',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(90, 74, 66, 0.1)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffebee';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ✕
        </button>
      </div>

      {/* 헤더 */}
      <div style={{
        padding: '60px 40px 40px',
        backgroundColor: '#f9f7f4',
        textAlign: 'center',
        borderBottom: '2px solid #e8e4dd',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
        }}>📚</div>
        <h1 style={{
          margin: 0,
          fontSize: '36px',
          fontFamily: "'Nanum Myeongjo', Georgia, serif",
          fontWeight: '600',
          color: '#5a4a42',
          letterSpacing: '2px',
        }}>
          My Scrap Library
        </h1>
        <p style={{
          margin: '12px 0 0 0',
          fontSize: '16px',
          color: '#9a8a7a',
          fontFamily: "'Nanum Gothic', sans-serif",
        }}>
          나만의 다이어리 서재
        </p>
      </div>

      {/* 컨텐츠 */}
      <div style={{
        padding: '40px',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* 다이어리 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '32px',
        }}>
          {/* 새 다이어리 카드 */}
          <div
            onClick={() => {
              console.log('[DiaryManager] New diary card clicked');
              setShowCreateDialog(true);
            }}
            style={{
              backgroundColor: '#fefdfb',
              borderRadius: '16px',
              padding: '32px 24px',
              border: '3px dashed #d4c4b4',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: '1 / 1.414',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 12px rgba(90, 74, 66, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(90, 74, 66, 0.12)';
              e.currentTarget.style.borderColor = '#b4a494';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(90, 74, 66, 0.05)';
              e.currentTarget.style.borderColor = '#d4c4b4';
            }}
          >
            <div style={{ fontSize: '72px', marginBottom: '16px' }}>➕</div>
            <p style={{
              fontFamily: "'Nanum Myeongjo', serif",
              fontSize: '20px',
              color: '#9a8a7a',
              margin: 0,
            }}>
              새 다이어리
            </p>
          </div>

          {/* 기존 다이어리 카드들 */}
          {diaries.map((diary) => (
            <div
              key={diary.id}
              onClick={() => handleOpen(diary.id)}
              style={{
                backgroundColor: diary.color + '20',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '32px 24px',
                boxShadow: '0 4px 20px rgba(90, 74, 66, 0.1)',
                border: `2px solid ${diary.color}60`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                aspectRatio: '1 / 1.414',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(90, 74, 66, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(90, 74, 66, 0.1)';
              }}
            >
              {/* 북커버 패턴 */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: getCoverPatternStyle(diary.coverPattern, diary.color),
                backgroundSize: diary.coverPattern === 'dots' ? '12px 12px' : 'auto',
                opacity: 0.3,
                pointerEvents: 'none',
              }} />
              
              {/* 책 아이콘 + 키링 */}
              <div style={{
                fontSize: '64px',
                textAlign: 'center',
                marginBottom: '16px',
                position: 'relative',
              }}>
                📖
                {/* 키링 미리보기 */}
                {diary.keyring && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '-12px',
                    fontSize: '28px',
                    transform: 'rotate(-15deg)',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  }}>
                    {diary.keyring}
                  </div>
                )}
              </div>
              
              {/* 다이어리 이름 */}
              <h3 style={{
                fontFamily: "'Nanum Myeongjo', serif",
                fontSize: '22px',
                color: '#5a4a42',
                textAlign: 'center',
                margin: '0 0 12px 0',
                fontWeight: '600',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}>
                {diary.name}
              </h3>
              
              {/* 날짜 */}
              <p style={{
                fontSize: '14px',
                color: '#9a8a7a',
                textAlign: 'center',
                margin: '0 0 20px 0',
                position: 'relative',
              }}>
                {formatDate(diary.modified)}
              </p>

              {/* 삭제 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(diary.id, diary.name);
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  color: '#c97a7a',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid #e8c4c4',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  width: '100%',
                  fontFamily: "'Nanum Gothic', sans-serif",
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffe8e8';
                  e.currentTarget.style.borderColor = '#c97a7a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.borderColor = '#e8c4c4';
                }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>

        {/* 빈 상태 */}
        {diaries.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 40px',
            color: '#b4a494',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '24px', opacity: 0.5 }}>📖</div>
            <p style={{ 
              fontSize: '18px', 
              margin: '0 0 8px 0',
              fontFamily: "'Nanum Myeongjo', serif",
            }}>
              아직 다이어리가 없습니다
            </p>
            <p style={{ 
              fontSize: '14px', 
              margin: 0,
              color: '#c4b4a4',
            }}>
              새 다이어리를 만들어 시작해보세요
            </p>
          </div>
        )}
      </div>

      {/* 생성 다이얼로그 */}
      {showCreateDialog && (
        <div 
          onClick={(e) => {
            // 배경 클릭 시에만 닫기 (다이얼로그 내부 클릭은 무시)
            if (e.target === e.currentTarget) {
              console.log('[DiaryManager] Dialog background clicked, closing');
              setShowCreateDialog(false);
            }
          }}
          style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(90, 74, 66, 0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: '#fefdfb',
            borderRadius: '20px',
            padding: '40px',
            width: '440px',
            maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(90, 74, 66, 0.3)',
            border: '2px solid #e8e4dd',
          }}>
            <h2 style={{
              margin: '0 0 32px 0',
              fontSize: '28px',
              fontFamily: "'Nanum Myeongjo', serif",
              fontWeight: '600',
              color: '#5a4a42',
              textAlign: 'center',
            }}>
              새 다이어리 만들기
            </h2>

            {/* 이름 입력 */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#7a6a5a',
                fontFamily: "'Nanum Gothic', sans-serif",
              }}>
                다이어리 이름
              </label>
              <input
                type="text"
                value={newDiaryName}
                onChange={(e) => {
                  console.log('[DiaryManager] Input changed:', e.target.value);
                  setNewDiaryName(e.target.value);
                }}
                onKeyDown={(e) => {
                  console.log('[DiaryManager] Key down:', e.key);
                  if (e.key === 'Enter' && newDiaryName.trim()) {
                    handleCreate();
                  }
                }}
                placeholder="예: 일상 다이어리"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '2px solid #e8e4dd',
                  borderRadius: '12px',
                  boxSizing: 'border-box',
                  fontFamily: "'Nanum Gothic', sans-serif",
                  backgroundColor: '#fff',
                  color: '#5a4a42',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#d4c4b4';
                  e.currentTarget.style.backgroundColor = '#fefdfb';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e8e4dd';
                  e.currentTarget.style.backgroundColor = '#fff';
                }}
                autoFocus
              />
            </div>

            {/* 색상 선택 */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#7a6a5a',
                fontFamily: "'Nanum Gothic', sans-serif",
              }}>
                커버 색상
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['#ffc9d4', '#d4e4fc', '#d4eec9', '#fff4c9', '#e8d4fc', '#fce4d4', '#d4fcf4', '#f4d4d4'].map((color) => (
                  <div
                    key={color}
                    onClick={() => setNewDiaryColor(color)}
                    style={{
                      width: '52px',
                      height: '52px',
                      backgroundColor: color,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: newDiaryColor === color ? '3px solid #5a4a42' : '2px solid #e8e4dd',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s',
                      boxShadow: newDiaryColor === color ? '0 4px 12px rgba(90, 74, 66, 0.2)' : '0 2px 6px rgba(90, 74, 66, 0.08)',
                    }}
                    onMouseEnter={(e) => {
                      if (newDiaryColor !== color) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.borderColor = '#d4c4b4';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      if (newDiaryColor !== color) {
                        e.currentTarget.style.borderColor = '#e8e4dd';
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 패턴 선택 */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#7a6a5a',
                fontFamily: "'Nanum Gothic', sans-serif",
              }}>
                커버 패턴
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { id: 'solid', label: '단색', icon: '▪️' },
                  { id: 'dots', label: '도트', icon: '•••' },
                  { id: 'stripes', label: '줄무늬', icon: '|||' },
                  { id: 'grid', label: '격자', icon: '⊞' },
                  { id: 'vintage', label: '빈티지', icon: '✦' },
                ].map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => setNewDiaryCoverPattern(pattern.id as any)}
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: newDiaryCoverPattern === pattern.id ? '2px solid #5a4a42' : '1px solid #e8e4dd',
                      borderRadius: '8px',
                      backgroundColor: newDiaryCoverPattern === pattern.id ? '#f5f3f0' : '#fff',
                      cursor: 'pointer',
                      fontFamily: "'Nanum Gothic', sans-serif",
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (newDiaryCoverPattern !== pattern.id) {
                        e.currentTarget.style.backgroundColor = '#faf9f7';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (newDiaryCoverPattern !== pattern.id) {
                        e.currentTarget.style.backgroundColor = '#fff';
                      }
                    }}
                  >
                    {pattern.icon} {pattern.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewDiaryName('');
                  setNewDiaryColor('#ffc9d4');
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '16px',
                  color: '#7a6a5a',
                  backgroundColor: '#f5f3f0',
                  border: '2px solid #e8e4dd',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontFamily: "'Nanum Gothic', sans-serif",
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e8e4dd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f3f0';
                }}
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={!newDiaryName.trim()}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#fff',
                  backgroundColor: newDiaryName.trim() ? '#9a8a7a' : '#d4c4b4',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: newDiaryName.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: "'Nanum Gothic', sans-serif",
                  transition: 'all 0.2s',
                  boxShadow: newDiaryName.trim() ? '0 4px 12px rgba(154, 138, 122, 0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (newDiaryName.trim()) {
                    e.currentTarget.style.backgroundColor = '#8a7a6a';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(154, 138, 122, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = newDiaryName.trim() ? '#9a8a7a' : '#d4c4b4';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = newDiaryName.trim() ? '0 4px 12px rgba(154, 138, 122, 0.3)' : 'none';
                }}
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 폰트 import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&family=Nanum+Gothic:wght@400;700&display=swap');
      `}</style>
    </div>
  );
};

export default DiaryManager;
