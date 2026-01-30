import React, { useState } from 'react';
import { DEFAULT_THEMES, Theme } from '../../constants/themes';

interface UIPanelProps {
  onClose: () => void;
  onApplyTheme: (theme: Theme) => void;
  onShowAdvanced: () => void;
}

const UIPanel: React.FC<UIPanelProps> = ({
  onClose,
  onApplyTheme,
  onShowAdvanced,
}) => {
  return (
    <div className="h-full flex flex-col" style={{
      backgroundColor: 'var(--widget-surface-background, #ffffff)',
      color: 'var(--text-color-primary, #764737)',
    }}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between" style={{
        borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
      }}>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.747 18.747 0 00-3.471 2.987 10.04 10.04 0 014.815 4.815 18.748 18.748 0 002.987-3.472l3.386-5.079A1.902 1.902 0 0020.599 1.5zm-8.3 14.025a18.76 18.76 0 001.896-1.207 8.026 8.026 0 00-4.513-4.513A18.75 18.75 0 008.475 11.7l-.278.5a5.26 5.26 0 013.601 3.602l.502-.278zM6.75 13.5A3.75 3.75 0 003 17.25a1.5 1.5 0 01-1.601 1.497.75.75 0 00-.7 1.123 5.25 5.25 0 009.8-2.62 3.75 3.75 0 00-3.75-3.75z" clipRule="evenodd" />
          </svg>
          꾸미기
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
          title="닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 1. 테마 선택 */}
        <section className="mb-6">
          <h4 className="text-sm font-semibold mb-3 pb-2 border-b" style={{
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          }}>
            테마
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onApplyTheme(theme)}
                className="p-3 rounded-lg border hover:shadow-lg transition-all group"
                style={{
                  borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                }}
              >
                {/* 테마 색상 미리보기 */}
                <div className="flex gap-1 mb-2">
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: theme.palette.primary }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: theme.palette.secondary }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: theme.palette.accent }}
                  />
                </div>
                
                {/* 테마 이름 */}
                <div className="text-xs font-semibold mb-1">{theme.name}</div>
                <div className="text-[10px] opacity-60">{theme.description}</div>
              </button>
            ))}
          </div>
        </section>

        {/* 2. 연동 사진 관리 */}
        <section className="mb-6">
          <h4 className="text-sm font-semibold mb-3 pb-2 border-b" style={{
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          }}>
            연동 사진
          </h4>
          
          <button
            className="w-full px-4 py-3 rounded-lg border text-left hover:bg-stone-50 transition-colors flex items-center gap-3"
            style={{
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="font-medium">사진 추가</div>
              <div className="text-xs opacity-70">달력, 페이지, 위젯에 사진 추가</div>
            </div>
          </button>
        </section>

        {/* 3. 스티커 관리 */}
        <section className="mb-6">
          <h4 className="text-sm font-semibold mb-3 pb-2 border-b" style={{
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          }}>
            스티커
          </h4>
          
          <button
            className="w-full px-4 py-3 rounded-lg border text-left hover:bg-stone-50 transition-colors flex items-center gap-3"
            style={{
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <div className="flex-1">
              <div className="font-medium">스티커 추가</div>
              <div className="text-xs opacity-70">귀여운 스티커로 꾸미기</div>
            </div>
          </button>
        </section>

        {/* 4. 고급 모드 */}
        <section>
          <button
            onClick={onShowAdvanced}
            className="w-full px-4 py-3 rounded-lg border text-left hover:bg-purple-50 transition-colors flex items-center gap-3"
            style={{
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="font-medium">고급 모드 (1:1 매핑)</div>
              <div className="text-xs opacity-70">세밀한 색상 조정</div>
            </div>
          </button>
        </section>
      </div>
    </div>
  );
};

export default UIPanel;

