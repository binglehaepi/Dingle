/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 날짜를 YYYY-MM 형식으로 변환 (월 단위)
 */
export const formatMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};




