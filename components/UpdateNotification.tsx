/**
 * 자동 업데이트 알림 컴포넌트
 * 
 * Electron 환경에서 새 버전이 있을 때 사용자에게 알림을 표시합니다.
 */

import React, { useEffect, useState } from 'react';

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
}

type UpdateState = 
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'not-available'
  | 'error'
  | null;

export const UpdateNotification: React.FC = () => {
  const [updateState, setUpdateState] = useState<UpdateState>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Electron 환경이 아니면 아무것도 표시하지 않음
    if (!window.electron?.isElectron) {
      return;
    }

    // 업데이트 확인 중
    const unsubChecking = window.electron.onUpdateChecking(() => {
      setUpdateState('checking');
      setError(null);
    });

    // 업데이트 사용 가능
    const unsubAvailable = window.electron.onUpdateAvailable((info) => {
      setUpdateState('available');
      setUpdateInfo(info);
      setError(null);
    });

    // 최신 버전 사용 중
    const unsubNotAvailable = window.electron.onUpdateNotAvailable(() => {
      setUpdateState('not-available');
      setTimeout(() => setUpdateState(null), 3000); // 3초 후 알림 숨김
    });

    // 다운로드 진행률
    const unsubProgress = window.electron.onUpdateDownloadProgress((progress) => {
      setUpdateState('downloading');
      setDownloadProgress(progress);
    });

    // 다운로드 완료
    const unsubDownloaded = window.electron.onUpdateDownloaded((info) => {
      setUpdateState('downloaded');
      setUpdateInfo(info);
      setDownloadProgress(null);
    });

    // 에러
    const unsubError = window.electron.onUpdateError((err) => {
      setUpdateState('error');
      setError(err.message);
      setTimeout(() => {
        setUpdateState(null);
        setError(null);
      }, 5000);
    });

    return () => {
      unsubChecking();
      unsubAvailable();
      unsubNotAvailable();
      unsubProgress();
      unsubDownloaded();
      unsubError();
    };
  }, []);

  const handleDownload = async () => {
    try {
      await window.electron.updateDownload();
    } catch (err) {
      console.error('Update download failed:', err);
    }
  };

  const handleInstall = async () => {
    try {
      await window.electron.updateInstall();
    } catch (err) {
      console.error('Update install failed:', err);
    }
  };

  const handleDismiss = () => {
    setUpdateState(null);
    setUpdateInfo(null);
    setDownloadProgress(null);
    setError(null);
  };

  // 알림이 없으면 아무것도 표시하지 않음
  if (!updateState) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.notification}>
        {/* 업데이트 확인 중 */}
        {updateState === 'checking' && (
          <div style={styles.content}>
            <div style={styles.title}>🔄 업데이트 확인 중...</div>
          </div>
        )}

        {/* 업데이트 사용 가능 */}
        {updateState === 'available' && updateInfo && (
          <div style={styles.content}>
            <div style={styles.title}>🎉 새 버전 {updateInfo.version}이 있습니다!</div>
            {updateInfo.releaseNotes && (
              <div style={styles.releaseNotes}>{updateInfo.releaseNotes}</div>
            )}
            <div style={styles.buttons}>
              <button onClick={handleDownload} style={styles.primaryButton}>
                다운로드
              </button>
              <button onClick={handleDismiss} style={styles.secondaryButton}>
                나중에
              </button>
            </div>
          </div>
        )}

        {/* 다운로드 중 */}
        {updateState === 'downloading' && downloadProgress && (
          <div style={styles.content}>
            <div style={styles.title}>⬇️ 업데이트 다운로드 중...</div>
            <div style={styles.progressContainer}>
              <div 
                style={{
                  ...styles.progressBar,
                  width: `${downloadProgress.percent}%`
                }}
              />
            </div>
            <div style={styles.progressText}>
              {downloadProgress.percent.toFixed(1)}% 
              ({(downloadProgress.transferred / 1024 / 1024).toFixed(1)} MB / {(downloadProgress.total / 1024 / 1024).toFixed(1)} MB)
            </div>
          </div>
        )}

        {/* 다운로드 완료 */}
        {updateState === 'downloaded' && updateInfo && (
          <div style={styles.content}>
            <div style={styles.title}>✅ 업데이트 준비 완료!</div>
            <div style={styles.description}>
              버전 {updateInfo.version}이 다운로드되었습니다. 지금 재시작하시겠습니까?
            </div>
            <div style={styles.buttons}>
              <button onClick={handleInstall} style={styles.primaryButton}>
                지금 재시작
              </button>
              <button onClick={handleDismiss} style={styles.secondaryButton}>
                나중에
              </button>
            </div>
          </div>
        )}

        {/* 최신 버전 사용 중 */}
        {updateState === 'not-available' && (
          <div style={styles.content}>
            <div style={styles.title}>✨ 최신 버전을 사용하고 있습니다</div>
          </div>
        )}

        {/* 에러 */}
        {updateState === 'error' && (
          <div style={styles.content}>
            <div style={styles.title}>❌ 업데이트 확인 실패</div>
            {error && <div style={styles.error}>{error}</div>}
            <button onClick={handleDismiss} style={styles.secondaryButton}>
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 인라인 스타일 (간단한 스타일링)
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    maxWidth: '400px',
  },
  notification: {
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    padding: '16px',
    animation: 'slideIn 0.3s ease-out',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: '14px',
    color: '#666',
  },
  releaseNotes: {
    fontSize: '13px',
    color: '#888',
    maxHeight: '100px',
    overflow: 'auto',
    padding: '8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  buttons: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  primaryButton: {
    flex: 1,
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    flex: 1,
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  progressContainer: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007bff',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center',
  },
  error: {
    fontSize: '13px',
    color: '#d32f2f',
    padding: '8px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
  },
};

