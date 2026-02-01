/**
 * 윈도우 컨트롤 IPC 핸들러
 */

import { ipcMain, BrowserWindow } from 'electron';

/**
 * 윈도우 컨트롤 IPC 핸들러 등록
 */
export function registerWindowHandlers() {
  // 윈도우 최소화
  ipcMain.handle('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.minimize();
      return { success: true };
    }
    return { success: false };
  });

  // 윈도우 닫기
  ipcMain.handle('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.close();
      return { success: true };
    }
    return { success: false };
  });
}





