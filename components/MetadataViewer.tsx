import React, { useState, useMemo, useCallback } from 'react';
import { ScrapItem, LayoutTextData, DiaryStyle } from '../types';
import { generateJsonLd } from '../services/metadataGenerator';

interface MetadataViewerProps {
  items: ScrapItem[];
  textData: LayoutTextData;
  diaryStyle: DiaryStyle;
}

// schema.org @type → 이모지 매핑
const TYPE_ICON: Record<string, string> = {
  VideoObject: '🎬',
  ImageObject: '🖼️',
  Article: '📝',
  MusicRecording: '🎵',
  SocialMediaPosting: '💬',
  Book: '📚',
  Event: '🎫',
  Invoice: '🧾',
  CreativeWork: '📎',
};

function getTypeIcon(schemaType: string): string {
  return TYPE_ICON[schemaType] || '📎';
}

// 복사 완료 피드백용 타입
type CopyState = Record<string, boolean>;

const MetadataViewer: React.FC<MetadataViewerProps> = ({ items, textData, diaryStyle }) => {
  // JSON-LD 파싱
  const jsonLd = useMemo(() => {
    try {
      const str = generateJsonLd(items, textData, diaryStyle);
      return JSON.parse(str);
    } catch {
      return null;
    }
  }, [items, textData, diaryStyle]);

  // 아코디언 열림 상태
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());

  // dpiPrompt 편집 상태 (날짜 키 → 편집된 텍스트)
  const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({});

  // 복사 피드백 상태
  const [copyState, setCopyState] = useState<CopyState>({});

  const toggleDate = useCallback((dateKey: string) => {
    setOpenDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  }, []);

  const handlePromptChange = useCallback((dateKey: string, value: string) => {
    setEditedPrompts((prev) => ({ ...prev, [dateKey]: value }));
  }, []);

  const handleCopy = useCallback(async (dateKey: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState((prev) => ({ ...prev, [dateKey]: true }));
      setTimeout(() => {
        setCopyState((prev) => ({ ...prev, [dateKey]: false }));
      }, 2000);
    } catch (err) {
      console.error('[MetadataViewer] Copy failed:', err);
    }
  }, []);

  if (!jsonLd || !jsonLd.hasPart || jsonLd.hasPart.length === 0) {
    return (
      <div
        className="text-xs text-center py-4"
        style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.5 }}
      >
        메타데이터가 없습니다
      </div>
    );
  }

  const collections: any[] = jsonLd.hasPart;

  return (
    <div className="space-y-1.5">
      {/* 다이어리 타이틀 */}
      <div
        className="text-xs font-bold px-1 mb-2"
        style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.8 }}
      >
        {jsonLd.name || '다이어리 메타데이터'}
      </div>

      {collections.map((collection: any, idx: number) => {
        const dateKey = collection.name || `group-${idx}`;
        const isOpen = openDates.has(dateKey);
        const itemsPart: any[] = collection.hasPart || [];
        const currentPrompt = editedPrompts[dateKey] ?? collection.dpiPrompt ?? '';
        const isCopied = copyState[dateKey] || false;

        return (
          <div
            key={dateKey}
            className="rounded-lg overflow-hidden"
            style={{
              border: '1px solid',
              borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.6))',
            }}
          >
            {/* 아코디언 헤더 */}
            <button
              onClick={() => toggleDate(dateKey)}
              className="w-full px-3 py-2 flex items-center gap-2 hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: 'var(--widget-input-background, #f8fafc)',
              }}
            >
              <span
                className="text-[10px] transition-transform"
                style={{
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                }}
              >
                ▶
              </span>
              <span
                className="text-xs font-semibold flex-1 text-left"
                style={{ color: 'var(--text-color-primary, #764737)' }}
              >
                {dateKey}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.3))',
                  color: 'var(--text-color-primary, #764737)',
                }}
              >
                {itemsPart.length}개
              </span>
            </button>

            {/* 아코디언 컨텐츠 */}
            {isOpen && (
              <div
                className="px-3 py-2 space-y-2"
                style={{
                  backgroundColor: 'var(--note-paper-background, #f7f5ed)',
                  borderTop: '1px solid',
                  borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.4))',
                }}
              >
                {/* 아이템 목록 */}
                <div className="space-y-1">
                  {itemsPart.map((item: any, itemIdx: number) => (
                    <div
                      key={itemIdx}
                      className="flex items-start gap-1.5 py-1"
                    >
                      <span className="text-xs flex-shrink-0 mt-px">
                        {getTypeIcon(item['@type'])}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-medium truncate"
                          style={{ color: 'var(--text-color-primary, #764737)' }}
                        >
                          {item.name || '제목 없음'}
                        </div>
                        {item.keywords && item.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {item.keywords.map((kw: string, kwIdx: number) => (
                              <span
                                key={kwIdx}
                                className="text-[9px] px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: 'rgba(148, 163, 184, 0.2)',
                                  color: 'var(--text-color-primary, #764737)',
                                  opacity: 0.7,
                                }}
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.description && (
                          <div
                            className="text-[10px] mt-0.5 truncate"
                            style={{
                              color: 'var(--text-color-primary, #764737)',
                              opacity: 0.5,
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* dpiPrompt 편집 영역 */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.6 }}
                    >
                      AI 프롬프트
                    </span>
                    <button
                      onClick={() => handleCopy(dateKey, currentPrompt)}
                      className="text-[10px] px-2 py-0.5 rounded-md hover:opacity-70 transition-opacity"
                      style={{
                        backgroundColor: isCopied
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'var(--widget-input-background, #f8fafc)',
                        border: '1px solid',
                        borderColor: isCopied
                          ? 'rgba(34, 197, 94, 0.4)'
                          : 'var(--ui-stroke-color, rgba(148, 163, 184, 0.4))',
                        color: isCopied
                          ? 'rgb(22, 163, 74)'
                          : 'var(--text-color-primary, #764737)',
                      }}
                    >
                      {isCopied ? '✓ 복사됨' : '📋 복사'}
                    </button>
                  </div>
                  <textarea
                    value={currentPrompt}
                    onChange={(e) => handlePromptChange(dateKey, e.target.value)}
                    className="w-full text-[11px] p-2 rounded-lg resize-none outline-none"
                    style={{
                      backgroundColor: 'var(--widget-input-background, #f8fafc)',
                      border: '1px solid',
                      borderColor: 'var(--ui-stroke-color, rgba(148, 163, 184, 0.4))',
                      color: 'var(--text-color-primary, #764737)',
                      minHeight: '60px',
                      lineHeight: '1.5',
                    }}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MetadataViewer;
