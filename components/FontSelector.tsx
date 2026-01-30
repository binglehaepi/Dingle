import React, { useState, useEffect } from 'react';
import { FontId } from '../types';
import { DEFAULT_FONT_ID, FONT_IDS } from '../constants/fonts';

interface FontOption {
  id: FontId;
  name: string;
  description: string;
  fontFamily: string;
}

// ✅ 단일 소스: index.html의 [data-font="..."]와 동일 집합(4종)
const FONT_META: Record<FontId, Omit<FontOption, 'id'>> = {
  noto: {
    name: 'Noto Sans KR',
    description: '기본 UI 폰트',
    fontFamily: '"Noto Sans KR", system-ui, sans-serif',
  },
  gmarket: {
    name: 'Gmarket Sans',
    description: '선명한 산세리프',
    fontFamily: '"Gmarket Sans", sans-serif',
  },
  gyeonggi: {
    name: 'Gyeonggi Batang',
    description: '차분한 세리프',
    fontFamily: '"Gyeonggi Batang", serif',
  },
  cafe24: {
    name: 'Cafe24 Dongdong',
    description: '개성 있는 손글씨 느낌',
    fontFamily: '"Cafe24 Dongdong", sans-serif',
  },
};

const FONT_OPTIONS: FontOption[] = FONT_IDS.map((id) => ({ id, ...FONT_META[id] }));

interface FontSelectorProps {
  currentFont?: FontId;
  onFontChange: (fontId: FontId) => void;
}

export default function FontSelector({ currentFont = DEFAULT_FONT_ID, onFontChange }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFont, setSelectedFont] = useState<FontId>(currentFont);

  useEffect(() => {
    setSelectedFont(currentFont);
  }, [currentFont]);

  const handleFontSelect = (fontId: FontId) => {
    setSelectedFont(fontId);
    onFontChange(fontId);
    
    // 문서 전체에 폰트 적용
    const rootElement = document.querySelector('[data-font]') || document.body;
    rootElement.setAttribute('data-font', fontId);
  };

  const handleCustomFontUpload = () => {
    // TODO: 추후 구현 예정 - 파일 업로드 로직
    alert('커스텀 폰트 업로드 기능은 추후 지원 예정입니다! 🎨');
  };

  // 축소 모드일 때는 작은 버튼만 표시
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-[9998] bg-white text-stone-600 p-3 rounded-full shadow-lg border-2 border-stone-200 hover:scale-110 hover:text-purple-500 transition-all"
        title="폰트 설정"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9998] w-80 bg-white/95 backdrop-blur-md border-2 border-blue-300 rounded-xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto font-sans">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4 border-b border-blue-100 pb-2">
        <h3 className="font-bold text-stone-800">🔤 폰트 선택</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-stone-400 hover:text-red-500 px-2"
        >
          ✕
        </button>
      </div>

      {/* 폰트 리스트 */}
      <div className="space-y-3">
        {FONT_OPTIONS.map((font) => (
          <button
            key={font.id}
            onClick={() => handleFontSelect(font.id)}
            className={`
              w-full p-4 rounded-lg border-2 transition-all text-left
              hover:border-blue-400 hover:bg-blue-50
              ${
                selectedFont === font.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-stone-200 bg-white'
              }
            `}
          >
            <div className="flex items-center justify-between">
              {/* 폰트 정보 */}
              <div className="flex-1">
                {/* 폰트 이름 (해당 폰트로 표시) */}
                <div
                  className="text-lg font-medium text-stone-800 mb-1"
                  style={{ fontFamily: font.fontFamily }}
                >
                  {font.name}
                </div>
                
                {/* 미리보기 텍스트 (해당 폰트로 표시) */}
                <div
                  className="text-sm text-stone-600 mb-1"
                  style={{ fontFamily: font.fontFamily }}
                >
                  가나다라 ABC 123
                </div>
                
                {/* 설명 (기본 폰트) */}
                <div className="text-xs text-stone-400">
                  {font.description}
                </div>
              </div>

              {/* 선택 아이콘 */}
              {selectedFont === font.id && (
                <div className="ml-3 flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}

        {/* 커스텀 폰트 추가 버튼 */}
        <button
          onClick={handleCustomFontUpload}
          className="w-full p-4 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 hover:border-blue-400 hover:bg-blue-50 transition-all"
        >
          <div className="flex items-center justify-center gap-2 text-stone-500 hover:text-blue-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">내 폰트 추가하기</span>
          </div>
          <div className="text-xs text-stone-400 text-center mt-1">
            .ttf, .otf 파일 지원 (준비중)
          </div>
        </button>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-4 pt-4 border-t border-blue-100">
        <p className="text-[10px] text-stone-400 text-center leading-relaxed">
          선택한 폰트는 다이어리 전체에 적용됩니다.<br />
          커스텀 폰트 업로드 기능은 추후 업데이트 예정입니다.
        </p>
      </div>
    </div>
  );
}

