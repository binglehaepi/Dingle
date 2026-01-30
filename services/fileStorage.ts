/**
 * Electron 파일 저장 서비스
 * 
 * localStorage 대신 파일 시스템에 직접 저장
 * Phase 3: 기본 파일 저장
 * Phase 5: ZIP 포맷 + 버전 히스토리
 */

import { ScrapItem, LayoutTextData, DiaryStyle, LinkDockItem } from '../types';
import { LINK_DOCK_KEY } from '../constants/appConstants';
import { migrateDiaryStyle } from '../utils/theme';
import { migrateScrapItemsDecoration } from '../utils/itemMigrations';

// ═══════════════════════════════════════════════════════
// 📁 파일 경로 관리
// ═══════════════════════════════════════════════════════

// 현재 열린 다이어리 ID (overlay에서 사용)
let _currentDiaryId: string | null = null;

/**
 * 현재 다이어리 ID 설정
 */
export function setCurrentDiaryId(diaryId: string | null) {
  _currentDiaryId = diaryId;
  console.log('[fileStorage] Current diary ID set to:', diaryId);
}

/**
 * 현재 다이어리 ID 가져오기
 */
export function getCurrentDiaryId(): string | null {
  return _currentDiaryId;
}

/**
 * 현재 다이어리 파일 경로
 * - overlay에서 열린 다이어리가 있으면 그 파일
 * - 없으면 current.json (기존 호환)
 */
export async function getCurrentDiaryPath(): Promise<string> {
  if (!window.electron) {
    throw new Error('Electron API not available');
  }

  const paths = await window.electron.getPaths();
  
  // overlay에서 특정 다이어리를 열었으면 그 파일 사용
  if (_currentDiaryId) {
    return `${paths.diaryDir}/diary-${_currentDiaryId}.json`;
  }
  
  // 기본: current.json (기존 호환)
  return `${paths.diaryDir}/current.json`;
}

/**
 * 특정 다이어리 파일 경로
 */
export async function getDiaryPath(diaryId: string): Promise<string> {
  if (!window.electron) {
    throw new Error('Electron API not available');
  }

  const paths = await window.electron.getPaths();
  return `${paths.diaryDir}/diary-${diaryId}.json`;
}

/**
 * metadata.json 경로
 */
export async function getMetadataPath(): Promise<string> {
  if (!window.electron) {
    throw new Error('Electron API not available');
  }

  const paths = await window.electron.getPaths();
  return `${paths.diaryDir}/metadata.json`;
}

/**
 * 백업 디렉토리 경로
 */
export async function getBackupDir(): Promise<string> {
  if (!window.electron) {
    throw new Error('Electron API not available');
  }

  const paths = await window.electron.getPaths();
  return `${paths.diaryDir}/backups`;
}

// ═══════════════════════════════════════════════════════
// 💾 파일 저장/로드
// ═══════════════════════════════════════════════════════

export interface DiaryData {
  version: string;
  appVersion: string;
  savedAt: number;
  items: ScrapItem[];
  textData: LayoutTextData;
  stylePref: DiaryStyle;
  linkDockItems?: LinkDockItem[];
}

// ═══════════════════════════════════════════════════════
// 📚 다이어리 관리자 (Multi-Diary Support)
// ═══════════════════════════════════════════════════════

export interface DiaryMetadata {
  id: string;
  name: string;
  created: string; // ISO 8601
  modified: string; // ISO 8601
  color: string;
  thumbnail?: string; // base64 or URL
  coverPattern?: 'solid' | 'dots' | 'stripes' | 'grid' | 'vintage';
  coverTexture?: 'smooth' | 'paper' | 'leather';
  keyring?: string; // 키링 charm (emoji 또는 이미지 URL)
}

export interface DiariesMetadata {
  diaries: DiaryMetadata[];
}

/**
 * 다이어리 데이터를 파일에 저장
 * Atomic write: 임시 파일 → rename (파일 깨짐 방지)
 */
