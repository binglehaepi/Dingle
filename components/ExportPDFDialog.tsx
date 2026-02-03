import React, { useState } from 'react';

interface ExportPDFDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ExportPDFDialog: React.FC<ExportPDFDialogProps> = ({ onConfirm, onCancel }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-[500px] max-w-[90vw]"
        style={{
          fontFamily: "'Nanum Gothic', sans-serif",
        }}
      >
        {/* 제목 */}
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#5a4a42' }}>
          ⚠️ PDF 내보내기
        </h2>

        {/* 경고 내용 */}
        <div className="mb-6 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#6d4c41' }}>
            이 PDF는 <strong>개인 보관용</strong>입니다.
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#6d4c41' }}>
            임베드 콘텐츠(YouTube, Twitter 등)가 포함되어 있으니 <strong>공개 배포를 자제</strong>해주세요.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#8a6a5a' }}>
            포함된 콘텐츠의 저작권은 원 저작자에게 있습니다.
          </p>
        </div>

        {/* 체크박스 */}
        <label className="flex items-start gap-3 mb-8 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-5 h-5 cursor-pointer accent-pink-400"
          />
          <span className="text-sm" style={{ color: '#5a4a42' }}>
            개인 보관용으로만 사용하겠습니다
          </span>
        </label>

        {/* 버튼들 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-xl border-2 font-semibold transition-all hover:bg-gray-50 active:scale-95"
            style={{
              borderColor: '#d7ccc8',
              color: '#5a4a42',
            }}
          >
            취소
          </button>
          <button
            onClick={() => {
              if (agreed) onConfirm();
            }}
            disabled={!agreed}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 ${
              agreed ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'
            }`}
            style={{
              backgroundColor: agreed ? '#ec407a' : '#d7ccc8',
              color: '#ffffff',
            }}
          >
            PDF 내보내기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPDFDialog;




