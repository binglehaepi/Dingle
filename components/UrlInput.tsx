import React, { useState, useRef } from 'react';

interface UrlInputProps {
  onScrap: (url: string) => void;
  onUpload: (file: File) => void;
  onCreateOpen: () => void;
  isLoading: boolean;
  className?: string; // Allow absolute positioning from parent
}

const UrlInput: React.FC<UrlInputProps> = ({ onScrap, onUpload, onCreateOpen, isLoading, className = '' }) => {
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onScrap(url);
      setUrl('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onUpload(e.target.files[0]);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  return (
    <div data-ui="linkbar" className={`z-40 w-[220px] bg-white/80 border border-stone-300 rounded-lg shadow-sm px-2 py-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex-1 relative">
            <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={isLoading ? "스크랩 중..." : "링크를 붙여넣으세요"}
                className="w-full bg-white border border-stone-300 focus:border-purple-400 outline-none text-[11px] font-handwriting text-stone-800 placeholder-stone-400/60 px-2.5 py-1.5 rounded-lg transition-colors touch-manipulation"
                disabled={isLoading}
            />
            {isLoading && (
               <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <span className="w-3 h-3 block border-2 border-stone-300 border-t-purple-500 rounded-full animate-spin"></span>
               </div>
            )}
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
            />
            <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    fileInputRef.current?.click();
                }}
                className="text-stone-500 hover:text-stone-700 hover:bg-stone-100 active:scale-95 transition-all p-1.5 rounded-lg touch-manipulation"
                title="Upload Photo"
                disabled={isLoading}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </button>
            <button 
                type="button" 
                onClick={onCreateOpen}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    onCreateOpen();
                }}
                className="text-stone-500 hover:text-stone-700 hover:bg-stone-100 active:scale-95 transition-all p-1.5 rounded-lg touch-manipulation"
                title="Write Note"
                disabled={isLoading}
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            </button>
        </div>
      </div>
    </div>
  );
};

export default UrlInput;