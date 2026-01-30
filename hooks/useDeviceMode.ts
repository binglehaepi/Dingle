import { useState, useEffect } from 'react';

export type DeviceMode = 'mobile' | 'tablet' | 'desktop';

/**
 * 디바이스 모드 감지 훅
 * 
 * - mobile: 터치 기기 + (width ≤ 767px OR height ≤ 500px)
 * - tablet: 터치 기기 + 큰 화면
 * - desktop: 마우스 기기
 */
export function useDeviceMode(): DeviceMode {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getDeviceMode();
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceMode(getDeviceMode());
    };

    // 리사이즈 감지
    window.addEventListener('resize', handleResize);
    
    // visualViewport도 감지 (iOS Safari)
    window.visualViewport?.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  return deviceMode;
}

/**
 * 현재 디바이스 모드 계산
 */
function getDeviceMode(): DeviceMode {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // 터치 기기 감지
  const isTouch = window.matchMedia('(pointer: coarse)').matches 
    || (navigator.maxTouchPoints ?? 0) > 1;
  
  // 모바일 크기 감지 (세로 767px 이하 OR 가로 500px 이하)
  const isPhoneSize = width <= 767 || height <= 500;
  
  // 🎯 우선순위
  if (isTouch && isPhoneSize) {
    return 'mobile';
  }
  
  if (isTouch) {
    return 'tablet';
  }
  
  return 'desktop';
}

export default useDeviceMode;
