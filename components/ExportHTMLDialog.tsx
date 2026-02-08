import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ScrapItem, LayoutTextData, DiaryStyle, LinkDockItem } from '../types';
import { generateStandaloneHTML, preprocessItemsForExport, preprocessTextDataForExport, preprocessDiaryStyleForExport } from '../services/htmlExport';
import MetadataViewer from './MetadataViewer';

interface ExportHTMLDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: ScrapItem[];
  textData: LayoutTextData;
  diaryStyle: DiaryStyle;
  linkDockItems?: LinkDockItem[];
}

type ExportState = 'idle' | 'generating' | 'success' | 'error';

/**
 * localStorage에서 전광판(marquee) 텍스트와 오하아사 별자리를 읽어 textData에 주입합니다.
 * 전광판 텍스트와 오하아사 별자리는 LayoutTextData가 아닌 localStorage에만 저장되므로,
 * 내보내기 전에 해당 값을 DASHBOARD 엔트리의 marqueeText/ohaasaSign 필드에 삽입합니다.
 */
function injectLocalStorageDataToTextData(textData: LayoutTextData): LayoutTextData {
  const td: LayoutTextData = JSON.parse(JSON.stringify(textData));

  // 오하아사 별자리 (전역 - 월별이 아닌 단일 값)
  let ohaasaSign: string | null = null;
  try {
    ohaasaSign = localStorage.getItem('dingel:ohaasa:selectedSign');
  } catch (e) {
    // localStorage 접근 실패 무시
  }

  for (const key of Object.keys(td)) {
    // "YYYY-MM-DASHBOARD" 형태의 키에서 YYYY-MM 추출
    const match = key.match(/^(\d{4}-\d{2})-DASHBOARD$/);
    if (!match) continue;

    const monthKey = match[1]; // e.g. "2026-02"
    const entry = td[key] as Record<string, any>;

    // 전광판 텍스트
    const storageKey = `dingel:calendarMarquee:${monthKey}`;
    try {
      const marqueeText = localStorage.getItem(storageKey);
      if (marqueeText) {
        entry.marqueeText = marqueeText;
      }
    } catch (e) {
      // localStorage 접근 실패 무시
    }

    // 오하아사 별자리
    if (ohaasaSign) {
      entry.ohaasaSign = ohaasaSign;
    }
  }

  return td;
}

/** 메타데이터 확인 펼침 섹션 */
const MetadataSection: React.FC<{
  items: ScrapItem[];
  textData: LayoutTextData;
  diaryStyle: DiaryStyle;
}> = ({ items, textData, diaryStyle }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: '1.5px solid',
        borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.6))',
      }}
    >
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center gap-2 hover:opacity-80 transition-opacity"
        style={{
          backgroundColor: 'var(--widget-input-background, #f8fafc)',
        }}
      >
        <span className="text-base">📋</span>
        <span
          className="text-sm font-semibold flex-1 text-left"
          style={{ color: 'var(--text-color-primary, #764737)' }}
        >
          메타데이터 확인
        </span>
        <span
          className="text-xs transition-transform"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
            color: 'var(--text-color-primary, #764737)',
            opacity: 0.5,
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          className="px-3 py-3 overflow-y-auto"
          style={{
            maxHeight: '300px',
            borderTop: '1px solid',
            borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.4))',
            backgroundColor: 'var(--note-paper-background, #f7f5ed)',
          }}
        >
          <MetadataViewer items={items} textData={textData} diaryStyle={diaryStyle} />
        </div>
      )}
    </div>
  );
};

