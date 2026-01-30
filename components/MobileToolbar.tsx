import React, { useState } from 'react';
import DecorationSelector from './DecorationSelector';
import { ScrapType, ScrapMetadata, PageSide } from '../types';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

interface MobileToolbarProps {
  onSave: () => void;
  onClear: () => void;
  onBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDecoration: (type: ScrapType, metadata: ScrapMetadata) => void;
  onMonthSelect?: (monthIndex: number) => void;
  onScrapPageOpen?: () => void;
  backgroundInputRef: React.RefObject<HTMLInputElement>;
  currentMonth?: number;
  isScrapPage?: boolean;
  activeSide?: PageSide; // 📱 현재 활성 페이지
}

const MobileToolbar: React.FC<MobileToolbarProps> = ({
  onSave,
  onClear,
  onBackgroundUpload,
  onDecoration,
  onMonthSelect,
  onScrapPageOpen,
  backgroundInputRef,
  currentMonth,
  isScrapPage,
  activeSide = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  return (
    <>
      {/* 월 선택 버튼 (좌측 하단) - 더 눈에 띄게 */}
      {onMonthSelect && (
        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="fixed z-[100] w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full shadow-2xl flex items-center justify-center text-sm font-bold text-white hover:scale-110 active:scale-95 transition-all"
          style={{
            left: 'max(16px, env(safe-area-inset-left))',
            bottom: 'max(16px, env(safe-area-inset-bottom))',
            boxShadow: '0 8px 32px rgba(236, 72, 153, 0.5), 0 4px 16px rgba(0, 0, 0, 0.2)',
          }}
          title="월 선택"
        >
          {isScrapPage ? '⭐' : (currentMonth !== undefined ? MONTHS[currentMonth] : 'M')}
        </button>
      )}

      {/* FAB 메뉴 버튼 (우측 하단) - 더 눈에 띄게 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-[100] w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all"
        style={{
          right: 'max(16px, env(safe-area-inset-right))',
          bottom: 'max(16px, env(safe-area-inset-bottom))',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.5), 0 4px 16px rgba(0, 0, 0, 0.2)',
        }}
        title="메뉴"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>

      {/* 월 선택 패널 */}
      {showMonthPicker && onMonthSelect && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-[90] animate-fadeIn"
            onClick={() => setShowMonthPicker(false)}
          />
          
          <div 
            className="fixed left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[95] p-6 pb-8 animate-slideUp"
            style={{
              bottom: 0,
              paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
            }}
          >
            <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-4" />
            <h3 className="text-center text-lg font-bold text-stone-800 mb-4">월 선택</h3>
            
            {/* 월 그리드 */}
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto mb-4">
              {MONTHS.map((month, index) => (
                <button
                  key={month}
                  onClick={() => {
                    onMonthSelect(index);
                    setShowMonthPicker(false);
                  }}
                  className={`
                    py-3 px-2 rounded-lg font-bold text-sm transition-all
                    ${currentMonth === index && !isScrapPage
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }
                  `}
                >
                  {month}
                </button>
              ))}
            </div>
            
            {/* 스크랩 페이지 버튼 */}
            {onScrapPageOpen && (
              <button
                onClick={() => {
                  onScrapPageOpen();
                  setShowMonthPicker(false);
                }}
                className={`
                  w-full py-3 rounded-lg font-bold transition-all
                  ${isScrapPage
                    ? 'bg-yellow-400 text-white'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }
                `}
              >
                ⭐ 스크랩북 페이지
              </button>
            )}
          </div>
        </>
      )}

      {/* BottomSheet */}
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <div 
            className="fixed inset-0 bg-black/30 z-[90] animate-fadeIn"
            onClick={() => setIsOpen(false)}
          />
          
          {/* BottomSheet 패널 */}
          <div 
            className="fixed left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[95] p-6 pb-8 animate-slideUp"
            style={{
              bottom: 0,
              paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
            }}
          >
            {/* 핸들 */}
            <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-6" />
            
            {/* 현재 페이지 표시 */}
            <div className="text-center text-sm text-stone-500 mb-3">
              현재 페이지: <span className="font-bold text-stone-800">{activeSide === 'left' ? '← 왼쪽' : '오른쪽 →'}</span>
            </div>

            {/* 메뉴 그리드 */}
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              
              {/* 스티커/테이프 */}
              <div className="flex flex-col items-center">
                <DecorationSelector onSelect={onDecoration} />
                <span className="text-xs text-stone-500 mt-2">스티커</span>
              </div>

              {/* 배경 변경 */}
              <button 
                onClick={() => backgroundInputRef.current?.click()}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-600 hover:bg-green-100 active:scale-95 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs text-stone-500 mt-2">배경</span>
              </button>

              {/* 저장 */}
              <button 
                onClick={() => {
                  onSave();
                  setIsOpen(false);
                }}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-100 active:scale-95 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                </div>
                <span className="text-xs text-stone-500 mt-2">저장</span>
              </button>

              {/* 삭제 */}
              <button 
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-600 hover:bg-red-100 active:scale-95 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs text-stone-500 mt-2">지우기</span>
              </button>

            </div>

            <input 
              type="file" 
              ref={backgroundInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={onBackgroundUpload} 
            />
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default MobileToolbar;

