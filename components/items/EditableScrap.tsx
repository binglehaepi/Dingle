import React, { useState } from 'react';
import { ScrapMetadata } from '../../types';

interface EditableScrapProps {
  data: ScrapMetadata;
  onSave?: (newData: Partial<ScrapMetadata>) => void;
}

const EditableScrap: React.FC<EditableScrapProps> = ({ data, onSave }) => {
  const [isEditing, setIsEditing] = useState(data.isEditable);
  const [localData, setLocalData] = useState(data);

  const handleBlur = () => {
    if (onSave) {
        onSave({ 
            title: localData.title, 
            description: localData.description,
            subtitle: localData.subtitle
        });
    }
    setIsEditing(false);
  };

  const toggleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
  };

  return (
    <div className="w-64 bg-paper p-3 pb-8 shadow-xl transform rotate-1 transition-all group relative border-texture-rough border-[3px]">
       {/* Polaroid-style visual */}
       <div className="w-full aspect-square bg-slate-100 mb-4 overflow-hidden relative">
          {localData.imageUrl && (
            <img src={localData.imageUrl} alt="scrap" className="w-full h-full object-cover mix-blend-multiply opacity-90" />
          )}
          {/* Internal shadow and gloss */}
          <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
          <div className="gloss-overlay opacity-50"></div>
       </div>

       <div className="px-1 text-center min-h-[80px] flex flex-col justify-center gap-1 relative z-10">
         {isEditing ? (
             <>
                <input 
                    className="w-full text-center font-bold font-handwriting text-2xl border-b border-slate-300 focus:outline-none focus:border-purple-500 bg-transparent text-pencil"
                    value={localData.title}
                    onChange={e => setLocalData({...localData, title: e.target.value})}
                    placeholder="Title..."
                    autoFocus
                />
                <input 
                    className="w-full text-center text-sm font-handwriting text-slate-500 border-b border-slate-300 focus:outline-none focus:border-purple-500 bg-transparent"
                    value={localData.subtitle}
                    onChange={e => setLocalData({...localData, subtitle: e.target.value})}
                    placeholder="Subtitle..."
                />
                <textarea 
                    className="w-full text-center text-lg font-handwriting text-slate-600 resize-none border-b border-slate-300 focus:outline-none focus:border-purple-500 bg-transparent"
                    value={localData.description}
                    onChange={e => setLocalData({...localData, description: e.target.value})}
                    placeholder="Description..."
                    rows={2}
                    onBlur={handleBlur}
                />
             </>
         ) : (
             <div onClick={toggleEdit} className="cursor-text group-hover:bg-yellow-50/50 p-2 rounded transition-colors">
                 <h3 className="font-handwriting font-bold text-3xl text-pencil leading-none rotate-[-1deg]">{localData.title}</h3>
                 <p className="font-handwriting text-sm text-slate-500 mt-1 mb-2">{localData.subtitle}</p>
                 <p className="font-handwriting text-xl text-slate-600 leading-tight">"{localData.description}"</p>
             </div>
         )}
       </div>

       {/* Tape Visual */}
       <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-yellow-200/80 rotate-[-2deg] shadow-sm backdrop-blur-sm mask-tape"></div>
    </div>
  );
};

export default EditableScrap;