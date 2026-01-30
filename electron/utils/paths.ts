/**
 * 경로 관리 유틸리티
 */

import { app } from 'electron';
import path from 'path';

/**
 * 다이어리 저장 디렉토리
 */
export function getDiaryDir(): string {
  return path.join(app.getPath('documents'), 'ScrapDiary');
}

/**
 * 현재 다이어리 파일 경로 (레거시)
 */
export function getCurrentDiaryFile(): string {
  return path.join(getDiaryDir(), 'current.json');
}

/**
 * 특정 다이어리 파일 경로
 */
export function getDiaryFile(diaryId: string): string {
  return path.join(getDiaryDir(), `diary-${diaryId}.json`);
}

/**
 * metadata.json 경로
 */
export function getMetadataFile(): string {
  return path.join(getDiaryDir(), 'metadata.json');
}

/**
 * 백업 디렉토리
 */
export function getBackupDir(): string {
  return path.join(getDiaryDir(), 'backups');
}



