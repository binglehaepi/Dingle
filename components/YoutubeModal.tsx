import React, { useState } from 'react';

interface YoutubeModalProps {
  onConfirm: (config: { mode: 'cd' | 'player'; startTime: number }) => void;
  onCancel: () => void;
}

const YoutubeModal: React.FC<YoutubeModalProps> = ({ onConfirm, onCancel }) => {
  const [mode, setMode] = useState<'cd' | 'player'>('player');
  const [timeInput, setTimeInput] = useState('');

  const parseTime = (input: string) => {
    // formats: "90", "1:30", "1m 30s"
    if (!input) return 0;
    
    // Simple mm:ss parser
    if (input.includes(':')) {
        const parts = input.split(':');
        const m = parseInt(parts[0]) || 0;
        const s = parseInt(parts[1]) || 0;
        return m * 60 + s;
    }
    
    // Just seconds
    return parseInt(input.replace(/[^0-9]/g, '')) || 0;
  };

  const handleConfirm = () => {
    onConfirm({
        mode,
        startTime: parseTime(timeInput)
    });
  };

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Create YouTube Object</h2>
        <p className="text-slate-500 text-sm mb-6">How would you like to visualize this link?</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
            {/* CD Option */}
            <button 
                onClick={() => setMode('cd')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${mode === 'cd' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-200'}`}
            >
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center relative">
                    <div className="w-4 h-4 rounded-full bg-white/20"></div>
                    <div className="absolute inset-0 rounded-full border border-white/10"></div>
                </div>
                <div className="text-center">
                    <div className="font-bold text-sm text-slate-800">Music CD</div>
                    <div className="text-[10px] text-slate-500">Spins when playing</div>
                </div>
            </button>

            {/* Player Option */}
            <button 
                onClick={() => setMode('player')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${mode === 'player' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-200'}`}
            >
                <div className="w-14 h-10 rounded bg-slate-100 border border-slate-300 flex items-center justify-center shadow-sm">
                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-slate-400 border-b-[5px] border-b-transparent ml-1"></div>
                </div>
                <div className="text-center">
                    <div className="font-bold text-sm text-slate-800">Video Player</div>
                    <div className="text-[10px] text-slate-500">Custom start time</div>
                </div>
            </button>
        </div>

        {mode === 'player' && (
            <div className="mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 mb-1">Start Time (Optional)</label>
                <input 
                    type="text" 
                    placeholder="e.g. 1:30 or 90" 
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave empty to start from beginning</p>
            </div>
        )}

        <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">Cancel</button>
            <button onClick={handleConfirm} className="px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-full hover:bg-slate-800 shadow-lg">Create Object</button>
        </div>
      </div>
    </div>
  );
};

export default YoutubeModal;