/**
 * 백업/복원 서비스
 * Phase 1: 브라우저에서 JSON 다운로드/업로드
 * Phase 3: Electron 파일 시스템으로 전환
 */

import { ScrapItem, LayoutTextData, DiaryStyle } from '../types';
import { STORAGE_KEY, TEXT_DATA_KEY, STYLE_PREF_KEY } from '../constants/appConstants';
import { migrateDiaryStyle } from '../utils/theme';
import { migrateScrapItemsDecoration } from '../utils/itemMigrations';
import type * as React from 'react';

// ═══════════════════════════════════════════════════════
// 📦 백업 데이터 타입
// ═══════════════════════════════════════════════════════

export interface BackupData {
  version: string;          // 백업 포맷 버전
  appVersion: string;       // 앱 버전
  createdAt: number;        // 백업 생성 시각
  
  // 실제 데이터
  items: ScrapItem[];
  textData: LayoutTextData;
  stylePref: DiaryStyle;
  
  // 메타데이터
  itemCount: number;
  totalSize: number;        // bytes
}

// ═══════════════════════════════════════════════════════
// 💾 내보내기 (localStorage → JSON 파일)
// ═══════════════════════════════════════════════════════

export async function exportToJSON(
  items: ScrapItem[],
  textData: LayoutTextData,
  stylePref: DiaryStyle
): Promise<void> {
  try {
    const { backup, finalJson } = createBackupJSON(items, textData, stylePref);

    // 파일명 생성
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10); // 2025-12-18
    const timeStr = date.toTimeString().slice(0, 5).replace(':', ''); // 1305
    const filename = `ScrapDiary_${dateStr}_${timeStr}.json`;

    // 브라우저 다운로드
    downloadJSON(finalJson, filename);

    console.log('✅ Backup created:', filename);
    console.log('📊 Size:', (backup.totalSize / 1024).toFixed(2), 'KB');
    console.log('📦 Items:', backup.itemCount);

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw new Error('백업 생성 실패');
  }
}

/**
 * 백업 JSON 생성(테스트/자동검증에서도 재사용)
 */
export function createBackupJSON(
  items: ScrapItem[],
  textData: LayoutTextData,
  stylePref: DiaryStyle
): { backup: BackupData; finalJson: string } {
  const backup: BackupData = {
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
  backup.totalSize = new Blob([jsonStr]).size;
  const finalJson = JSON.stringify(backup, null, 2);
  return { backup, finalJson };
}

/**
 * JSON을 브라우저에서 다운로드
 */
function downloadJSON(jsonStr: string, filename: string): void {
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  
  // 정리
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ═══════════════════════════════════════════════════════
// 📂 불러오기 (JSON 파일 → localStorage)
// ═══════════════════════════════════════════════════════

export async function importFromJSON(): Promise<BackupData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const text = await file.text();
        const backup = JSON.parse(text) as BackupData;

        // 버전 체크
        if (!backup.version || !backup.items) {
          throw new Error('Invalid backup file');
        }

        console.log('✅ Backup loaded:', file.name);
        console.log('📅 Created:', new Date(backup.createdAt).toLocaleString());
        console.log('📦 Items:', backup.itemCount);

        // 정리
        document.body.removeChild(input);
        resolve(backup);

      } catch (error) {
        console.error('❌ Backup load failed:', error);
        alert('백업 파일을 읽을 수 없습니다.\n올바른 JSON 파일인지 확인하세요.');
        document.body.removeChild(input);
        resolve(null);
      }
    };

    input.oncancel = () => {
      document.body.removeChild(input);
      resolve(null);
    };

    document.body.appendChild(input);
    input.click();
  });
}

// ═══════════════════════════════════════════════════════
// 🔄 복원 (백업 데이터 → 앱 상태)
// ═══════════════════════════════════════════════════════

export function restoreBackup(
  backup: BackupData,
  setItems: React.Dispatch<React.SetStateAction<ScrapItem[]>>,
  setTextData: React.Dispatch<React.SetStateAction<LayoutTextData>>,
  setDiaryStyle: React.Dispatch<React.SetStateAction<DiaryStyle>>
): void {
  try {
    const migratedStyle = migrateDiaryStyle(backup.stylePref);
    const migratedItems = migrateScrapItemsDecoration(backup.items);

    // State 업데이트
    setItems(migratedItems);
    setTextData(backup.textData);
    setDiaryStyle(migratedStyle);

    // localStorage에도 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedItems));
    localStorage.setItem(TEXT_DATA_KEY, JSON.stringify(backup.textData));
    localStorage.setItem(STYLE_PREF_KEY, JSON.stringify(migratedStyle));

    console.log('✅ Backup restored successfully');

  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw new Error('백업 복원 실패');
  }
}

// ═══════════════════════════════════════════════════════
// 📊 백업 정보 확인 (미리보기)
// ═══════════════════════════════════════════════════════

export function getBackupInfo(backup: BackupData): {
  created: string;
  itemCount: number;
  size: string;
  version: string;
} {
  return {
    created: new Date(backup.createdAt).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    itemCount: backup.itemCount,
    size: (backup.totalSize / 1024).toFixed(2) + ' KB',
    version: backup.version,
  };
}

// ═══════════════════════════════════════════════════════
// 🚨 로컬 스토리지 상태 체크
// ═══════════════════════════════════════════════════════

export function checkLocalStorageHealth(): {
  hasData: boolean;
  itemCount: number;
  size: number;
  quota: number;
  percentage: number;
} {
  try {
    const itemsStr = localStorage.getItem(STORAGE_KEY);
    const items: ScrapItem[] = itemsStr ? JSON.parse(itemsStr) : [];
    
    // 전체 localStorage 크기 계산
    let totalSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage.getItem(key)?.length || 0;
      }
    }

    // 브라우저 할당량 (대략 5MB)
    const quota = 5 * 1024 * 1024; // 5MB
    const percentage = (totalSize / quota) * 100;

    return {
      hasData: items.length > 0,
      itemCount: items.length,
      size: totalSize,
      quota,
      percentage: Math.round(percentage),
    };

  } catch {
    return {
      hasData: false,
      itemCount: 0,
      size: 0,
      quota: 0,
      percentage: 0,
    };
  }
}




