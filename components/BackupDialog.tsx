/**
 * 백업/복원 다이얼로그
 * 
 * Phase 1: JSON 다운로드/업로드 (웹 브라우저)
 * Phase 3: Electron 파일 다이얼로그 (데스크톱)
 */

import React, { useState, useEffect } from 'react';
import { ScrapItem, LayoutTextData, DiaryStyle } from '../types';
import {
  exportToJSON,
  importFromJSON,
  restoreBackup,
  checkLocalStorageHealth,
  BackupData,
  getBackupInfo,
} from '../services/backup';
import { migrateDiaryStyle } from '../utils/theme';
import { STYLE_PREF_KEY } from '../constants/appConstants';
import {
  saveDiaryToFile,
  loadDiaryFromFile,
  getFileInfo,
  listBackups,
  restoreFromBackup,
  createBackup,
  BackupInfo,
} from '../services/fileStorage';

interface BackupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  
  // 현재 앱 상태
  items: ScrapItem[];
  textData: LayoutTextData;
  stylePref: DiaryStyle;
  
  // 복원 핸들러
  setItems: React.Dispatch<React.SetStateAction<ScrapItem[]>>;
  setTextData: React.Dispatch<React.SetStateAction<LayoutTextData>>;
  setDiaryStyle: React.Dispatch<React.SetStateAction<DiaryStyle>>;
  
  // Toast
  setToastMsg: React.Dispatch<React.SetStateAction<string>>;
}

