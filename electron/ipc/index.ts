/**
 * 모든 IPC 핸들러 등록
 */

import { BrowserWindow } from 'electron';
import { registerDiaryHandlers } from './diaryHandlers';
import { registerFileHandlers } from './fileHandlers';
import { registerWindowHandlers } from './windowHandlers';

/**
 * 모든 IPC 핸들러 등록
 */
export function registerAllHandlers(getAppWin: () => BrowserWindow | null) {
  registerDiaryHandlers();
  registerFileHandlers(getAppWin);
  registerWindowHandlers();
  
  console.log('[IPC] All handlers registered');
}

// Re-export useful functions
export { setCurrentDiaryId, getCurrentDiaryId } from './diaryHandlers';






