/**
 * 다이어리 관리자 컴포넌트 v2 - 노션 스타일 레이아웃
 * 
 * 사이드바 + 프리뷰 영역으로 구성된 전문적인 UI
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './library/Sidebar';
import Resizer from './library/Resizer';
import DiaryPreview from './library/DiaryPreview';
import ExportHTMLDialog, { StaticHTMLExportOptions } from './library/ExportHTMLDialog';

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
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  
  // 생성 다이얼로그 state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDiaryName, setNewDiaryName] = useState('');
  const [newDiaryColor, setNewDiaryColor] = useState('#ffc9d4');
  const [newDiaryCoverPattern, setNewDiaryCoverPattern] = useState<'solid' | 'dots' | 'stripes' | 'grid' | 'vintage'>('solid');
  
  // Export 다이얼로그 state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; status: string } | null>(null);

  // 다이어리 목록 로드
  useEffect(() => {
    loadDiaries();
    
    // Export 진행도 리스너 등록
    if (window.electron) {
      const handleProgress = (_event: any, data: { current: number; total: number; status: string }) => {
        setExportProgress(data);
      };
      
      // @ts-ignore - ipcRenderer.on이 있다고 가정
      window.electron.on?.('export:progress', handleProgress);
      
      return () => {
        // @ts-ignore
        window.electron.off?.('export:progress', handleProgress);
      };
    }
  }, []);

  const loadDiaries = async () => {
    if (!window.electron) return;
    
    setLoading(true);
    try {
      const result = await window.electron.diaryList();
      if (result.success) {
        setDiaries(result.diaries);
        // 첫 번째 다이어리 자동 선택
        if (result.diaries.length > 0 && !selectedDiaryId) {
          setSelectedDiaryId(result.diaries[0].id);
        }
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
    
    if (!window.electron) {
      alert('❌ Electron API를 사용할 수 없습니다.');
      return;
    }
    
    if (!newDiaryName.trim()) {
      alert('❌ 다이어리 이름을 입력해주세요.');
      return;
    }

    try {
      console.log('[DiaryManager] Creating diary...');
      const result = await window.electron.diaryCreate(newDiaryName.trim(), newDiaryColor, newDiaryCoverPattern);
      console.log('[DiaryManager] Create result:', result);
      
      if (result.success) {
        console.log('[DiaryManager] ✅ Diary created successfully');
        await loadDiaries();
        setShowCreateDialog(false);
        setNewDiaryName('');
        setNewDiaryColor('#ffc9d4');
        setNewDiaryCoverPattern('solid');
        
        // 새로 생성된 다이어리 선택
        if (result.diaryId) {
          setSelectedDiaryId(result.diaryId);
        }
      } else {
        console.error('[DiaryManager] ❌ Create failed:', result.error);
        alert(`❌ 다이어리 생성 실패:\n\n${result.error}`);
      }
    } catch (error) {
      console.error('[DiaryManager] ❌ Exception during create:', error);
      alert(`❌ 다이어리 생성 중 오류 발생:\n\n${error}`);
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
        // 삭제된 다이어리가 선택되어 있었다면 선택 해제
        if (selectedDiaryId === diaryId) {
          setSelectedDiaryId(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete diary:', error);
    }
  };

  // 다이어리 열기 (overlay 모드로 전환)
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

  // 윈도우 컨트롤
  const handleMinimize = async () => {
    if (!window.electron?.minimize) return;
    try {
      await window.electron.minimize();
    } catch (error) {
      console.error('Failed to minimize:', error);
    }
  };

  const handleClose = async () => {
    if (!window.electron?.close) return;
    try {
      await window.electron.close();
    } catch (error) {
      console.error('Failed to close:', error);
    }
  };

  // HTML Export (Static)
  const handleExportHTML = async (options: { includeMonthlyCover: boolean; includeEmbeds: boolean }) => {
    console.log('[DiaryManager] handleExportHTML called', { 
      options, 
      selectedDiaryId,
      hasElectron: !!window.electron 
    });
    
    if (!window.electron || !window.electron.diaryExportToStaticHTML) {
      alert('❌ Electron API를 사용할 수 없습니다.');
      return;
    }
    
    if (!selectedDiaryId) {
      alert('❌ 선택된 다이어리가 없습니다.');
      return;
    }

    try {
      // 다이어리 이름 가져오기
      const selectedDiary = diaries.find(d => d.id === selectedDiaryId);
      const diaryName = selectedDiary?.name || '다이어리';
      console.log('[DiaryManager] Starting HTML export for:', diaryName);

      // 정적 HTML 생성 (IPC를 통해 Main Process에서 처리)
      console.log('[DiaryManager] Calling diaryExportToStaticHTML...');
      const exportResult = await window.electron.diaryExportToStaticHTML(selectedDiaryId, {
        includeMonthlyCover: options.includeMonthlyCover,
        includeEmbeds: options.includeEmbeds
      });

      if (!exportResult.success || !exportResult.html) {
        alert(`❌ HTML 생성 실패:\n\n${exportResult.error || 'Unknown error'}`);
        return;
      }

      console.log('[DiaryManager] HTML generated successfully, length:', exportResult.html.length);

      // 파일 저장 다이얼로그
      console.log('[DiaryManager] Opening save dialog...');
      const saveResult = await window.electron.saveDialog({
        title: 'HTML로 저장',
        defaultPath: `${diaryName}.html`,
        filters: [
          { name: 'HTML Files', extensions: ['html'] }
        ]
      });

      if (saveResult.canceled || !saveResult.filePath) {
        console.log('[DiaryManager] User canceled save dialog');
        return;
      }

      // 파일 저장
      console.log('[DiaryManager] Writing file to:', saveResult.filePath);
      const writeResult = await window.electron.writeFile(saveResult.filePath, exportResult.html);
      
      if (writeResult.success) {
        console.log('[DiaryManager] ✅ HTML export successful');
        alert(`✅ HTML 파일이 저장되었습니다!\n\n${saveResult.filePath}`);
        setShowExportDialog(false);
      } else {
        console.error('[DiaryManager] ❌ Write failed:', writeResult.error);
        alert(`❌ 파일 저장 실패:\n\n${writeResult.error}`);
      }
    } catch (error) {
      console.error('[DiaryManager] ❌ Export exception:', error);
      alert(`❌ HTML 내보내기 실패:\n\n${error}`);
    }
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
        border: '1px solid #8a7a6a',
        boxSizing: 'border-box',
      }}>
        <div style={{ fontSize: '18px', color: '#9a8a7a' }}>📚 서재를 열고 있습니다...</div>
      </div>
    );
  }

  return (
    <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #8a7a6a',
        boxSizing: 'border-box',
        position: 'relative',
      }}>
        {/* 투명 드래그 바 제거 - Sidebar의 drag region과 충돌 */}
        {/* Sidebar 헤더와 프리뷰 영역 상단에서 각각 드래그 가능 */}
        
        {/* 메인 컨텐츠 */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* 사이드바 */}
        <div data-sidebar>
          <Sidebar
            width={sidebarWidth}
            diaries={diaries}
            selectedId={selectedDiaryId}
            onSelect={setSelectedDiaryId}
            onCreate={() => setShowCreateDialog(true)}
            onDelete={handleDelete}
            onMinimize={handleMinimize}
            onClose={handleClose}
            onExportHTML={() => setShowExportDialog(true)}
          />
        </div>

        {/* 리사이저 */}
        <Resizer
          onResize={setSidebarWidth}
          minWidth={200}
          maxWidth={500}
        />

        {/* 프리뷰 영역 */}
        <DiaryPreview
          diaryId={selectedDiaryId}
          onOpen={handleOpen}
        />
      </div> {/* 메인 컨텐츠 끝 */}

      {/* 생성 다이얼로그 */}
      {showCreateDialog && (
        <div 
          onClick={(e) => {
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
            zIndex: 3000,
          }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
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
                autoFocus
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
              />
            </div>

            {/* 버튼 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewDiaryName('');
                  setNewDiaryColor('#ffc9d4');
                  setNewDiaryCoverPattern('solid');
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

      {/* Export 다이얼로그 */}
      {showExportDialog && selectedDiaryId && (
        <ExportHTMLDialog
          isOpen={showExportDialog}
          diaryId={selectedDiaryId}
          diaryName={diaries.find(d => d.id === selectedDiaryId)?.name || '다이어리'}
          onClose={() => setShowExportDialog(false)}
          onExport={handleExportHTML}
        />
      )}
    </div>
  );
};

export default DiaryManager;
