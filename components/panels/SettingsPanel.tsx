import React from 'react';

interface SettingsPanelProps {
  onClose: () => void;
  onExportPDF: () => void;
  onOpenBackup: () => void;
  onManualSave: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  onExportPDF,
  onOpenBackup,
  onManualSave,
}) => {
  return (
    <div className="h-full flex flex-col" style={{
      backgroundColor: 'transparent',
      color: 'var(--month-tab-text-color, #764737)',
    }}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between" style={{
        borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
      }}>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
          </svg>
          설정
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
          title="닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <section className="mb-6">
          <h4 className="text-sm font-semibold mb-3 pb-2 border-b" style={{
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          }}>
            내보내기 & 백업
          </h4>
          
          <div className="flex flex-col gap-2">
            {/* PDF 내보내기 */}
            <button
              onClick={onExportPDF}
              className="w-full px-4 py-3 rounded-lg border text-left hover:bg-stone-50 transition-colors flex items-center gap-3"
              style={{
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <div className="font-medium">PDF로 내보내기</div>
                <div className="text-xs opacity-70">다이어리를 PDF 파일로 저장</div>
              </div>
            </button>

            {/* 백업 */}
            <button
              onClick={onOpenBackup}
              className="w-full px-4 py-3 rounded-lg border text-left hover:bg-stone-50 transition-colors flex items-center gap-3"
              style={{
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <div className="font-medium">백업 & 복원</div>
                <div className="text-xs opacity-70">백업 파일 생성 및 복원</div>
              </div>
            </button>

            {/* 수동 저장 */}
            <button
              onClick={onManualSave}
              className="w-full px-4 py-3 rounded-lg border text-left hover:bg-stone-50 transition-colors flex items-center gap-3"
              style={{
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              <div className="flex-1">
                <div className="font-medium">수동 저장</div>
                <div className="text-xs opacity-70">현재 상태를 즉시 저장</div>
              </div>
            </button>
          </div>
        </section>

        {/* 추가 정보 */}
        <div className="mt-6 p-3 rounded-lg" style={{
          backgroundColor: 'var(--widget-input-background, #f8fafc)',
        }}>
          <div className="text-xs opacity-70">
            💡 자동 저장이 활성화되어 있습니다. 변경사항은 자동으로 저장됩니다.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

