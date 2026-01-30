/**
 * 고급 내보내기 옵션 다이얼로그
 * Phase 5C
 */

import React, { useState } from 'react';

export interface ExportOptions {
  // SNS 임베드 처리
  safeMode: boolean; // SNS 임베드 제외 (링크만 표시)
  
  // 워터마크
  watermark: boolean;
  watermarkText: string;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  
  // 품질
  quality: 'low' | 'medium' | 'high' | 'ultra';
  format: 'png' | 'pdf';
}

interface ExportOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
}

const ExportOptionsDialog: React.FC<ExportOptionsDialogProps> = ({
  isOpen,
  onClose,
  onExport,
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    safeMode: false,
    watermark: false,
    watermarkText: '',
    watermarkPosition: 'bottom-right',
    quality: 'high',
    format: 'png',
  });

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(options);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[80vh] overflow-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">⚙️ 내보내기 옵션</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 포맷 선택 */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">📄 포맷</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setOptions({ ...options, format: 'png' })}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                options.format === 'png'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                  : 'border-gray-300 hover:border-purple-300'
              }`}
            >
              PNG 이미지
            </button>
            <button
              onClick={() => setOptions({ ...options, format: 'pdf' })}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                options.format === 'pdf'
                  ? 'border-red-500 bg-red-50 text-red-700 font-bold'
                  : 'border-gray-300 hover:border-red-300'
              }`}
            >
              PDF 문서
            </button>
          </div>
        </div>

        {/* 품질 선택 */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">🎨 품질</h3>
          <div className="grid grid-cols-2 gap-2">
            {['low', 'medium', 'high', 'ultra'].map((q) => (
              <button
                key={q}
                onClick={() => setOptions({ ...options, quality: q as any })}
                className={`py-2 px-4 rounded-lg border-2 transition-all ${
                  options.quality === q
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                {q === 'low' && '낮음 (빠름)'}
                {q === 'medium' && '보통'}
                {q === 'high' && '높음'}
                {q === 'ultra' && '최고 (느림)'}
              </button>
            ))}
          </div>
        </div>

        {/* 안전 모드 */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">🔒 안전 모드</h3>
          <label className="flex items-start gap-3 p-3 border-2 rounded-lg hover:border-green-300 cursor-pointer">
            <input
              type="checkbox"
              checked={options.safeMode}
              onChange={(e) => setOptions({ ...options, safeMode: e.target.checked })}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-green-700">SNS 임베드 제외</div>
              <div className="text-xs text-gray-600 mt-1">
                트위터/인스타그램 임베드를 제외하고 링크 카드로만 표시합니다.
                저작권이 민감한 경우 이 옵션을 사용하세요.
              </div>
            </div>
          </label>
        </div>

        {/* 워터마크 */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">💧 워터마크</h3>
          
          <label className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={options.watermark}
              onChange={(e) => setOptions({ ...options, watermark: e.target.checked })}
            />
            <span className="font-medium">워터마크 추가</span>
          </label>

          {options.watermark && (
            <div className="space-y-3 pl-6">
              <div>
                <label className="text-sm text-gray-600">텍스트</label>
                <input
                  type="text"
                  value={options.watermarkText}
                  onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
                  placeholder="© 2025 My Diary"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">위치</label>
                <select
                  value={options.watermarkPosition}
                  onChange={(e) => setOptions({ ...options, watermarkPosition: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="top-left">왼쪽 위</option>
                  <option value="top-right">오른쪽 위</option>
                  <option value="bottom-left">왼쪽 아래</option>
                  <option value="bottom-right">오른쪽 아래</option>
                  <option value="center">중앙</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg border-2 border-gray-300 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleExport}
            className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-600 hover:to-pink-600"
          >
            {options.format === 'png' ? '📷 PNG로 내보내기' : '📄 PDF로 내보내기'}
          </button>
        </div>

        {/* 미리보기 안내 */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          <strong>💡 팁:</strong> 안전 모드는 SNS 임베드 콘텐츠를 제외하여 저작권 문제를 방지합니다.
          워터마크는 내보낸 이미지에만 표시됩니다.
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsDialog;




