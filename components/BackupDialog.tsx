import React, { useState } from 'react';
import { ScrapItem, LayoutTextData, DiaryStyle, LinkDockItem } from '../types';
import { exportToJSON, importFromJSON, restoreBackup, getBackupInfo, checkLocalStorageHealth } from '../services/backup';

interface BackupDialogProps {
  onClose: () => void;
  items: ScrapItem[];
  textData: LayoutTextData;
  diaryStyle: DiaryStyle;
  linkDockItems: LinkDockItem[];
  setItems: React.Dispatch<React.SetStateAction<ScrapItem[]>>;
  setTextData: React.Dispatch<React.SetStateAction<LayoutTextData>>;
  setDiaryStyle: React.Dispatch<React.SetStateAction<DiaryStyle>>;
  setLinkDockItems: React.Dispatch<React.SetStateAction<LinkDockItem[]>>;
}

const BackupDialog: React.FC<BackupDialogProps> = ({
  onClose,
  items,
  textData,
  diaryStyle,
  linkDockItems,
  setItems,
  setTextData,
  setDiaryStyle,
  setLinkDockItems,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  // 현재 저장소 상태 확인
  const storageHealth = checkLocalStorageHealth();

  // 백업 생성
  const handleBackup = async () => {
    setIsProcessing(true);
    setMessage('');
    
    try {
      await exportToJSON(items, textData, diaryStyle, linkDockItems);
      
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const filename = `Dingle_백업_${dateStr}_${timeStr}.dingle`;
      
      setMessage(`✅ 백업 완료!\n파일: ${filename}\n다운로드 폴더를 확인하세요.`);
      
      // 3초 후 자동으로 메시지 지우기
      setTimeout(() => {
        setMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Backup error:', error);
      setMessage('❌ 백업 실패\n\n다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 복원
  const handleRestore = async () => {
    // 경고 메시지
    const confirmed = window.confirm(
      '⚠️ 주의!\n\n' +
      '복원하면 현재 데이터가 모두 사라집니다.\n\n' +
      `현재 다이어리에는 ${storageHealth.itemCount}개의 아이템이 있습니다.\n\n` +
      '계속하시겠습니까?'
    );

    if (!confirmed) {
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      // 파일 선택
      const backup = await importFromJSON();
      
      if (!backup) {
        setIsProcessing(false);
        return; // 사용자가 취소함
      }

      // 백업 정보 확인
      const info = getBackupInfo(backup);
      
      // 최종 확인
      const finalConfirm = window.confirm(
        '📦 백업 정보\n\n' +
        `생성 시각: ${info.created}\n` +
        `아이템 수: ${info.itemCount}개\n` +
        `크기: ${info.size}\n` +
        `버전: ${info.version}\n\n` +
        '이 백업으로 복원하시겠습니까?'
      );

      if (!finalConfirm) {
        setIsProcessing(false);
        return;
      }

      // 복원 실행
      await restoreBackup(backup, setItems, setTextData, setDiaryStyle, setLinkDockItems);

      setMessage('✅ 복원 완료!\n\n페이지를 새로고침합니다...');

      // 1초 후 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Restore error:', error);
      setMessage('❌ 복원 실패\n\n' + String(error));
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--note-paper-background, #f7f5ed)',
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.6))',
          }}
        >
          <h3 
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: 'var(--text-color-primary, #764737)' }}
          >
            <span className="text-2xl">📦</span>
            데이터 관리
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
            disabled={isProcessing}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* 현재 상태 */}
          <div 
            className="mb-6 p-4 rounded-xl"
            style={{
              backgroundColor: 'var(--widget-input-background, #f8fafc)',
              borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.6))',
              border: '1.5px solid',
            }}
          >
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-color-primary, #764737)' }}>
              <span>📊</span>
              현재 다이어리 상태
            </h4>
            <div className="text-xs space-y-1" style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.8 }}>
              <div>• 아이템: {storageHealth.itemCount}개</div>
              <div>• 크기: {(storageHealth.size / 1024).toFixed(2)} KB</div>
              <div>• 사용률: {storageHealth.percentage}%</div>
            </div>
          </div>

          {/* 백업 버튼 */}
          <button
            onClick={handleBackup}
            disabled={isProcessing}
            className="w-full mb-3 px-4 py-4 rounded-xl text-left hover:opacity-80 transition-all flex items-center gap-3"
            style={{
              backgroundColor: 'var(--widget-surface-background, #ffffff)',
              borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.6))',
              border: '1.5px solid',
              opacity: isProcessing ? 0.5 : 1,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
            }}
          >
            <span className="text-3xl">💾</span>
            <div className="flex-1">
              <div className="text-base font-semibold" style={{ color: 'var(--text-color-primary, #764737)' }}>
                백업하기
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.7 }}>
                다이어리를 .dingle 파일로 백업
              </div>
            </div>
          </button>

          {/* 복원 버튼 */}
          <button
            onClick={handleRestore}
            disabled={isProcessing}
            className="w-full mb-4 px-4 py-4 rounded-xl text-left hover:opacity-80 transition-all flex items-center gap-3"
            style={{
              backgroundColor: 'var(--widget-surface-background, #ffffff)',
              borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.6))',
              border: '1.5px solid',
              opacity: isProcessing ? 0.5 : 1,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
            }}
          >
            <span className="text-3xl">📥</span>
            <div className="flex-1">
              <div className="text-base font-semibold" style={{ color: 'var(--text-color-primary, #764737)' }}>
                복원하기
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.7 }}>
                백업 파일에서 다이어리 복원
              </div>
            </div>
          </button>

          {/* 메시지 영역 */}
          {message && (
            <div 
              className="p-4 rounded-xl whitespace-pre-line text-sm"
              style={{
                backgroundColor: message.startsWith('✅') 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)',
                borderColor: message.startsWith('✅')
                  ? 'rgba(34, 197, 94, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)',
                border: '1px solid',
                color: 'var(--text-color-primary, #764737)',
              }}
            >
              {message}
            </div>
          )}

          {/* 안내 */}
          <div 
            className="mt-4 p-3 rounded-lg text-xs"
            style={{
              backgroundColor: 'var(--widget-input-background, #f8fafc)',
              color: 'var(--text-color-primary, #764737)',
              opacity: 0.7,
            }}
          >
            💡 백업 파일(.dingle)은 다운로드 폴더에 저장됩니다. 안전한 곳에 보관하세요.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupDialog;
