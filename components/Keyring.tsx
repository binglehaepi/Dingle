import React, { useRef } from 'react';
import { KeyringFrameType } from '../types';

interface KeyringProps {
  charm: string; // Emoji or Image URL
  frameType?: KeyringFrameType; // 테두리 모양
  charmImage?: string; // 테두리 안에 넣을 이미지
  onCharmChange?: (newCharm: string) => void;
  onCharmImageChange?: (newImage: string) => void;
}

const Keyring: React.FC<KeyringProps> = ({ 
  charm, 
  frameType = 'rounded-square',
  charmImage,
  onCharmChange,
  onCharmImageChange 
}) => {
  const isImage = charm.startsWith('http') || charm.startsWith('data:');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const charmImageInputRef = useRef<HTMLInputElement>(null);
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

  const handleCharmImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onCharmImageChange) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onCharmImageChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCharmImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    charmImageInputRef.current?.click();
  };

  // 테두리 모양에 따른 스타일
  const getFrameStyle = () => {
    const baseStyle = {
      width: '64px',
      height: '64px',
      border: '1px solid var(--widget-border-color, rgba(148, 163, 184, 0.6))',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.5)',
      overflow: 'hidden',
      position: 'relative' as const,
    };

    switch (frameType) {
      case 'circle':
        return { ...baseStyle, borderRadius: '50%' };
      case 'heart':
        return { 
          ...baseStyle, 
          borderRadius: '0',
          clipPath: 'polygon(50% 100%, 15% 60%, 15% 35%, 25% 20%, 40% 15%, 50% 20%, 60% 15%, 75% 20%, 85% 35%, 85% 60%)',
          transform: 'scale(1.1)',
        };
      case 'rounded-square':
      default:
        return { ...baseStyle, borderRadius: '12px' };
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
      style={{
        filter: 'drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.15))',
        transition: 'all 0.3s ease'
      }}
    >
       {/* 1. 고급 클립 (금속 질감) */}
       <div 
         className="w-5 h-7 rounded-full relative transition-all duration-300 group-hover:scale-110"
         style={{ 
           border: '3px solid var(--keyring-main)',
           background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%)',
           boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
         }}
       >
         {/* 금속 하이라이트 */}
         <div 
           className="absolute top-1 left-1 w-2 h-2 rounded-full"
           style={{ 
             background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), transparent)',
           }}
         />
       </div>

       {/* 2. 향상된 체인 (3 links - 금속 질감) */}
       {[0, 1, 2].map((i) => (
         <div 
           key={i}
           className="-mt-0.5 w-2.5 h-4 rounded-full transition-all duration-300"
           style={{ 
             border: '2px solid var(--keyring-main)',
             background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%)',
             boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.4)',
             animationDelay: `${i * 0.05}s`
           }}
         />
       ))}

       {/* 3. The Charm (테두리 + 이미지) */}
       <div 
           data-charm
           className="-mt-0.5 relative group-active:scale-95 transition-all duration-300 cursor-pointer"
           onClick={handleCharmImageClick}
           onTouchEnd={(e) => {
               e.preventDefault();
               handleCharmImageClick(e);
           }}
           style={{
             filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))'
           }}
       >
           {/* 테두리 프레임 */}
           <div 
             className="transform transition-all duration-300 group-hover:rotate-12 group-hover:scale-110"
             style={getFrameStyle()}
           >
             {/* 테두리 안 이미지 */}
             {charmImage ? (
               <img 
                 src={charmImage} 
                 alt="charm decoration" 
                 className="w-full h-full object-cover"
                 style={{
                   position: 'absolute',
                   top: 0,
                   left: 0,
                 }}
               />
             ) : (
               <div 
                 className="w-full h-full flex items-center justify-center text-gray-300 text-xs"
                 style={{
                   background: 'var(--widget-surface-background, #ffffff)',
                 }}
               >
                 클릭하여<br/>사진 추가
               </div>
             )}
           </div>
           
           {/* 반짝임 효과 */}
           <div 
             className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping pointer-events-none"
             style={{
               background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8), transparent)',
               animationDuration: '3s'
             }}
           />
       </div>
       
       {/* Hidden file inputs */}
       <input 
         type="file" 
         ref={fileInputRef} 
         className="hidden" 
         accept="image/*" 
         onChange={handleImageUpload} 
       />
       <input 
         type="file" 
         ref={charmImageInputRef} 
         className="hidden" 
         accept="image/*" 
         onChange={handleCharmImageUpload} 
       />
    </div>
  );
};

export default Keyring;