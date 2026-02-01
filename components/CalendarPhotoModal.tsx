import React, { useEffect, useRef, useState } from 'react';
import { LayoutTextData } from '../types';
import { compressImage } from '../services/imageUtils';

interface CalendarPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  textData: LayoutTextData;
  onUpdateText: (key: string, field: string, value: string) => void;
  dashboardKey: string;
  monthHeaderBgRef: React.RefObject<HTMLInputElement>;
  currentMonthHeaderBg?: string;
  dowKeys: string[];
  dowRefs: React.RefObject<HTMLInputElement>[];
}

/**
 * 달력 사진 관리 모달
 * - 헤더 배경 사진 등록/삭제
 * - 각 날짜별 사진 관리 (미니 달력 그리드)
 */
export default function CalendarPhotoModal({
  isOpen,
  onClose,
  year,
  month,
  textData,
  onUpdateText,
  dashboardKey,
  monthHeaderBgRef,
  currentMonthHeaderBg,
  dowKeys,
  dowRefs,
}: CalendarPhotoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 달력 그리드 생성 (MonthlySpread와 동일한 로직)
  const monthStart = new Date(year, month, 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const isInMonth = d.getFullYear() === year && d.getMonth() === month;
    return { date: d, isInMonth };
  });

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const dowLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedDateKey) {
      try {
        const dataURL = await compressImage(file, 400, 0.7);
        onUpdateText(selectedDateKey, 'coverImage', dataURL);
        setSelectedDateKey(null);
      } catch (err) {
        console.error('Image upload failed', err);
        alert('사진 업로드에 실패했습니다.');
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCellClick = (dateStr: string, hasCoverImage: boolean) => {
    if (hasCoverImage) {
      // 사진 삭제
      const date = new Date(dateStr);
      if (confirm(`${date.getDate()}일 사진을 삭제하시겠습니까?`)) {
        onUpdateText(dateStr, 'coverImage', '');
      }
    } else {
      // 사진 등록
      setSelectedDateKey(dateStr);
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        ref={modalRef}
        className="relative rounded-lg border shadow-lg p-4 max-w-[600px] w-[90vw] max-h-[80vh] overflow-auto pointer-events-auto"
        style={{
          backgroundColor: 'var(--widget-surface-background, #ffffff)',
          borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          color: 'var(--text-color-primary, #764737)',
        }}
      >
        {/* 제목 */}
        <div className="text-sm font-medium mb-3 text-center" style={{ color: 'inherit' }}>
          달력 사진 관리
        </div>

        {/* 헤더 배경 사진 관리 */}
        <div className="flex flex-col gap-2 mb-4">
          <button
            className="w-full px-3 py-1.5 text-xs font-medium rounded border hover:opacity-80 transition-all"
            style={{
              backgroundColor: 'var(--widget-surface-background, #ffffff)',
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              color: 'inherit',
            }}
            onClick={() => {
              monthHeaderBgRef.current?.click();
            }}
          >
            헤더 배경 사진 등록
          </button>
          {currentMonthHeaderBg && (
            <button
              className="w-full px-3 py-1.5 text-xs font-medium rounded border hover:opacity-80 transition-all text-red-600"
              style={{
                backgroundColor: 'var(--widget-surface-background, #ffffff)',
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}
              onClick={() => {
                onUpdateText(dashboardKey, 'monthHeaderBg', '');
              }}
            >
              🗑️ 헤더 배경 사진 삭제
            </button>
          )}
        </div>

        {/* 구분선 */}
        <div
          className="h-px mb-4"
          style={{
            backgroundColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          }}
        />

        {/* 요일 사진 관리 */}
        <div className="text-xs mb-2 text-center opacity-75" style={{ color: 'inherit' }}>
          요일 사진 관리
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {dowLabels.map((label, idx) => {
            const dowKey = dowKeys[idx];
            const dowImage = textData[dashboardKey]?.[dowKey];
            const hasDowImage = !!dowImage;

            return (
              <button
                key={label}
                className="text-[10px] font-bold rounded border hover:opacity-80 transition-all relative overflow-hidden h-9"
                style={{
                  backgroundColor: 'var(--calendar-weekday-header-bg, #FEDFDC)',
                  borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                  color: 'inherit',
                  cursor: 'pointer',
                  backgroundImage: hasDowImage ? `url(${dowImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                onClick={() => {
                  if (hasDowImage) {
                    // 사진 삭제
                    if (confirm(`${label} 요일 사진을 삭제하시겠습니까?`)) {
                      onUpdateText(dashboardKey, dowKey, '');
                    }
                  } else {
                    // 사진 등록
                    dowRefs[idx].current?.click();
                  }
                }}
                title={hasDowImage ? '클릭하여 사진 삭제' : '클릭하여 사진 등록'}
              >
                {/* 배경이 반투명으로 텍스트 가독성 향상 */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundColor: hasDowImage ? 'rgba(255, 255, 255, 0.6)' : 'transparent',
                  }}
                >
                  <span className="relative z-10 font-bold">{label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 구분선 */}
        <div
          className="h-px mb-4"
          style={{
            backgroundColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          }}
        />

        {/* 달력 칸 사진 관리 */}
        <div className="text-xs mb-2 text-center opacity-75" style={{ color: 'inherit' }}>
          달력 칸 사진 관리
        </div>

        {/* 미니 달력 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {/* 요일 헤더 */}
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((dow) => (
            <div
              key={dow}
              className="text-center text-[9px] font-medium py-1"
              style={{ color: 'inherit', opacity: 0.6 }}
            >
              {dow}
            </div>
          ))}

          {/* 날짜 칸 */}
          {days.map(({ date, isInMonth }, idx) => {
            const dateStr = formatDateKey(date);
            const coverImage = textData[dateStr]?.coverImage;
            const hasCoverImage = !!coverImage;

            return (
              <button
                key={idx}
                className="text-[10px] rounded border hover:opacity-80 transition-all relative overflow-hidden"
                style={{
                  aspectRatio: '1 / 1.3', // 세로로 긴 칸 (기존 달력과 유사)
                  backgroundColor: 'var(--widget-surface-background, #ffffff)',
                  borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                  color: 'inherit',
                  opacity: isInMonth ? 1 : 0.3,
                  cursor: 'pointer',
                  backgroundImage: hasCoverImage ? `url(${coverImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                onClick={() => handleCellClick(dateStr, hasCoverImage)}
                title={hasCoverImage ? '클릭하여 사진 삭제' : '클릭하여 사진 등록'}
              >
                {/* 날짜 숫자 */}
                <div
                  className="absolute top-0 left-0 right-0 px-1 py-0.5 flex items-center justify-between"
                  style={{
                    backgroundColor: hasCoverImage ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
                    color: hasCoverImage ? '#ffffff' : 'inherit',
                  }}
                >
                  <span className="font-medium">{date.getDate()}</span>
                  {hasCoverImage && <span className="text-[6px]">📷</span>}
                </div>

                {/* 빈 칸 안내 */}
                {!hasCoverImage && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <span className="text-[8px]">+</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 숨겨진 파일 input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="text-[9px] mt-2 text-center opacity-60" style={{ color: 'inherit' }}>
          * 빈 칸 클릭: 사진 등록 | 사진 있는 칸 클릭: 사진 삭제
        </div>

        {/* 닫기 버튼 */}
        <button
          className="w-full mt-4 px-3 py-1.5 text-xs font-medium rounded border hover:opacity-80 transition-all"
          style={{
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            color: 'inherit',
          }}
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

