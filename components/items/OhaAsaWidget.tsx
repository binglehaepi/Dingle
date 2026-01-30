import React from 'react';
import { ScrapMetadata } from '../../types';

interface OhaAsaWidgetProps {
  data: ScrapMetadata;
}

const OhaAsaWidget: React.FC<OhaAsaWidgetProps> = ({ data }) => {
  const handleClick = () => {
    // Open X (Twitter) link for OhaAsa
    window.open('https://x.com/Hi_Ohaasa', '_blank');
  };

  return (
    <div 
        onClick={handleClick}
        className="w-48 h-32 border bg-transparent backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-all group relative"
        style={{
          borderRadius: 'var(--radius-sm, 6px)',
          borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          backgroundColor: 'var(--widget-surface-background, #ffffff)',
        }}
    >
        <div className="text-3xl mb-2">🔮</div>
        <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-color-primary, #764737)' }}>오하아사</h3>
        <p className="text-xs" style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.75 }}>今日の運勢をチェック</p>

        {/* Hover Hint */}
        <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderRadius: 'var(--radius-sm, 6px)' }}>
            <span className="bg-transparent px-3 py-1.5 text-xs font-medium" style={{ 
              borderRadius: 'calc(var(--radius-sm, 6px) / 2)',
              backgroundColor: 'var(--widget-surface-background, #ffffff)',
              color: 'var(--text-color-primary, #764737)',
              border: '1px solid var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))'
            }}>
              @Hi_Ohaasa
            </span>
        </div>
    </div>
  );
};

export default OhaAsaWidget;