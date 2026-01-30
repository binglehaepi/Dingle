import React, { useMemo, useState } from 'react';
import type { DiaryStyle, UITokenKey, UITokens } from '../types';
import { DEFAULT_UI_TOKENS } from '../constants/appConstants';

interface ThemeEditorProps {
  diaryStyle: DiaryStyle;
  setDiaryStyle: React.Dispatch<React.SetStateAction<DiaryStyle>>;
}

// NOTE:
// - 이 컴포넌트는 개발/디자인 튜닝용 툴입니다(App.tsx에서 항상 렌더링).
// - 레거시 변수(--desk-bg 등) 직접 편집은 허용하지 않습니다.
// - UI 액션 토큰(--ui-*)만 편집하여 테마 저장 구조(DiaryStyle)에 반영합니다.

const UI_TOKEN_FIELDS: Array<{ label: string; key: UITokenKey; description?: string }> = [
  { label: 'Primary BG', key: '--ui-primary-bg', description: 'bg-[var(--ui-primary-bg)]' },
  { label: 'Primary Text', key: '--ui-primary-text', description: 'text-[var(--ui-primary-text)]' },
  { label: 'Primary Hover', key: '--ui-primary-hover', description: 'hover:bg-[var(--ui-primary-hover)]' },

  { label: 'Danger BG', key: '--ui-danger-bg' },
  { label: 'Danger Text', key: '--ui-danger-text' },
  { label: 'Danger Hover', key: '--ui-danger-hover' },

  { label: 'Success BG', key: '--ui-success-bg' },
  { label: 'Success Text', key: '--ui-success-text' },
  { label: 'Success Hover', key: '--ui-success-hover' },

  { label: 'Sunday Text', key: '--ui-sunday-text', description: 'WeeklySpread Sunday' },
];

export default function ThemeEditor({ diaryStyle, setDiaryStyle }: ThemeEditorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const uiTokens: UITokens = {
    ...DEFAULT_UI_TOKENS,
    ...(diaryStyle.uiTokens || {}),
  };

  const setToken = (key: UITokenKey, value: string) => {
    setDiaryStyle(prev => ({
      ...prev,
      uiTokens: {
        ...DEFAULT_UI_TOKENS,
        ...(prev.uiTokens || {}),
        [key]: value,
      },
    }));
  };

  const panelStyle = useMemo<React.CSSProperties>(
    () => ({
      backgroundColor: 'var(--widget-surface-background, #ffffff)',
      borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
      color: 'var(--text-color-primary, #764737)',
    }),
    []
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] p-3 rounded-full shadow-lg border transition-transform hover:scale-110"
        style={{
          backgroundColor: 'var(--ui-primary-bg)',
          color: 'var(--ui-primary-text)',
          borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
        }}
        title="Theme Editor"
      >
        🎨
      </button>
    );
  }

  return (
    <div
      className="fixed top-4 right-4 z-[9999] w-80 backdrop-blur-md border rounded-xl shadow-2xl p-4 max-h-[85vh] overflow-y-auto font-sans"
      style={panelStyle}
    >
      <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))' }}>
        <h3 className="font-bold">🎨 테마 수정</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="px-2 text-lg"
          style={{ color: 'var(--text-color-primary, #764737)' }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div className="text-xs font-bold" style={{ opacity: 0.8 }}>
          UI 토큰 편집 (저장/로드 경로 포함)
        </div>

        {UI_TOKEN_FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold">
              <label>{f.label}</label>
              <span style={{ opacity: 0.8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                {uiTokens[f.key]}
              </span>
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={uiTokens[f.key]?.trim().startsWith('#') ? uiTokens[f.key].trim() : '#ffffff'}
                onChange={(e) => setToken(f.key, e.target.value)}
                className="w-10 h-8 p-0 border-0 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={uiTokens[f.key] || ''}
                onChange={(e) => setToken(f.key, e.target.value)}
                className="flex-1 text-xs border rounded px-2 py-1 bg-transparent outline-none"
                style={{ borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))', color: 'var(--text-color-primary, #764737)' }}
              />
            </div>

            {f.description && (
              <div className="text-[10px]" style={{ opacity: 0.65 }}>
                {f.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