const BackupDialog: React.FC<BackupDialogProps> = ({
  isOpen,
  onClose,
  items,
  textData,
  stylePref,
  setItems,
  setTextData,
  setDiaryStyle,
  setToastMsg,
}) => {
  const [health, setHealth] = useState(checkLocalStorageHealth());
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [previewBackup, setPreviewBackup] = useState<BackupData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backupList, setBackupList] = useState<BackupInfo[]>([]);
  const [showBackupList, setShowBackupList] = useState(false);

  const isElectron = !!window.electron;

  useEffect(() => {
    if (isOpen) {
      setHealth(checkLocalStorageHealth());
      
      // Electron: 파일 정보 및 백업 목록 조회
      if (isElectron) {
        getFileInfo().then(info => {
          setFileInfo(info);
        });
        
        listBackups().then(backups => {
          setBackupList(backups);
        });
      }
    }
  }, [isOpen, isElectron]);

  if (!isOpen) return null;

  // ═══════════════════════════════════════════════════════
  // 💾 내보내기 (Export)
  // ═══════════════════════════════════════════════════════

  const handleExport = async () => {
    try {
      setIsLoading(true);

      if (isElectron) {
        // Electron: 파일 저장 다이얼로그
        const result = await window.electron.showSaveDialog({
          defaultPath: `ScrapDiary_${new Date().toISOString().slice(0, 10)}.json`,
          filters: [{ name: 'JSON Files', extensions: ['json'] }]
        });

        if (result.canceled || !result.filePath) {
          setIsLoading(false);
          return;
        }

        // 데이터 생성
        const backup = {
          version: '2.0.0',
          appVersion: '1.0.0',
          createdAt: Date.now(),
          items,
          textData,
          stylePref,
          itemCount: items.length,
          totalSize: 0,
        };

        const jsonStr = JSON.stringify(backup, null, 2);
        
        // 파일 저장
        const writeResult = await window.electron.writeFile(result.filePath, jsonStr);
        
        if (writeResult.success) {
          setToastMsg('✅ Exported!');
          setTimeout(() => setToastMsg(''), 2000);
        } else {
          throw new Error(writeResult.error);
        }
      } else {
        // 웹: 브라우저 다운로드
        await exportToJSON(items, textData, stylePref);
        setToastMsg('✅ Downloaded!');
        setTimeout(() => setToastMsg(''), 2000);
      }
    } catch (error) {
      console.error(error);
      setToastMsg('❌ Export failed');
      setTimeout(() => setToastMsg(''), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // 📂 불러오기 (Import)
  // ═══════════════════════════════════════════════════════

  const handleImport = async () => {
    try {
      setIsLoading(true);

      let backup: BackupData | null = null;

      if (isElectron) {
        // Electron: 파일 열기 다이얼로그
        const result = await window.electron.showOpenDialog({
          filters: [{ name: 'JSON Files', extensions: ['json'] }],
          properties: ['openFile']
        });

        if (result.canceled || result.filePaths.length === 0) {
          setIsLoading(false);
          return;
        }

        // 파일 읽기
        const readResult = await window.electron.readFile(result.filePaths[0]);
        
        if (!readResult.success || !readResult.data) {
          throw new Error(readResult.error);
        }

        backup = JSON.parse(readResult.data);
      } else {
        // 웹: 파일 업로드
        backup = await importFromJSON();
      }

      if (backup) {
        setPreviewBackup(backup);
      }
    } catch (error) {
      console.error(error);
      setToastMsg('❌ Import failed');
      setTimeout(() => setToastMsg(''), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // 🔄 복원 (Restore)
  // ═══════════════════════════════════════════════════════

  const handleRestore = () => {
    if (!previewBackup) return;

    if (!window.confirm('⚠️ 현재 데이터가 모두 교체됩니다.\n계속하시겠습니까?')) {
      return;
    }

    try {
      restoreBackup(previewBackup, setItems, setTextData, setDiaryStyle);
      setToastMsg('✅ Restored!');
      setTimeout(() => setToastMsg(''), 2000);
      setPreviewBackup(null);
      onClose();
    } catch (error) {
      console.error(error);
      setToastMsg('❌ Restore failed');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  // ═══════════════════════════════════════════════════════
  // 💾 백업 생성 (Electron)
  // ═══════════════════════════════════════════════════════

  const handleCreateBackup = async () => {
    if (!isElectron) return;

    try {
      setIsLoading(true);
      const result = await createBackup();

      if (result.success) {
        setToastMsg('✅ Backup created!');
        setTimeout(() => setToastMsg(''), 2000);

        // 백업 목록 새로고침
        const backups = await listBackups();
        setBackupList(backups);
      } else {
        setToastMsg('❌ Backup failed');
        setTimeout(() => setToastMsg(''), 2000);
      }
    } catch (error) {
      console.error(error);
      setToastMsg('❌ Error');
      setTimeout(() => setToastMsg(''), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // 🔄 백업에서 복원 (Electron)
  // ═══════════════════════════════════════════════════════

  const handleRestoreFromBackup = async (backup: BackupInfo) => {
    if (!isElectron) return;

    if (!window.confirm(`⚠️ 이 백업으로 복원하시겠습니까?\n\n${backup.fileName}\n생성: ${backup.createdAt.toLocaleString('ko-KR')}\n아이템: ${backup.itemCount}개\n\n현재 데이터가 모두 교체됩니다.`)) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await restoreFromBackup(backup.filePath);

      if (result.success && result.data) {
        setItems(result.data.items);
        setTextData(result.data.textData);
        const migrated = migrateDiaryStyle(result.data.stylePref);
        setDiaryStyle(migrated);
        // 요구사항 B: 복원 직후 localStorage에도 즉시 반영(새로고침 유지)
        localStorage.setItem(STYLE_PREF_KEY, JSON.stringify(migrated));

        setToastMsg('✅ Restored from backup!');
        setTimeout(() => setToastMsg(''), 2000);
        setShowBackupList(false);
        onClose();
      } else {
        setToastMsg('❌ Restore failed');
        setTimeout(() => setToastMsg(''), 2000);
      }
    } catch (error) {
      console.error(error);
      setToastMsg('❌ Error');
      setTimeout(() => setToastMsg(''), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // 🎨 UI
  // ═══════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[80vh] overflow-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            💾 백업 & 복원
            {isElectron && <span className="text-sm text-blue-500 ml-2">Electron</span>}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Electron: 파일 정보 */}
        {isElectron && fileInfo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold mb-2">📁 저장된 파일</h3>
            <div className="text-sm space-y-1">
              {fileInfo.exists ? (
                <>
                  <div className="flex justify-between">
                    <span>위치:</span>
                    <strong className="text-xs truncate ml-2">{fileInfo.path}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>마지막 저장:</span>
                    <strong>{fileInfo.savedAt ? new Date(fileInfo.savedAt).toLocaleString('ko-KR') : 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>아이템 개수:</span>
                    <strong>{fileInfo.itemCount}개</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>파일 크기:</span>
                    <strong>{fileInfo.size}</strong>
                  </div>
                </>
              ) : (
                <p className="text-gray-600">저장된 파일 없음</p>
              )}
            </div>
          </div>
        )}

        {/* 웹: localStorage 상태 */}
        {!isElectron && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold mb-2">📊 현재 상태</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>아이템 개수:</span>
                <strong>{health.itemCount}개</strong>
              </div>
              <div className="flex justify-between">
                <span>저장소 사용:</span>
                <strong>{(health.size / 1024).toFixed(2)} KB</strong>
              </div>
              <div className="flex justify-between">
                <span>할당량 사용률:</span>
                <strong className={health.percentage > 80 ? 'text-red-500' : ''}>
                  {health.percentage}%
                </strong>
              </div>
            </div>
            {health.percentage > 80 && (
              <p className="text-xs text-red-500 mt-2">
                ⚠️ 저장소가 부족합니다! 백업 후 일부 데이터를 삭제하세요.
              </p>
            )}
          </div>
        )}

        {/* 내보내기 */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">📤 내보내기</h3>
          <p className="text-sm text-gray-600 mb-3">
            {isElectron 
              ? '다이어리를 JSON 파일로 저장합니다.'
              : '현재 데이터를 JSON 파일로 다운로드합니다.'}
          </p>
          <button
            onClick={handleExport}
            disabled={isLoading || items.length === 0}
            className="w-full bg-[var(--ui-primary-bg)] text-[var(--ui-primary-text)] py-3 rounded-lg hover:bg-[var(--ui-primary-hover)] disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ 내보내는 중...' : '💾 JSON 파일로 내보내기'}
          </button>
        </div>

        {/* 백업 히스토리 (Electron only) */}
        {isElectron && (
          <>
            <div className="border-t my-6"></div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">📚 백업 히스토리</h3>
                <button
                  onClick={() => setShowBackupList(!showBackupList)}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  {showBackupList ? '닫기' : `${backupList.length}개 보기`}
                </button>
              </div>

              {showBackupList && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {backupList.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">백업이 없습니다</p>
                  ) : (
                    backupList.map((backup) => (
                      <div
                        key={backup.filePath}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {backup.fileName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {backup.createdAt.toLocaleString('ko-KR')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {backup.itemCount}개 아이템 · {backup.size}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRestoreFromBackup(backup)}
                            disabled={isLoading}
                            className="px-3 py-1 text-xs bg-[var(--ui-success-bg)] text-[var(--ui-success-text)] rounded hover:bg-[var(--ui-success-hover)] disabled:bg-gray-300 whitespace-nowrap"
                          >
                            복원
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <button
                onClick={handleCreateBackup}
                disabled={isLoading}
                className="w-full mt-3 bg-[var(--ui-primary-bg)] text-[var(--ui-primary-text)] py-2 rounded-lg hover:bg-[var(--ui-primary-hover)] disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ 생성 중...' : '➕ 새 백업 생성'}
              </button>
            </div>
          </>
        )}

        <div className="border-t my-6"></div>

        {/* 불러오기 */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">📥 불러오기</h3>
          <p className="text-sm text-gray-600 mb-3">
            백업 파일을 선택하세요.
          </p>
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="w-full bg-[var(--ui-success-bg)] text-[var(--ui-success-text)] py-3 rounded-lg hover:bg-[var(--ui-success-hover)] disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ 파일 읽는 중...' : '📂 JSON 파일 선택'}
          </button>
        </div>

        {/* 미리보기 */}
        {previewBackup && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold mb-2">🔍 백업 미리보기</h3>
            <div className="text-sm space-y-1 mb-4">
              <div className="flex justify-between">
                <span>생성 일시:</span>
                <strong>{getBackupInfo(previewBackup).created}</strong>
              </div>
              <div className="flex justify-between">
                <span>아이템 개수:</span>
                <strong>{getBackupInfo(previewBackup).itemCount}개</strong>
              </div>
              <div className="flex justify-between">
                <span>파일 크기:</span>
                <strong>{getBackupInfo(previewBackup).size}</strong>
              </div>
              <div className="flex justify-between">
                <span>버전:</span>
                <strong>{getBackupInfo(previewBackup).version}</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRestore}
                className="flex-1 bg-[var(--ui-danger-bg)] text-[var(--ui-danger-text)] py-2 rounded hover:bg-[var(--ui-danger-hover)]"
              >
                ⚠️ 복원 (현재 데이터 교체)
              </button>
              <button
                onClick={() => setPreviewBackup(null)}
                className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
          <h4 className="font-bold mb-2">💡 {isElectron ? 'Electron 모드' : '웹 모드'}</h4>
          <ul className="space-y-1 list-disc list-inside">
            {isElectron ? (
              <>
                <li>데이터는 자동으로 파일에 저장됩니다 (5초 디바운스)</li>
                <li>파일 위치: Documents/ScrapDiary/current.json</li>
                <li>내보내기로 추가 백업 파일을 생성할 수 있습니다</li>
                <li>브라우저 데이터 삭제와 무관하게 안전하게 보관됩니다</li>
              </>
            ) : (
              <>
                <li>중요한 작업 전후에 백업하세요</li>
                <li>정기적으로 백업 파일을 안전한 곳에 보관하세요</li>
                <li>브라우저 데이터 삭제 시 모든 데이터가 사라집니다</li>
                <li>여러 기기에서 사용하려면 백업 파일을 공유하세요</li>
              </>
            )}
          </ul>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full mt-4 bg-gray-200 py-2 rounded hover:bg-gray-300"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default BackupDialog;
