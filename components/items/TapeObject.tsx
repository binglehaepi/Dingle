import React from 'react';
import { ScrapMetadata } from '../../types';

interface TapeObjectProps {
  data: ScrapMetadata;
}

const TapeObject: React.FC<TapeObjectProps> = ({ data }) => {
  const color = data.tapeConfig?.color || 'rgba(255, 200, 200, 0.7)';
  
  return (
    <div 
        className="w-[180px] h-[30px] shadow-sm backdrop-blur-[1px] flex items-center justify-center relative cursor-grab tape-edge"
        style={{ backgroundColor: color }}
    >
        {/* Tape Texture / Pattern */}
        {data.tapeConfig?.pattern === 'grid' && (
             <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_19px,rgba(255,255,255,0.3)_20px),repeating-linear-gradient(0deg,transparent,transparent_19px,rgba(255,255,255,0.3)_20px)]"></div>
        )}
        {data.tapeConfig?.pattern === 'stripe' && (
             <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.1),rgba(255,255,255,0.1)_10px,transparent_10px,transparent_20px)]"></div>
        )}
        
        {/* Noise Texture */}
        <div className="texture-overlay opacity-30 mix-blend-overlay"></div>
    </div>
  );
};

export default TapeObject;