import React, { useState, useRef } from 'react';
import { ScrapMetadata } from '../../types';
import { compressImage } from '../../services/imageUtils';

interface ProfileWidgetProps {
  data: ScrapMetadata;
  onUpdate: (newData: Partial<ScrapMetadata>) => void;
}

const ProfileWidget: React.FC<ProfileWidgetProps> = ({ data, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(data.profileConfig?.name || "My Name");
  const [status, setStatus] = useState(data.profileConfig?.status || "Current Mood...");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdate({
      profileConfig: {
        name,
        status,
        tags: data.profileConfig?.tags || []
      }
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
          const result = await compressImage(e.target.files[0], 300, 0.7);
          onUpdate({ imageUrl: result });
      } catch (err) {
          console.error("Profile image upload failed", err);
      }
    }
  };

  return (
    <div
      className="w-64 rounded-xl shadow-lg border p-4 flex flex-col items-center gap-3 relative group"
      style={{
        backgroundColor: 'var(--widget-surface-background, #ffffff)',
        borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
        color: 'var(--text-color-primary, #764737)',
      }}
    >
       {/* ID Card Hole */}
       <div
         className="absolute top-2 w-8 h-1 rounded-full"
         style={{ backgroundColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))', opacity: 0.35 }}
       ></div>

       {/* Photo */}
       <div 
         className="w-24 h-24 rounded-full border-4 shadow-inner overflow-hidden cursor-pointer relative group/photo"
         onClick={() => fileInputRef.current?.click()}
         style={{
           backgroundColor: 'rgba(0,0,0,0.04)',
           borderColor: 'rgba(255,255,255,0.35)',
         }}
       >
          <img src={data.imageUrl} alt="Profile" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
             <span className="text-white text-xs font-bold">Change</span>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
       </div>

       {/* Info */}
       <div className="w-full text-center">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input 
                className="text-center font-bold text-lg rounded border w-full focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--widget-input-background, #f8fafc)',
                  borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                  color: 'var(--text-color-primary, #764737)',
                  boxShadow: '0 0 0 2px transparent',
                }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
              />
              <input 
                className="text-center text-xs rounded border w-full focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--widget-input-background, #f8fafc)',
                  borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                  color: 'var(--text-color-primary, #764737)',
                  opacity: 0.8,
                }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Mood"
              />
              <button
                onClick={handleSave}
                className="text-xs py-1 rounded w-full"
                style={{
                  backgroundColor: 'var(--ui-primary-bg, #3b82f6)',
                  color: 'var(--ui-primary-text, #ffffff)',
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <div onDoubleClick={() => setIsEditing(true)}>
              <h3 className="font-handwriting font-bold text-2xl" style={{ color: 'var(--text-color-primary, #764737)' }}>{name}</h3>
              <p className="font-handwriting text-sm mt-1" style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.75 }}>"{status}"</p>
            </div>
          )}
       </div>

       {/* Edit Hint */}
       {!isEditing && (
         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setIsEditing(true)} className="text-xs" style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.5 }}>✏️</button>
         </div>
       )}
    </div>
  );
};

export default ProfileWidget;