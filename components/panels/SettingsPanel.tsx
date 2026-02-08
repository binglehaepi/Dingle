import React, { useState } from 'react';
import { KeyringFrameType } from '../../types';
import BackupDialog from '../BackupDialog';
import { ScrapItem, LayoutTextData, DiaryStyle, LinkDockItem } from '../../types';

interface SettingsPanelProps {
  onClose: () => void;
  onExportPDF: () => void;
  onExportHTML?: () => void; // ✅ HTML 내보내기
  onOpenBackup?: () => void; // 옵셔널로 변경
  onManualSave: () => void;
  compactMode?: boolean;
  onCompactModeChange?: (compact: boolean) => void;
  keyringFrame?: KeyringFrameType;
  onKeyringFrameChange?: (frame: KeyringFrameType) => void;
  
  // ✅ 백업/복원을 위한 props 추가
  items?: ScrapItem[];
  textData?: LayoutTextData;
  diaryStyle?: DiaryStyle;
  linkDockItems?: LinkDockItem[];
  setItems?: React.Dispatch<React.SetStateAction<ScrapItem[]>>;
  setTextData?: React.Dispatch<React.SetStateAction<LayoutTextData>>;
  setDiaryStyle?: React.Dispatch<React.SetStateAction<DiaryStyle>>;
  setLinkDockItems?: React.Dispatch<React.SetStateAction<LinkDockItem[]>>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  onExportPDF,
  onExportHTML,
  onOpenBackup,
  onManualSave,
  compactMode,
  onCompactModeChange,
  keyringFrame = 'rounded-square',
  onKeyringFrameChange,
  items = [],
  textData = {},
  diaryStyle,
  linkDockItems = [],
  setItems,
  setTextData,
  setDiaryStyle,
  setLinkDockItems,
}) => {
  // ✅ 백업 다이얼로그 상태
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  
  // ✅ 웹 브라우저용 백업/복원 가능 여부 체크 (Electron 폴백 포함)
  const canUseWebBackup = items && setItems && textData && setTextData && diaryStyle && setDiaryStyle;

  return (
    <>
      {/* ✅ 백업 다이얼로그 */}
      {showBackupDialog && canUseWebBackup && (
        <BackupDialog
          onClose={() => setShowBackupDialog(false)}
          items={items}
          textData={textData}
          diaryStyle={diaryStyle}
          linkDockItems={linkDockItems}
          setItems={setItems!}
          setTextData={setTextData!}
          setDiaryStyle={setDiaryStyle!}
          setLinkDockItems={setLinkDockItems || (() => {})}
        />
      )}
    
    <div className="h-full flex flex-col" style={{
      backgroundColor: 'var(--note-paper-background, #f7f5ed)',
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
        <div className="flex items-center gap-2">
          {window.electron ? (
            /* 다이어리 종료하기 버튼 */
            <button
              onClick={async () => {
                if (confirm('다이어리를 종료하시겠습니까?')) {
                  if (window.electron?.close) {
                    await window.electron.close();
                  }
                }
              }}
              className="px-4 py-2 rounded-lg hover:bg-red-50 flex items-center gap-2 transition-colors border border-red-200"
              title="다이어리 종료"
            >
              <span className="text-sm font-medium text-red-600">다이어리 종료하기</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            /* 설정 패널 닫기 버튼 (웹 버전용) */
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
              title="설정 닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 다이어리 크기 섹션 */}
        <section className="mb-6">
          <h4 className="text-sm font-semibold mb-3 pb-2 border-b" style={{
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          }}>
            다이어리 크기
          </h4>
          
          <div className="flex flex-col gap-2">
            <select
              value={compactMode ? '1100' : '1400'}
              onChange={(e) => onCompactModeChange?.(e.target.value === '1100')}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-blue-400 transition-colors"
              style={{
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                backgroundColor: 'var(--widget-input-background, #f8fafc)',
                color: 'inherit',
              }}
            >
              <option value="1100">컴팩트 (1100px)</option>
              <option value="1400" disabled>표준 (1400px) - 준비중</option>
            </select>
            <p className="text-xs opacity-70 px-1">
              {compactMode ? '작고 간결한 크기입니다' : '1400px 모드는 현재 준비 중입니다'}
            </p>
          </div>
        </section>

        {/* 키링 참 테두리 섹션 */}
        <section className="mb-6">
          <h4 className="text-sm font-semibold mb-3 pb-2 border-b" style={{
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          }}>
            🔑 키링 참 테두리
          </h4>
          
          <div className="flex flex-col gap-2">
            <select
              value={keyringFrame}
              onChange={(e) => onKeyringFrameChange?.(e.target.value as KeyringFrameType)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-blue-400 transition-colors"
              style={{
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                backgroundColor: 'var(--widget-input-background, #f8fafc)',
                color: 'inherit',
              }}
            >
              <option value="rounded-square">🔲 둥근 네모</option>
              <option value="heart">❤️ 하트</option>
              <option value="circle">⭕ 원형</option>
            </select>
          </div>
        </section>

        <section className="mb-6">
          <h4 className="text-sm font-semibold mb-3 pb-2 border-b" style={{
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          }}>
            내보내기 & 백업
          </h4>
          
          <div className="flex flex-col gap-1.5">
            {/* ✅ HTML 내보내기 (내 사이트 만들기) */}
            <button
              onClick={onExportHTML}
              className="w-full px-3 py-2 rounded-lg border text-left hover:opacity-80 transition-colors flex items-center gap-2"
              style={{
                backgroundColor: 'var(--widget-input-background, #f8fafc)',
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">HTML 내보내기</div>
                <div className="text-[10px] opacity-60">내 다이어리를 웹 사이트로 만들기</div>
              </div>
            </button>

            {/* PDF 내보내기 - 준비중 */}
            <button
              disabled
              className="w-full px-3 py-2 rounded-lg border text-left opacity-50 cursor-not-allowed transition-colors flex items-center gap-2"
              style={{
                backgroundColor: 'var(--widget-input-background, #f8fafc)',
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">PDF 내보내기 (준비중)</div>
                <div className="text-[10px] opacity-60">기능 개선 중입니다</div>
              </div>
            </button>

            {/* ✅ 데이터 관리 버튼 - 백업/복원 통합 */}
            <button
              onClick={() => {
                // 항상 BackupDialog 열기 (백업/복원 모두 가능)
                if (canUseWebBackup) {
                  setShowBackupDialog(true);
                } else {
                  alert('데이터 관리 기능을 사용할 수 없습니다.');
                }
              }}
              className="w-full px-3 py-2 rounded-lg border text-left hover:opacity-80 transition-colors flex items-center gap-2"
              style={{
                backgroundColor: 'var(--widget-input-background, #f8fafc)',
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">데이터 관리</div>
                <div className="text-[10px] opacity-60">백업 및 복원</div>
              </div>
            </button>

            {/* 수동 저장 */}
            <button
              onClick={onManualSave}
              className="w-full px-3 py-2 rounded-lg border text-left hover:opacity-80 transition-colors flex items-center gap-2"
              style={{
                backgroundColor: 'var(--widget-input-background, #f8fafc)',
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">수동 저장</div>
                <div className="text-[10px] opacity-60">즉시 저장</div>
              </div>
            </button>
          </div>
        </section>

        {/* 음악 재생 안내 섹션 */}
        <section className="mb-6">
          <h4 className="text-sm font-semibold mb-3 pb-2 border-b" style={{
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          }}>
            🎵 음악 재생
          </h4>
          
          <div className="flex flex-col gap-2 p-3 rounded-lg" style={{
            backgroundColor: 'var(--widget-input-background, #f8fafc)',
          }}>
            <div className="text-xs opacity-80 leading-relaxed">
              <div className="font-semibold mb-1">📌 YouTube 음악이 재생되지 않나요?</div>
              <div className="ml-2">
                • 브라우저에서 YouTube를 닫아주세요<br/>
                • YouTube는 동시 재생을 제한합니다
              </div>
            </div>
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
    </>
  );
};

export default SettingsPanel;