export async function saveDiaryToFile(
  items: ScrapItem[],
  textData: LayoutTextData,
  stylePref: DiaryStyle,
  linkDockItems: LinkDockItem[] = []
): Promise<{ success: boolean; error?: string }> {
  if (!window.electron) {
    return { success: false, error: 'Electron API not available' };
  }

  try {
    const filePath = await getCurrentDiaryPath();

    // 저장할 데이터 구성
    const data: DiaryData = {
      version: '2.0.0',
      appVersion: '1.0.0',
      savedAt: Date.now(),
      items,
      textData,
      stylePref,
      linkDockItems,
    };

    // JSON 문자열로 변환
    const jsonStr = JSON.stringify(data, null, 2);

    // 파일 쓰기 (main.ts에서 atomic write 처리)
    const result = await window.electron.writeFile(filePath, jsonStr);

    if (result.success) {
      console.log('✅ Saved to file:', filePath);
      console.log('📦 Items:', items.length);
      
      // metadata 업데이트: keyring 동기화
      try {
        const metadata = await loadMetadata();
        const diaryId = getCurrentDiaryId() || 'default';
        const diaryIndex = metadata.diaries.findIndex(d => d.id === diaryId);
        
        if (diaryIndex >= 0) {
          metadata.diaries[diaryIndex].keyring = stylePref.keyring;
          metadata.diaries[diaryIndex].modified = new Date().toISOString();
          await saveMetadata(metadata);
          console.log('✅ Keyring synced to metadata:', stylePref.keyring);
        }
      } catch (error) {
        console.warn('Failed to update keyring in metadata:', error);
      }
      
      return { success: true };
    } else {
      console.error('❌ Save failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Save error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 파일에서 다이어리 데이터 로드
 */
export async function loadDiaryFromFile(): Promise<DiaryData | null> {
  if (!window.electron) {
    console.warn('Electron API not available, returning null');
    return null;
  }

  try {
    const filePath = await getCurrentDiaryPath();

    // 파일 존재 확인
    const exists = await window.electron.exists(filePath);
    if (!exists) {
      console.log('📝 No saved file found, starting fresh');
      return null;
    }

    // 파일 읽기
    const result = await window.electron.readFile(filePath);

    if (!result.success || !result.data) {
      console.error('❌ Load failed:', result.error);
      return null;
    }

    // JSON 파싱
    const data = JSON.parse(result.data) as DiaryData;

    // stylePref 마이그레이션 (uiTokens 포함)
    if (data?.stylePref) {
      data.stylePref = migrateDiaryStyle(data.stylePref);
    }

    // items 마이그레이션 (link/embed decoration 기본값 보강)
    if (data?.items) {
      data.items = migrateScrapItemsDecoration(data.items);
    }

    // linkDockItems 기본값 보강 (구버전 파일 호환)
    if (!data.linkDockItems) {
      data.linkDockItems = [];
    }

    console.log('✅ Loaded from file:', filePath);
    console.log('📦 Items:', data.items?.length || 0);
    console.log('💾 Saved at:', new Date(data.savedAt).toLocaleString());

    return data;
  } catch (error) {
    console.error('❌ Load error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// 🗄️ 백업 관리
// ═══════════════════════════════════════════════════════

/**
 * 현재 파일을 백업 디렉토리에 복사
 */
export async function createBackup(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
  if (!window.electron) {
    return { success: false, error: 'Electron API not available' };
  }

  try {
    const currentPath = await getCurrentDiaryPath();
    
    // 현재 파일 존재 확인
    const exists = await window.electron.exists(currentPath);
    if (!exists) {
      return { success: false, error: 'No file to backup' };
    }

    // 백업 파일명 생성 (timestamp)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = await getBackupDir();
    const backupPath = `${backupDir}/diary-${timestamp}.json`;

    // 현재 파일 읽기
    const readResult = await window.electron.readFile(currentPath);
    if (!readResult.success || !readResult.data) {
      return { success: false, error: 'Failed to read current file' };
    }

    // 백업 파일 쓰기
    const writeResult = await window.electron.writeFile(backupPath, readResult.data);
    
    if (writeResult.success) {
      console.log('✅ Backup created:', backupPath);
      return { success: true, backupPath };
    } else {
      return { success: false, error: writeResult.error };
    }
  } catch (error) {
    console.error('❌ Backup error:', error);
    return { success: false, error: String(error) };
  }
}

// ═══════════════════════════════════════════════════════
// 🔄 Migration: localStorage → File
// ═══════════════════════════════════════════════════════

/**
 * localStorage 데이터를 파일로 마이그레이션
 */
export async function migrateFromLocalStorage(
  storageKey: string,
  textDataKey: string,
  stylePrefKey: string
): Promise<{ success: boolean; error?: string }> {
  if (!window.electron) {
    return { success: false, error: 'Electron API not available' };
  }

  try {
    // localStorage에서 읽기
    const itemsStr = localStorage.getItem(storageKey);
    const textDataStr = localStorage.getItem(textDataKey);
    const stylePrefStr = localStorage.getItem(stylePrefKey);
    const linkDockStr = localStorage.getItem(LINK_DOCK_KEY);

    if (!itemsStr) {
      console.log('ℹ️ No localStorage data to migrate');
      return { success: true };
    }

    // 파싱
    const items: ScrapItem[] = JSON.parse(itemsStr);
    const textData: LayoutTextData = textDataStr ? JSON.parse(textDataStr) : {};
    const linkDockItems: LinkDockItem[] = linkDockStr ? JSON.parse(linkDockStr) : [];
    const stylePref: DiaryStyle = stylePrefStr ? JSON.parse(stylePrefStr) : {
      coverColor: '#ffffff',
      coverPattern: 'quilt',
      keyring: 'https://i.ibb.co/V0JFcWp8/0000-1.png',
      backgroundImage: ''
    };

    const migratedStylePref = migrateDiaryStyle(stylePref);

    console.log('🔄 Migrating from localStorage...');
    console.log('📦 Items:', items.length);

    // 파일로 저장
    const result = await saveDiaryToFile(items, textData, migratedStylePref, linkDockItems);

    if (result.success) {
      console.log('✅ Migration successful!');
      console.log('💡 localStorage data is still preserved (safe)');
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    return { success: false, error: String(error) };
  }
}

// ═══════════════════════════════════════════════════════
// 📜 백업 목록 조회
// ═══════════════════════════════════════════════════════

export interface BackupInfo {
  fileName: string;
  filePath: string;
  createdAt: Date;
  itemCount: number;
  size: string;
}

/**
 * 백업 디렉토리의 모든 백업 파일 목록 조회
 */
export async function listBackups(): Promise<BackupInfo[]> {
  if (!window.electron) {
    return [];
  }

  try {
    const backupDir = await getBackupDir();
    
    // 백업 디렉토리 존재 확인
    const dirExists = await window.electron.exists(backupDir);
    if (!dirExists) {
      console.log('📁 No backup directory found');
      return [];
    }

    // 백업 파일 목록 조회 (main.ts에 구현 필요)
    const files = await window.electron.listDirectory(backupDir);
    
    // JSON 파일만 필터링
    const backupFiles = files.filter((f: string) => f.endsWith('.json'));
    
    // 각 백업 파일 정보 조회
    const backups: BackupInfo[] = [];
    
    for (const fileName of backupFiles) {
      try {
        const filePath = `${backupDir}/${fileName}`;
        const result = await window.electron.readFile(filePath);
        
        if (result.success && result.data) {
          const data = JSON.parse(result.data) as DiaryData;
          const size = new Blob([result.data]).size;
          
          backups.push({
            fileName,
            filePath,
            createdAt: new Date(data.savedAt),
            itemCount: data.items.length,
            size: (size / 1024).toFixed(2) + ' KB',
          });
        }
      } catch (error) {
        console.error(`Failed to read backup ${fileName}:`, error);
      }
    }
    
    // 최신순 정렬
    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return backups;
  } catch (error) {
    console.error('❌ listBackups error:', error);
    return [];
  }
}

/**
 * 백업 파일에서 데이터 복원
 */
export async function restoreFromBackup(backupPath: string): Promise<{
  success: boolean;
  data?: DiaryData;
  error?: string;
}> {
  if (!window.electron) {
    return { success: false, error: 'Electron API not available' };
  }

  try {
    // 백업 파일 읽기
    const result = await window.electron.readFile(backupPath);
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to read backup' };
    }

    // 데이터 파싱
    const data = JSON.parse(result.data) as DiaryData;

    // stylePref 마이그레이션 (uiTokens 포함) - 안전장치
    if (data?.stylePref) {
      data.stylePref = migrateDiaryStyle(data.stylePref);
    }
    
    console.log('✅ Backup restored:', backupPath);
    console.log('📦 Items:', data.items.length);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Restore error:', error);
    return { success: false, error: String(error) };
  }
}

// ═══════════════════════════════════════════════════════
// 🔍 파일 정보
// ═══════════════════════════════════════════════════════

/**
 * 저장된 파일 정보 조회
 */
export async function getFileInfo(): Promise<{
  exists: boolean;
  path?: string;
  savedAt?: Date;
  itemCount?: number;
  size?: string;
} | null> {
  if (!window.electron) {
    return null;
  }

  try {
    const filePath = await getCurrentDiaryPath();
    const exists = await window.electron.exists(filePath);

    if (!exists) {
      return { exists: false };
    }

    // 파일 읽기
    const result = await window.electron.readFile(filePath);
    if (!result.success || !result.data) {
      return { exists: true, path: filePath };
    }

    // 정보 추출
    const data = JSON.parse(result.data) as DiaryData;
    const size = new Blob([result.data]).size;

    return {
      exists: true,
      path: filePath,
      savedAt: new Date(data.savedAt),
      itemCount: data.items.length,
      size: (size / 1024).toFixed(2) + ' KB',
    };
  } catch (error) {
    console.error('❌ getFileInfo error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// 📚 다이어리 관리자 함수들
// ═══════════════════════════════════════════════════════

/**
 * metadata.json 로드
 */
export async function loadMetadata(): Promise<DiariesMetadata> {
  if (!window.electron) {
    return { diaries: [] };
  }

  try {
    const metadataPath = await getMetadataPath();
    const exists = await window.electron.exists(metadataPath);

    if (!exists) {
      console.log('📝 No metadata.json found, starting fresh');
      return { diaries: [] };
    }

    const result = await window.electron.readFile(metadataPath);
    if (!result.success || !result.data) {
      return { diaries: [] };
    }

    const metadata = JSON.parse(result.data) as DiariesMetadata;
    console.log('✅ Loaded metadata:', metadata.diaries.length, 'diaries');
    return metadata;
  } catch (error) {
    console.error('❌ loadMetadata error:', error);
    return { diaries: [] };
  }
}

/**
 * metadata.json 저장
 */
export async function saveMetadata(metadata: DiariesMetadata): Promise<{ success: boolean; error?: string }> {
  if (!window.electron) {
    return { success: false, error: 'Electron API not available' };
  }

  try {
    const metadataPath = await getMetadataPath();
    const jsonStr = JSON.stringify(metadata, null, 2);
    const result = await window.electron.writeFile(metadataPath, jsonStr);

    if (result.success) {
      console.log('✅ Saved metadata:', metadata.diaries.length, 'diaries');
      return { success: true };
    } else {
      console.error('❌ Save metadata failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ saveMetadata error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 새 다이어리 생성
 */
export async function createDiary(name: string, color: string): Promise<{ success: boolean; diaryId?: string; error?: string }> {
  if (!window.electron) {
    return { success: false, error: 'Electron API not available' };
  }

  try {
    // 새 다이어리 ID 생성
    const timestamp = Date.now();
    const diaryId = `${timestamp}`;

    // metadata 로드
    const metadata = await loadMetadata();

    // 새 다이어리 메타데이터 추가
    const newDiary: DiaryMetadata = {
      id: diaryId,
      name,
      color,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    };

    metadata.diaries.push(newDiary);

    // metadata 저장
    const saveResult = await saveMetadata(metadata);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    // 빈 다이어리 파일 생성
    const emptyData: DiaryData = {
      version: '2.0.0',
      appVersion: '1.0.0',
      savedAt: timestamp,
      items: [],
      textData: {},
      stylePref: {
        coverColor: color,
        coverPattern: 'quilt',
        keyring: 'https://i.ibb.co/V0JFcWp8/0000-1.png',
        backgroundImage: '',
      },
      linkDockItems: [],
    };

    const diaryPath = await getDiaryPath(diaryId);
    const jsonStr = JSON.stringify(emptyData, null, 2);
    const writeResult = await window.electron.writeFile(diaryPath, jsonStr);

    if (writeResult.success) {
      console.log('✅ Created diary:', diaryId, name);
      return { success: true, diaryId };
    } else {
      return { success: false, error: writeResult.error };
    }
  } catch (error) {
    console.error('❌ createDiary error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 다이어리 삭제
 */
export async function deleteDiary(diaryId: string): Promise<{ success: boolean; error?: string }> {
  if (!window.electron) {
    return { success: false, error: 'Electron API not available' };
  }

  try {
    // metadata 로드
    const metadata = await loadMetadata();

    // 다이어리 제거
    metadata.diaries = metadata.diaries.filter(d => d.id !== diaryId);

    // metadata 저장
    const saveResult = await saveMetadata(metadata);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    // 파일 삭제는 일단 스킵 (나중에 구현)
    // TODO: window.electron.deleteFile(diaryPath)

    console.log('✅ Deleted diary:', diaryId);
    return { success: true };
  } catch (error) {
    console.error('❌ deleteDiary error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 특정 다이어리 로드
 */
export async function loadDiaryById(diaryId: string): Promise<DiaryData | null> {
  if (!window.electron) {
    console.warn('Electron API not available, returning null');
    return null;
  }

  try {
    const diaryPath = await getDiaryPath(diaryId);

    // 파일 존재 확인
    const exists = await window.electron.exists(diaryPath);
    if (!exists) {
      console.log('📝 Diary not found:', diaryId);
      return null;
    }

    // 파일 읽기
    const result = await window.electron.readFile(diaryPath);

    if (!result.success || !result.data) {
      console.error('❌ Load diary failed:', result.error);
      return null;
    }

    // JSON 파싱
    const data = JSON.parse(result.data) as DiaryData;

    // stylePref 마이그레이션
    if (data?.stylePref) {
      data.stylePref = migrateDiaryStyle(data.stylePref);
    }

    // items 마이그레이션
    if (data?.items) {
      data.items = migrateScrapItemsDecoration(data.items);
    }

    // linkDockItems 기본값
    if (!data.linkDockItems) {
      data.linkDockItems = [];
    }

    console.log('✅ Loaded diary:', diaryId, 'Items:', data.items?.length || 0);

    return data;
  } catch (error) {
    console.error('❌ loadDiaryById error:', error);
    return null;
  }
}

/**
 * 특정 다이어리 저장
 */
export async function saveDiaryById(
  diaryId: string,
  items: ScrapItem[],
  textData: LayoutTextData,
  stylePref: DiaryStyle,
  linkDockItems: LinkDockItem[] = []
): Promise<{ success: boolean; error?: string }> {
  if (!window.electron) {
    return { success: false, error: 'Electron API not available' };
  }

  try {
    const diaryPath = await getDiaryPath(diaryId);

    // 저장할 데이터 구성
    const data: DiaryData = {
      version: '2.0.0',
      appVersion: '1.0.0',
      savedAt: Date.now(),
      items,
      textData,
      stylePref,
      linkDockItems,
    };

    // JSON 문자열로 변환
    const jsonStr = JSON.stringify(data, null, 2);

    // 파일 쓰기
    const result = await window.electron.writeFile(diaryPath, jsonStr);

    if (result.success) {
      // metadata의 modified 시간 업데이트
      const metadata = await loadMetadata();
      const diary = metadata.diaries.find(d => d.id === diaryId);
      if (diary) {
        diary.modified = new Date().toISOString();
        await saveMetadata(metadata);
      }

      console.log('✅ Saved diary:', diaryId, 'Items:', items.length);
      return { success: true };
    } else {
      console.error('❌ Save diary failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ saveDiaryById error:', error);
    return { success: false, error: String(error) };
  }
}

