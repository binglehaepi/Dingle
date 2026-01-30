import React, { useRef } from 'react';

interface KeyringProps {
  charm: string; // Emoji or Image URL
  onCharmChange?: (newCharm: string) => void;
}

const Keyring: React.FC<KeyringProps> = ({ charm, onCharmChange }) => {
  const isImage = charm.startsWith('http') || charm.startsWith('data:');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCharmClick = () => {
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

  return (
    <div className="absolute top-[80px] -left-[22px] z-[60] flex flex-col items-center animate-swing cursor-pointer group">
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
           className="-mt-0.5 relative group-active:scale-95 transition-transform"
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