const ExportHTMLDialog: React.FC<ExportHTMLDialogProps> = ({
  isOpen,
  onClose,
  items,
  textData,
  diaryStyle,
  linkDockItems,
}) => {
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewHTML, setPreviewHTML] = useState<string>('');

  // 모달 열릴 때 미리보기 생성
  useEffect(() => {
    if (!isOpen) {
      setExportState('idle');
      setErrorMessage('');
      setProgressMessage('');
      setPreviewHTML('');
      return;
    }

    // 미리보기 HTML 생성 (비동기 — 스티커/이미지 인라인 + marquee 주입 포함)
    (async () => {
      try {
        const textDataWithMarquee = injectLocalStorageDataToTextData(textData);
        const [processedItems, processedTextData, processedStyle] = await Promise.all([
          preprocessItemsForExport(items),
          preprocessTextDataForExport(textDataWithMarquee),
          preprocessDiaryStyleForExport(diaryStyle),
        ]);
        // ── 진단 로깅: 이미지/데이터 확인 ──
        console.log('[ExportHTML] === 진단 로그 ===');
        for (const key of Object.keys(processedTextData)) {
          const entry = processedTextData[key];
          if (!entry) continue;
          const imgFields = ['profileImage', 'photoUrl', 'coverImage', 'dDayBgImage', 'cdBodyBgImage', 'bucketBgImage', 'monthHeaderBg'];
          const found = imgFields.filter(f => !!(entry as any)[f]);
          if (found.length > 0) {
            console.log(`  ${key}: 이미지 필드 [${found.join(', ')}] (${found.map(f => {
              const v = (entry as any)[f] as string;
              return f + '=' + v.substring(0, 30) + '...[len=' + v.length + ']';
            }).join(', ')})`);
          }
          // marqueeText 확인
          if ((entry as any).marqueeText) {
            console.log(`  ${key}: marqueeText="${(entry as any).marqueeText}"`);
          }
        }
        console.log('[ExportHTML] diaryStyle.keyringImage:',
          processedStyle.keyringImage ? processedStyle.keyringImage.substring(0, 40) + '...[len=' + processedStyle.keyringImage.length + ']' : 'EMPTY');
        console.log('[ExportHTML] diaryStyle.keyring:', processedStyle.keyring || 'EMPTY');
        console.log('[ExportHTML] diaryStyle.compactMode:', processedStyle.compactMode);
        console.log('[ExportHTML] diaryStyle.uiPalette:', JSON.stringify(processedStyle.uiPalette || {}).substring(0, 200));

        const html = generateStandaloneHTML(processedItems, processedTextData, processedStyle, linkDockItems);
        console.log('[ExportHTML] 생성된 HTML 크기:', html.length, 'bytes');
        console.log('[ExportHTML] data:image 포함:', (html.match(/data:image/g) || []).length, '개');
        console.log('[ExportHTML] === 진단 로그 끝 ===');

        setPreviewHTML(html);
      } catch (err) {
        console.error('[ExportHTMLDialog] Preview generation failed:', err);
      }
    })();
  }, [isOpen, items, textData, diaryStyle, linkDockItems]);

  // iframe에 미리보기 로드
  useEffect(() => {
    if (previewHTML && iframeRef.current) {
      const blob = new Blob([previewHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [previewHTML]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // HTML 다운로드 (프리뷰 HTML을 그대로 재사용 → 프리뷰와 다운로드 100% 동일 보장)
  const handleDownload = useCallback(async () => {
    if (!previewHTML) {
      console.warn('[ExportHTML] previewHTML이 아직 생성되지 않았습니다.');
      return;
    }

    setExportState('generating');
    setProgressMessage('HTML 파일을 저장하고 있어요...');
    setErrorMessage('');

    // 프리뷰에서 이미 생성된 HTML을 그대로 사용 (다이얼로그가 열린 동안 데이터 변경 불가)
    const html = previewHTML;

    // 진단 로깅 — 프리뷰/다운로드 동일성 + CSS 변수 검증
    console.log('[ExportHTML] Download HTML size:', html.length, '| previewHTML size:', previewHTML.length, '| 동일:', html === previewHTML);
    console.log('[ExportHTML] Has data:image:', html.includes('data:image'));
    console.log('[ExportHTML] Has marqueeText:', html.includes('dg-marquee__text'));
    // CSS 변수 충돌 검증: :root 블록 갯수와 커스텀 테마 변수 확인
    const rootBlockCount = (html.match(/:root\s*\{/g) || []).length;
    console.log('[ExportHTML] :root 블록 수:', rootBlockCount, '(1이어야 정상 — buildCSSVariables만)');
    // 사용자 테마 주요 변수 검증
    const widgetBorderMatch = html.match(/--widget-border-color:\s*([^;]+);/);
    const strokeMatch = html.match(/--ui-stroke-color:\s*([^;]+);/);
    console.log('[ExportHTML] --widget-border-color:', widgetBorderMatch?.[1]?.trim() || 'NOT FOUND');
    console.log('[ExportHTML] --ui-stroke-color:', strokeMatch?.[1]?.trim() || 'NOT FOUND');

    try {
      // Electron 환경
      if (typeof window !== 'undefined' && (window as any).electron?.saveHTML) {
        setProgressMessage('저장 위치를 선택해주세요...');
        const result = await (window as any).electron.saveHTML(html);
        if (result.success) {
          setExportState('success');
          setProgressMessage('');
        } else if (result.canceled) {
          setExportState('idle');
          setProgressMessage('');
        } else {
          throw new Error(result.error || '저장에 실패했습니다.');
        }
      }
      // Electron 환경이지만 saveHTML이 없는 경우 → showSaveDialog + writeFile 사용
      else if (typeof window !== 'undefined' && (window as any).electron?.showSaveDialog) {
        setProgressMessage('저장 위치를 선택해주세요...');
        const dialogResult = await (window as any).electron.showSaveDialog({
          defaultPath: 'my-diary.html',
          filters: [{ name: 'HTML Files', extensions: ['html'] }],
        });
        if (dialogResult.canceled || !dialogResult.filePath) {
          setExportState('idle');
          setProgressMessage('');
          return;
        }
        const writeResult = await (window as any).electron.writeFile(dialogResult.filePath, html);
        if (writeResult.success) {
          setExportState('success');
          setProgressMessage('');
        } else {
          throw new Error(writeResult.error || '파일 저장에 실패했습니다.');
        }
      }
      // 웹 환경 — Blob 다운로드
      else {
        setProgressMessage('다운로드를 준비하고 있어요...');
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-diary.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportState('success');
        setProgressMessage('');
      }
    } catch (err) {
      console.error('[ExportHTMLDialog] Export failed:', err);
      setExportState('error');
      setErrorMessage(String(err));
      setProgressMessage('');
    }
  }, [previewHTML]);

  if (!isOpen) return null;

  const itemCount = items.length;
  const dateCount = new Set(items.map(i => i.diaryDate).filter(Boolean)).size;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[20000]"
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--note-paper-background, #f7f5ed)',
          border: '1.5px solid',
          borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.6))',
        }}
      >
        {/* ── Header ── */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.6))',
          }}
        >
          <h3
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: 'var(--text-color-primary, #764737)' }}
          >
            <span className="text-2xl">🌐</span>
            내 사이트 만들기
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
            disabled={exportState === 'generating'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* ── Content ── */}
        <div className="p-6 flex flex-col gap-4">
          {/* 미리보기 */}
          <div
            className="rounded-xl overflow-hidden relative"
            style={{
              border: '1.5px solid',
              borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.6))',
              aspectRatio: '1100 / 820',
              backgroundColor: '#ffffff',
            }}
          >
            {previewHTML ? (
              <iframe
                ref={iframeRef}
                title="미리보기"
                sandbox="allow-same-origin allow-scripts"
                className="absolute top-0 left-0 border-0"
                style={{
                  width: '250%',
                  height: '250%',
                  transform: 'scale(0.4)',
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-sm" style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.5 }}>
                  미리보기 생성 중...
                </div>
              </div>
            )}
          </div>

          {/* 다운로드 버튼 */}
          <button
            onClick={handleDownload}
            disabled={exportState === 'generating'}
            className="w-full px-4 py-4 rounded-xl text-left hover:opacity-90 transition-all flex items-center gap-3"
            style={{
              backgroundColor: exportState === 'success'
                ? 'rgba(34, 197, 94, 0.15)'
                : 'var(--widget-surface-background, #ffffff)',
              border: '1.5px solid',
              borderColor: exportState === 'success'
                ? 'rgba(34, 197, 94, 0.4)'
                : 'var(--ui-stroke-color, rgba(148, 163, 184, 0.6))',
              opacity: exportState === 'generating' ? 0.6 : 1,
              cursor: exportState === 'generating' ? 'not-allowed' : 'pointer',
            }}
          >
            <span className="text-3xl">
              {exportState === 'generating' ? '⏳' : exportState === 'success' ? '✅' : '💾'}
            </span>
            <div className="flex-1">
              <div
                className="text-base font-semibold"
                style={{ color: 'var(--text-color-primary, #764737)' }}
              >
                {exportState === 'generating'
                  ? 'HTML 생성 중...'
                  : exportState === 'success'
                    ? '저장 완료!'
                    : 'HTML 다운로드'}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.7 }}
              >
                {exportState === 'generating'
                  ? progressMessage
                  : exportState === 'success'
                    ? '브라우저에서 파일을 열어보세요'
                    : '다이어리를 HTML 파일로 저장합니다'}
              </div>
            </div>
          </button>

          {/* 온라인 공유 버튼 (비활성) */}
          <button
            disabled
            className="w-full px-4 py-4 rounded-xl text-left flex items-center gap-3"
            style={{
              backgroundColor: 'var(--widget-surface-background, #ffffff)',
              border: '1.5px solid',
              borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.6))',
              opacity: 0.45,
              cursor: 'not-allowed',
            }}
          >
            <span className="text-3xl">🔗</span>
            <div className="flex-1">
              <div
                className="text-base font-semibold flex items-center gap-2"
                style={{ color: 'var(--text-color-primary, #764737)' }}
              >
                온라인으로 공유하기
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    color: 'rgb(168, 85, 247)',
                  }}
                >
                  준비 중
                </span>
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.7 }}
              >
                URL로 다이어리를 공유할 수 있어요
              </div>
            </div>
          </button>

          {/* 메타데이터 확인 (펼침 섹션) */}
          <MetadataSection items={items} textData={textData} diaryStyle={diaryStyle} />

          {/* 에러 메시지 */}
          {exportState === 'error' && errorMessage && (
            <div
              className="p-4 rounded-xl whitespace-pre-line text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--text-color-primary, #764737)',
              }}
            >
              ❌ {errorMessage}
            </div>
          )}

          {/* 안내 */}
          <div
            className="p-3 rounded-lg text-xs"
            style={{
              backgroundColor: 'var(--widget-input-background, #f8fafc)',
              color: 'var(--text-color-primary, #764737)',
              opacity: 0.7,
            }}
          >
            💡 생성된 HTML 파일은 브라우저에서 바로 열 수 있어요. 인터넷 연결 없이도 작동합니다.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportHTMLDialog;

