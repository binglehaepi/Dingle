/**
 * 다이어리 관리 IPC 핸들러
 */

import { ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { getDiaryDir } from '../utils/paths';

// 현재 overlay에서 열린 다이어리 ID
let currentDiaryId: string | null = null;

export function setCurrentDiaryId(id: string | null) {
  currentDiaryId = id;
}

export function getCurrentDiaryId(): string | null {
  return currentDiaryId;
}

/**
 * 다이어리 IPC 핸들러 등록
 */
export function registerDiaryHandlers() {
  // 다이어리 목록
  ipcMain.handle('diary:list', async () => {
    try {
      const metadataPath = path.join(getDiaryDir(), 'metadata.json');
      const exists = await fs.access(metadataPath).then(() => true).catch(() => false);
      
      if (!exists) {
        return { success: true, diaries: [] };
      }

      const data = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(data);
      return { success: true, diaries: metadata.diaries || [] };
    } catch (error) {
      console.error('diary:list failed:', error);
      return { success: false, error: String(error), diaries: [] };
    }
  });

  // 다이어리 생성
  ipcMain.handle('diary:create', async (_event, name: string, color: string, coverPattern?: string) => {
    try {
      console.log('[diary:create] Starting...', { name, color, coverPattern });
      
      const timestamp = Date.now();
      const diaryId = `${timestamp}`;
      
      // 디렉토리 확인 및 생성
      const diaryDir = getDiaryDir();
      console.log('[diary:create] Diary directory:', diaryDir);
      
      try {
        await fs.access(diaryDir);
      } catch {
        console.log('[diary:create] Creating diary directory...');
        await fs.mkdir(diaryDir, { recursive: true });
      }
      
      // metadata 로드
      const metadataPath = path.join(diaryDir, 'metadata.json');
      console.log('[diary:create] Metadata path:', metadataPath);
      
      let metadata: any = { diaries: [] };
      
      const exists = await fs.access(metadataPath).then(() => true).catch(() => false);
      if (exists) {
        console.log('[diary:create] Loading existing metadata...');
        const data = await fs.readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(data);
      } else {
        console.log('[diary:create] No existing metadata, will create new');
      }

      // 새 다이어리 추가
      const newDiary = {
        id: diaryId,
        name,
        color,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        coverPattern: coverPattern || 'solid',
        keyring: '🔑', // 기본 키링
      };
      metadata.diaries.push(newDiary);
      console.log('[diary:create] New diary added to metadata:', newDiary);

      // metadata 저장
      console.log('[diary:create] Saving metadata...');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

      // 빈 다이어리 파일 생성
      const diaryPath = path.join(diaryDir, `diary-${diaryId}.json`);
      console.log('[diary:create] Creating diary file:', diaryPath);
      
      const emptyData = {
        version: '2.0.0',
        appVersion: '1.0.0',
        savedAt: timestamp,
        items: [],
        textData: {},
        stylePref: {
          coverColor: color,
          coverPattern: 'quilt',
          keyring: '🔑',
          backgroundImage: '',
        },
        linkDockItems: [],
      };
      await fs.writeFile(diaryPath, JSON.stringify(emptyData, null, 2), 'utf-8');

      console.log('[diary:create] ✅ Success! Created diary:', diaryId, name);
      return { success: true, diaryId };
    } catch (error) {
      console.error('[diary:create] ❌ Failed:', error);
      return { success: false, error: String(error) };
    }
  });

  // 다이어리 삭제
  ipcMain.handle('diary:delete', async (_event, diaryId: string) => {
    try {
      // metadata 로드
      const metadataPath = path.join(getDiaryDir(), 'metadata.json');
      const data = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(data);

      // 다이어리 제거
      metadata.diaries = metadata.diaries.filter((d: any) => d.id !== diaryId);

      // metadata 저장
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

      // 파일 삭제
      const diaryPath = path.join(getDiaryDir(), `diary-${diaryId}.json`);
      await fs.unlink(diaryPath).catch(() => {}); // 파일이 없어도 무시

      console.log('[diary] Deleted:', diaryId);
      return { success: true };
    } catch (error) {
      console.error('diary:delete failed:', error);
      return { success: false, error: String(error) };
    }
  });

  // 다이어리 로드
  ipcMain.handle('diary:load', async (_event, diaryId: string) => {
    try {
      const diaryPath = path.join(getDiaryDir(), `diary-${diaryId}.json`);
      const data = await fs.readFile(diaryPath, 'utf-8');
      const diaryData = JSON.parse(data);
      
      console.log('[diary] Loaded:', diaryId, 'Items:', diaryData.items?.length || 0);
      return { success: true, data: diaryData };
    } catch (error) {
      console.error('diary:load failed:', error);
      return { success: false, error: String(error) };
    }
  });

  // 다이어리 저장
  ipcMain.handle('diary:save', async (_event, diaryId: string, data: any) => {
    try {
      const diaryPath = path.join(getDiaryDir(), `diary-${diaryId}.json`);
      await fs.writeFile(diaryPath, JSON.stringify(data, null, 2), 'utf-8');

      // metadata의 modified 시간 업데이트
      const metadataPath = path.join(getDiaryDir(), 'metadata.json');
      const metadataExists = await fs.access(metadataPath).then(() => true).catch(() => false);
      
      if (metadataExists) {
        const metadataData = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataData);
        const diary = metadata.diaries.find((d: any) => d.id === diaryId);
        if (diary) {
          diary.modified = new Date().toISOString();
          await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        }
      }

      console.log('[diary] Saved:', diaryId, 'Items:', data.items?.length || 0);
      return { success: true };
    } catch (error) {
      console.error('diary:save failed:', error);
      return { success: false, error: String(error) };
    }
  });

  // 오버레이에서 다이어리 열기
  ipcMain.handle('diary:openInOverlay', async (_event, diaryId: string) => {
    try {
      console.log('[diary] Opening in overlay:', diaryId);
      currentDiaryId = diaryId;
      
      // setDisplayMode를 호출하려면 main.ts에서 import 해야 함
      // 일단 성공만 반환
      return { success: true };
    } catch (error) {
      console.error('diary:openInOverlay failed:', error);
      return { success: false, error: String(error) };
    }
  });

  // 현재 다이어리 ID 가져오기
  ipcMain.handle('diary:getCurrentId', async () => {
    return { success: true, diaryId: currentDiaryId };
  });

  // 정적 HTML로 내보내기
  ipcMain.handle('diary:exportToStaticHTML', async (_event, diaryId: string, options: {
    includeMonthlyCover?: boolean;
    includeEmbeds?: boolean;
  }) => {
    try {
      console.log('[diary:exportToStaticHTML] Starting export...', { diaryId, options });

      // 1. 다이어리 데이터 로드
      const diaryPath = path.join(getDiaryDir(), `diary-${diaryId}.json`);
      const data = await fs.readFile(diaryPath, 'utf-8');
      const diaryData = JSON.parse(data);
      const items = diaryData.items || [];

      console.log('[diary:exportToStaticHTML] Loaded diary data, items:', items.length);

      // 2. 날짜별로 아이템 그룹화
      const dateGroups: Record<string, any[]> = {};
      items.forEach((item: any) => {
        const dateKey = item.diaryDate || '2024-01-01'; // fallback
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = [];
        }
        dateGroups[dateKey].push(item);
      });

      const dates = Object.keys(dateGroups).sort();
      console.log('[diary:exportToStaticHTML] Dates found:', dates.length);

      // 3. 숨겨진 BrowserWindow 생성
      const isDev = process.env.NODE_ENV === 'development';
      const indexPath = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../../dist/index.html')}`;

      const hiddenWin = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        webPreferences: {
          preload: path.join(__dirname, '../preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
        }
      });

      console.log('[diary:exportToStaticHTML] Hidden window created');

      // 4. 각 페이지의 HTML 추출
      const pages: any[] = [];

      // 4a. 월간 뷰 추출 (선택)
      if (options.includeMonthlyCover && dates.length > 0) {
        try {
          const firstDate = dates[0];
          const [year, month] = firstDate.split('-');
          const monthDate = `${year}-${month}-01`;
          
          const monthlyURL = isDev
            ? `${indexPath}?windowMode=overlay&diaryId=${diaryId}&date=${monthDate}&layout=monthly`
            : `${indexPath}?windowMode=overlay&diaryId=${diaryId}&date=${monthDate}&layout=monthly`;

          console.log('[diary:exportToStaticHTML] Loading monthly view:', monthlyURL);
          await hiddenWin.loadURL(monthlyURL);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 렌더링 대기

          const monthlyData = await hiddenWin.webContents.executeJavaScript(`
            (function() {
              const root = document.getElementById('root');
              if (!root) return { html: '', styles: '' };
              
              // 모든 style 태그 수집
              const styles = Array.from(document.querySelectorAll('style')).map(s => s.innerHTML).join('\\n');
              
              // CSS Variables 수집
              const computedStyle = getComputedStyle(document.documentElement);
              const cssVars = {};
              Array.from(computedStyle).filter(prop => prop.startsWith('--')).forEach(prop => {
                cssVars[prop] = computedStyle.getPropertyValue(prop);
              });
              
              return {
                html: root.outerHTML,
                styles: styles,
                cssVars: cssVars
              };
            })()
          `);

          pages.push({
            type: 'monthly',
            html: monthlyData.html,
            styles: monthlyData.styles,
            cssVars: monthlyData.cssVars,
            dates: dates
          });

          console.log('[diary:exportToStaticHTML] Monthly view extracted');
        } catch (error) {
          console.error('[diary:exportToStaticHTML] Failed to extract monthly view:', error);
        }
      }

      // 4b. 각 날짜의 스크랩북 페이지 추출
      for (const date of dates) {
        try {
          const scrapURL = isDev
            ? `${indexPath}?windowMode=overlay&diaryId=${diaryId}&date=${date}`
            : `${indexPath}?windowMode=overlay&diaryId=${diaryId}&date=${date}`;

          console.log('[diary:exportToStaticHTML] Loading scrapbook for date:', date);
          await hiddenWin.loadURL(scrapURL);
          await new Promise(resolve => setTimeout(resolve, 1500)); // 렌더링 대기

          const pageData = await hiddenWin.webContents.executeJavaScript(`
            (function() {
              const root = document.getElementById('root');
              if (!root) return { html: '', styles: '' };
              
              const styles = Array.from(document.querySelectorAll('style')).map(s => s.innerHTML).join('\\n');
              
              const computedStyle = getComputedStyle(document.documentElement);
              const cssVars = {};
              Array.from(computedStyle).filter(prop => prop.startsWith('--')).forEach(prop => {
                cssVars[prop] = computedStyle.getPropertyValue(prop);
              });
              
              return {
                html: root.outerHTML,
                styles: styles,
                cssVars: cssVars
              };
            })()
          `);

          pages.push({
            type: 'scrapbook',
            date: date,
            html: pageData.html,
            styles: pageData.styles,
            cssVars: pageData.cssVars
          });

          console.log('[diary:exportToStaticHTML] Extracted page for:', date);
        } catch (error) {
          console.error('[diary:exportToStaticHTML] Failed to extract page for', date, error);
        }
      }

      // 5. 로컬 이미지를 Base64로 변환
      for (const page of pages) {
        page.html = await convertImagesToBase64(page.html);
      }

      // 6. 단일 HTML 파일로 조합
      const { combinePages } = await import('../services/staticHTMLTemplate.js');
      const finalHTML = combinePages(pages, diaryData.stylePref, options.includeEmbeds !== false);

      // 7. 창 정리
      hiddenWin.close();

      console.log('[diary:exportToStaticHTML] ✅ Export completed, HTML size:', finalHTML.length);
      return { success: true, html: finalHTML };

    } catch (error) {
      console.error('[diary:exportToStaticHTML] ❌ Failed:', error);
      return { success: false, error: String(error) };
    }
  });
}

/**
 * 로컬 이미지를 Base64로 변환
 */
async function convertImagesToBase64(html: string): Promise<string> {
  const imgRegex = /<img[^>]+src=["']file:\/\/([^"']+)["']/g;
  let result = html;
  const matches = Array.from(html.matchAll(imgRegex));

  for (const match of matches) {
    try {
      const filePath = decodeURIComponent(match[1]);
      const base64 = await fs.readFile(filePath, { encoding: 'base64' });
      const ext = path.extname(filePath).slice(1) || 'png';
      const dataUrl = `data:image/${ext};base64,${base64}`;
      result = result.replace(match[0], match[0].replace(match[1], dataUrl).replace('file://', ''));
    } catch (error) {
      console.warn('[convertImagesToBase64] Failed to convert image:', match[1], error);
    }
  }

  return result;
}

