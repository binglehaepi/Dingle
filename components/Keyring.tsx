import React, { useRef } from 'react';

interface KeyringProps {
  charm: string; // Emoji or Image URL
  onCharmChange?: (newCharm: string) => void;
}

const Keyring: React.FC<KeyringProps> = ({ charm, onCharmChange }) => {
  const isImage = charm.startsWith('http') || charm.startsWith('data:');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);

  const handleCharmClick = () => {
    // 드래그 중이었다면 클릭 무시
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    if (onCharmChange) {
      fileInputRef.current?.click();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onCharmChange) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onCharmChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 창 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!window.electron?.send) return;
    
    // Charm 클릭은 드래그하지 않음
    const target = e.target as HTMLElement;
    if (target.closest('[data-charm]')) return;
    
    e.preventDefault();
    isDraggingRef.current = false;
    
    const startX = e.screenX;
    const startY = e.screenY;
    let hasMoved = false;
    
    window.electron.send('window:dragStart', e.screenX, e.screenY);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = Math.abs(moveEvent.screenX - startX);
      const dy = Math.abs(moveEvent.screenY - startY);
      if (dx > 5 || dy > 5) {
        hasMoved = true;
        isDraggingRef.current = true;
      }
      window.electron.send?.('window:dragMove', moveEvent.screenX, moveEvent.screenY);
    };
    
    const handleMouseUp = () => {
      window.electron.send?.('window:dragEnd');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 드래그하지 않았다면 isDraggingRef를 false로 복원
      if (!hasMoved) {
        isDraggingRef.current = false;
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 더블클릭으로 background 모드 전환
  const handleDoubleClick = async () => {
    if (!window.electron?.windowSetDisplayMode) return;
    
    try {
      await window.electron.windowSetDisplayMode('background');
      console.log('[Keyring] Switched to background mode via double-click');
    } catch (error) {
      console.error('[Keyring] Failed to switch mode:', error);
    }
  };

  return (
    <div 
      className="absolute top-[80px] -left-[22px] z-[60] flex flex-col items-center animate-swing cursor-move group"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      title="드래그: 창 이동 | 더블클릭: 목록으로 돌아가기"
    >
       {/* 1. 미니멀 클립 */}
       <div className="w-4 h-6 rounded-full relative" style={{ border: '2px solid var(--keyring-main)', background: 'transparent' }}>
       </div>

       {/* 2. 미니멀 체인 (4 links - 넓게) */}
       <div className="-mt-0.5 w-2 h-4 rounded-full" style={{ border: '1.5px solid var(--keyring-main)' }}></div>
       <div className="-mt-0.5 w-2 h-4 rounded-full" style={{ border: '1.5px solid var(--keyring-main)' }}></div>
       <div className="-mt-0.5 w-2 h-4 rounded-full" style={{ border: '1.5px solid var(--keyring-main)' }}></div>
       <div className="-mt-0.5 w-2 h-4 rounded-full" style={{ border: '1.5px solid var(--keyring-main)' }}></div>

       {/* 3. The Charm (클릭 가능) */}
       <div 
           data-charm
           className="-mt-0.5 relative group-active:scale-95 transition-transform cursor-pointer"
           onClick={handleCharmClick}
           onTouchEnd={(e) => {
               e.preventDefault();
               handleCharmClick();
           }}
       >
           {isImage ? (
               <div className="w-14 h-14 relative transform transition-transform group-hover:rotate-6">
                   <img src={charm} alt="charm" className="w-full h-full object-contain rounded-lg" style={{ border: '2px solid var(--keyring-accent)' }} />
               </div>
           ) : (
               <div className="text-4xl transform transition-transform group-hover:rotate-6">
                   {charm}
               </div>
           )}
       </div>
       
       {/* Hidden file input */}
       <input 
         type="file" 
         ref={fileInputRef} 
         className="hidden" 
         accept="image/*" 
         onChange={handleImageUpload} 
       />
    </div>
  );
};

export default Keyring;