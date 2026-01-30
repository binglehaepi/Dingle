/**
 * HTML Export Dialog (Static HTML Export)
 * 
 * 정적 HTML 내보내기 옵션 선택
 */

import React, { useState } from 'react';

export interface StaticHTMLExportOptions {
  includeMonthlyCover: boolean;
  includeEmbeds: boolean;
}

interface ExportHTMLDialogProps {
  isOpen: boolean;
  diaryId: string;
  diaryName: string;
  onClose: () => void;
  onExport: (options: StaticHTMLExportOptions) => void;
}

const ExportHTMLDialog: React.FC<ExportHTMLDialogProps> = ({
  isOpen,
  diaryName,
  onClose,
  onExport,
}) => {
  const [includeMonthlyCover, setIncludeMonthlyCover] = useState(true);
  const [includeEmbeds, setIncludeEmbeds] = useState(true);
  
  if (!isOpen) return null;
  
  const handleExport = () => {
    onExport({ 
      includeMonthlyCover, 
      includeEmbeds
    });
  };
  
  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(90, 74, 66, 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
      }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fefdfb',
          borderRadius: '20px',
          padding: '40px',
          width: '500px',
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(90, 74, 66, 0.3)',
          border: '2px solid #e8e4dd',
        }}>
        <h2 style={{
          margin: '0 0 32px 0',
          fontSize: '28px',
          fontFamily: "'Nanum Myeongjo', serif",
          fontWeight: '600',
          color: '#5a4a42',
          textAlign: 'center',
        }}>
          HTML로 내보내기
        </h2>

        <div style={{
          padding: '20px',
          backgroundColor: '#f9f7f4',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #e8e4dd',
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#5a4a42',
            marginBottom: '8px',
            fontFamily: "'Nanum Gothic', sans-serif",
          }}>
            📖 {diaryName}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#9a8a7a',
            fontFamily: "'Nanum Gothic', sans-serif",
          }}>
            다이어리를 정적 HTML 파일로 내보냅니다
          </div>
        </div>

        {/* 월간 뷰 표지 포함 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            backgroundColor: includeMonthlyCover ? '#f5f3f0' : 'transparent',
            borderRadius: '12px',
            cursor: 'pointer',
            border: includeMonthlyCover ? '2px solid #e8e4dd' : '2px solid transparent',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!includeMonthlyCover) {
              e.currentTarget.style.backgroundColor = '#faf9f7';
            }
          }}
          onMouseLeave={(e) => {
            if (!includeMonthlyCover) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}>
            <input 
              type="checkbox" 
              checked={includeMonthlyCover}
              onChange={(e) => setIncludeMonthlyCover(e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#5a4a42',
                marginBottom: '4px',
                fontFamily: "'Nanum Gothic', sans-serif",
              }}>
                📅 월간 뷰 표지 포함
              </div>
              <div style={{
                fontSize: '12px',
                color: '#9a8a7a',
                fontFamily: "'Nanum Gothic', sans-serif",
              }}>
                달력을 클릭하면 해당 날짜 스크랩북으로 이동
              </div>
            </div>
          </label>
        </div>

        {/* 임베드 포함 옵션 */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            backgroundColor: includeEmbeds ? '#f5f3f0' : 'transparent',
            borderRadius: '12px',
            cursor: 'pointer',
            border: includeEmbeds ? '2px solid #e8e4dd' : '2px solid transparent',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!includeEmbeds) {
              e.currentTarget.style.backgroundColor = '#faf9f7';
            }
          }}
          onMouseLeave={(e) => {
            if (!includeEmbeds) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}>
            <input 
              type="checkbox" 
              checked={includeEmbeds}
              onChange={(e) => setIncludeEmbeds(e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#5a4a42',
                marginBottom: '4px',
                fontFamily: "'Nanum Gothic', sans-serif",
              }}>
                🎬 SNS 임베드 포함
              </div>
              <div style={{
                fontSize: '12px',
                color: '#9a8a7a',
                fontFamily: "'Nanum Gothic', sans-serif",
              }}>
                YouTube, Spotify, Twitter 등을 실제 위젯으로 표시
              </div>
            </div>
          </label>
        </div>
        
        {/* 버튼 */}
        <div style={{
          display: 'flex',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px 24px',
              fontSize: '15px',
              fontWeight: '600',
              fontFamily: "'Nanum Gothic', sans-serif",
              border: '2px solid #e8e4dd',
              borderRadius: '12px',
              backgroundColor: '#fff',
              color: '#7a6a5a',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            취소
          </button>
          <button
            onClick={handleExport}
            style={{
              flex: 1,
              padding: '14px 24px',
              fontSize: '15px',
              fontWeight: '600',
              fontFamily: "'Nanum Gothic', sans-serif",
              border: 'none',
              borderRadius: '12px',
              backgroundColor: '#5a4a42',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#6a5a52';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5a4a42';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            📤 내보내기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportHTMLDialog;
