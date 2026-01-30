import React, { useState, useRef } from 'react';
import { LayoutType } from '../../types';

interface MobileFABProps {
  onAddSticker: () => void;
  onAddLink: (url: string) => Promise<void>;
  onAddImage: (file: File) => Promise<void>;
  onAddVideo: (file: File) => Promise<void>;
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

const MobileFAB: React.FC<MobileFABProps> = ({
  onAddSticker,
  onAddLink,
  onAddImage,
  onAddVideo,
  currentLayout,
  onLayoutChange,
  currentDate,
  onDateChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleLinkSubmit = async () => {
    if (!linkUrl.trim()) return;
    await onAddLink(linkUrl);
    setLinkUrl('');
    setShowLinkInput(false);
    setIsOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImage(file);
      setIsOpen(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddVideo(file);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* 월/달력 선택 버튼 (좌측 하단) - 배경톤 디자인 */}
      <button
        onClick={() => setShowMonthPicker(!showMonthPicker)}
        className="fixed z-[100] w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-200 rounded-full shadow-lg flex items-center justify-center text-sm font-bold text-amber-900 hover:scale-110 active:scale-95 transition-all border-2 border-amber-300/50"
        style={{
          left: 'max(16px, env(safe-area-inset-left))',
          bottom: 'max(16px, env(safe-area-inset-bottom))',
          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
        title="월 선택"
      >
        📅
      </button>

      {/* FAB 추가 버튼 (우측 하단) - 배경톤 디자인 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-[100] w-16 h-16 bg-gradient-to-br from-stone-200 to-stone-300 rounded-full shadow-lg flex items-center justify-center text-stone-700 hover:scale-110 active:scale-95 transition-all border-2 border-stone-400/50"
        style={{
          right: 'max(16px, env(safe-area-inset-right))',
          bottom: 'max(16px, env(safe-area-inset-bottom))',
          boxShadow: '0 4px 20px rgba(120, 113, 108, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
        title="추가"
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
      {showMonthPicker && (
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
                    const newDate = new Date(currentDate);
                    newDate.setMonth(index);
                    onDateChange(newDate);
                    onLayoutChange('monthly');
                    setShowMonthPicker(false);
                  }}
                  className={`
                    py-3 px-2 rounded-lg font-bold text-sm transition-all
                    ${currentDate.getMonth() === index && currentLayout === 'monthly'
                      ? 'bg-[var(--ui-primary-bg)] text-[var(--ui-primary-text)] shadow-lg'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }
                  `}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 추가 BottomSheet */}
      {isOpen && !showLinkInput && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-[90] animate-fadeIn"
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className="fixed left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[95] p-6 pb-8 animate-slideUp"
            style={{
              bottom: 0,
              paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
            }}
          >
            <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-6" />
            <h3 className="text-center text-lg font-bold text-stone-800 mb-4">아이템 추가</h3>
            
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              {/* 링크 */}
              <button 
                onClick={() => setShowLinkInput(true)}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-100 active:scale-95 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <span className="text-xs text-stone-500 mt-2">링크</span>
              </button>

              {/* 이미지 */}
              <button 
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-600 hover:bg-green-100 active:scale-95 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs text-stone-500 mt-2">이미지</span>
              </button>

              {/* 동영상 */}
              <button 
                onClick={() => videoInputRef.current?.click()}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-100 active:scale-95 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs text-stone-500 mt-2">동영상</span>
              </button>

              {/* 스티커 */}
              <button 
                onClick={() => {
                  onAddSticker();
                  setIsOpen(false);
                }}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 hover:bg-yellow-100 active:scale-95 transition-all text-2xl">
                  ⭐
                </div>
                <span className="text-xs text-stone-500 mt-2">스티커</span>
              </button>
            </div>

            <input 
              type="file" 
              ref={imageInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
            <input 
              type="file" 
              ref={videoInputRef} 
              className="hidden" 
              accept="video/*" 
              onChange={handleVideoUpload} 
            />
          </div>
        </>
      )}

      {/* 링크 입력 BottomSheet */}
      {showLinkInput && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-[90] animate-fadeIn"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
          />
          
          <div 
            className="fixed left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[95] p-6 pb-8 animate-slideUp"
            style={{
              bottom: 0,
              paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
            }}
          >
            <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-6" />
            <h3 className="text-center text-lg font-bold text-stone-800 mb-4">링크 추가</h3>
            
            <div className="max-w-md mx-auto">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 border-2 border-stone-300 rounded-lg focus:border-indigo-500 focus:outline-none mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLinkSubmit();
                }}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkUrl('');
                  }}
                  className="flex-1 py-3 bg-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleLinkSubmit}
                  disabled={!linkUrl.trim()}
                  className="flex-1 py-3 bg-[var(--ui-primary-bg)] text-[var(--ui-primary-text)] rounded-lg font-medium hover:bg-[var(--ui-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  추가
                </button>
              </div>
            </div>
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

export default MobileFAB;

