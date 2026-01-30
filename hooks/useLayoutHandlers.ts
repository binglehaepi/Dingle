import { LayoutType, DiaryStyle } from '../types';
import { LAYOUT_PREF_KEY, TEXT_DATA_KEY } from '../constants/appConstants';
import { applyDiaryStyleToDocument, migrateDiaryStyle, revokeNotePaperBgObjectUrl } from '../utils/theme';
import { AppState } from './useAppState';

interface LayoutHandlersProps {
  state: AppState;
  handleSaveLayout: () => void;
  formatDateKey: (date: Date) => string;
  formatMonthKey: (date: Date) => string;
}

/**
 * 레이아웃 관리 핸들러 훅
 * 
 * - 레이아웃 전환 (monthly, free, weekly, scrap_page)
 * - 날짜 이동 (일, 월)
 * - 페이지 초기화
 */
export function useLayoutHandlers({ state, handleSaveLayout, formatDateKey, formatMonthKey }: LayoutHandlersProps) {
  const {
    items,
    setItems,
    currentLayout,
    setCurrentLayout,
    currentDate,
    setCurrentDate,
    setToastMsg,
    textData,
    setTextData,
    diaryStyle,
    setDiaryStyle,
    autoSaveTimerRef,
  } = state;

  // --- 레이아웃 변경 ---
  const changeLayout = (type: LayoutType) => {
    setCurrentLayout(type);
    // ✅ 저장 포맷 통일: JSON.stringify
    localStorage.setItem(LAYOUT_PREF_KEY, JSON.stringify(type));
    setToastMsg(type === 'scrap_page' ? 'SCRAPBOOK' : type.toUpperCase());
    setTimeout(() => setToastMsg(''), 1500);
  };

  // --- 날짜 이동 ---
  const handleDateChange = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  // --- 월 선택 ---
  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    changeLayout('monthly');
  };

  // --- 날짜 클릭 (달력에서) ---
  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    changeLayout('free'); 
  };

  // --- 주 선택 ---
  const handleWeekSelect = (date: Date) => {
    setCurrentDate(date);
    changeLayout('weekly');
  };

  // --- 페이지 초기화 ---
  const handleClearLayout = () => {
    // Monthly 레이아웃에 대한 특별한 확인 메시지
    const confirmMessage = currentLayout === 'monthly' 
      ? "월간 페이지를 초기화할까요?\n(위젯 커스텀 + 달력 커버 + 배경 이미지가 삭제됩니다)"
      : "Clear this page?";
    
    if (window.confirm(confirmMessage)) {
      // ✅ 스타일 초기화(추가): 노트 종이 배경 이미지(notePaperBackgroundImage)도 같이 제거
      // - localStorage(STYLE_PREF_KEY) 저장은 useStorageSync의 [diaryStyle] effect가 담당
      // - 즉시 반영을 위해 여기서 document CSS vars도 바로 재적용
      const shouldClearDeskBg = !!diaryStyle.backgroundImage;
      const shouldClearNotePaperBgImage = !!(diaryStyle.notePaperBackgroundImage || '').trim();

      if (shouldClearDeskBg || shouldClearNotePaperBgImage) {
        const nextStyle: DiaryStyle = {
          ...diaryStyle,
          ...(shouldClearDeskBg ? { backgroundImage: '' } : {}),
          ...(shouldClearNotePaperBgImage ? { notePaperBackgroundImage: undefined } : {}),
        };

        // blob objectURL 캐시가 있다면 즉시 revoke (메모리 누수 방지)
        if (shouldClearNotePaperBgImage) {
          revokeNotePaperBgObjectUrl();
        }

        // 상태 업데이트 + 즉시 테마 반영
        setDiaryStyle(nextStyle);
        applyDiaryStyleToDocument(migrateDiaryStyle(nextStyle));
      }
      // Get filtered items for current page
      const getFilteredItems = () => {
        if (currentLayout === 'scrap_page') {
          return items.filter(item => item.diaryDate === 'GLOBAL_SCRAP_PAGE');
        }
        if (currentLayout === 'monthly') {
          const monthKey = formatMonthKey(currentDate);
          return items.filter(item => item.diaryDate === monthKey);
        }
        if (currentLayout === 'free') {
          const dateKey = formatDateKey(currentDate);
          return items.filter(item => item.diaryDate === dateKey);
        }
        return [];
      };

      const filteredItems = getFilteredItems();
      const currentKeys = new Set(filteredItems.map(i => i.id));
      setItems(prev => prev.filter(i => !currentKeys.has(i.id)));
      
      // Monthly 레이아웃 전용: textData 초기화
      if (currentLayout === 'monthly') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // A) 대시보드 키 생성 및 삭제
        const dashboardKey = `${year}-${String(month + 1).padStart(2, '0')}-DASHBOARD`;
        
        setTextData(prev => {
          const newData = { ...prev };
          
          // 대시보드 커스텀 삭제
          delete newData[dashboardKey];
          
          // B) 현재 달의 모든 날짜에서 coverImage 제거
          for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = formatDateKey(new Date(year, month, day));
            
            if (newData[dateKey]) {
              // coverImage만 제거
              const { coverImage, ...rest } = newData[dateKey];
              
              // 남은 필드가 있으면 유지, 없으면 키 자체 삭제
              if (Object.keys(rest).length > 0) {
                newData[dateKey] = rest;
              } else {
                delete newData[dateKey];
              }
            }
          }
          
          // 변경사항 저장
          try {
            localStorage.setItem(TEXT_DATA_KEY, JSON.stringify(newData));
          } catch (err) {
            console.error('❌ textData 저장 실패:', err);
          }
          
          return newData;
        });
      }
      
      setToastMsg('Cleared');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  // --- 텍스트 업데이트 (자동 저장) ---
  const handleUpdateText = (key: string, field: string, value: string) => {
    setTextData(prev => {
      const newData = {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value
        }
      };
      
      // Auto-save after 1 second of no changes (debounce)
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(TEXT_DATA_KEY, JSON.stringify(newData));
          // Call save from parent (includes items)
          handleSaveLayout();
          console.log('✅ 자동 저장 완료:', { key, field });
        } catch (err: any) {
          console.error('❌ 자동 저장 실패:', err);
          if (err.name === 'QuotaExceededError') {
            setToastMsg('저장 공간 부족!');
            setTimeout(() => setToastMsg(''), 2000);
          }
        }
      }, 1000);
      
      return newData;
    });
  };

  return {
    changeLayout,
    handleDateChange,
    handleMonthSelect,
    handleDateClick,
    handleWeekSelect,
    handleClearLayout,
    handleUpdateText,
  };
}




