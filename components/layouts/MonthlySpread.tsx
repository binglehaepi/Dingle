import React, { useEffect, useRef, useState } from 'react';
import { ScrapItem, LayoutTextData, LinkDockItem } from '../../types';
import { compressImage } from '../../services/imageUtils';
import { formatDateKey } from '../../utils/dateHelpers';
import LinkDock from '../LinkDock';
import MarqueeField from '../calendar/MarqueeField';
import { useMusicStore } from '../../music/MusicStore';
import { fetchOhaasa, getSignLabelKo, OHAASA_SIGNS, OHAASA_X_URL, getColorHex, type OhaasaResult, type OhaasaSignId } from '../../services/ohaasa';
import ExternalLinkModal from '../ExternalLinkModal';
import CompactModal from '../CompactModal';
import CalendarPhotoModal from '../CalendarPhotoModal';

// ✅ 버전 확인용 (디버깅)
console.log('🔮 MonthlySpread 로드됨 - 오하아사 v2.0 (행운 컬러 포함)');

interface MonthlySpreadProps {
  currentDate: Date;
  items: ScrapItem[];
  textData: LayoutTextData;
  onDateClick: (date: Date) => void;
  onWeekSelect: (date: Date) => void;
  onUpdateText: (key: string, field: string, value: string) => void;
  viewMode?: 'left' | 'right' | 'both';
  onYearChange?: (year: number) => void;
  compactMode?: boolean; // 1100px 모드일 때 true

  // 🔗 Link Dock (optional, desktop MVP)
  linkDockItems?: LinkDockItem[];
  setLinkDockItems?: React.Dispatch<React.SetStateAction<LinkDockItem[]>>;
  onInsertLinksToDate?: (dateKey: string, urls: string[]) => Promise<(string | null)[]>;
  onAddPhotoToDate?: (dateKey: string, file: File) => Promise<string | null> | string | null | void;
}

const MonthlySpread: React.FC<MonthlySpreadProps> = ({
  currentDate,
  items,
  textData,
  onDateClick,
  onWeekSelect,
  onUpdateText,
  viewMode = 'both',
  onYearChange,
  compactMode,
  linkDockItems,
  setLinkDockItems,
  onInsertLinksToDate,
  onAddPhotoToDate,
}) => {
  const isSpreadView = viewMode === 'both';
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const dashboardKey = `${year}-${String(month + 1).padStart(2, '0')}-DASHBOARD`;
  const currentData = textData[dashboardKey] || {};

  // --- Calendar Grid: 6×7 (42칸) 고정 ---
  const monthStart = new Date(year, month, 1);
  const gridStart = new Date(monthStart);
  // weekStartsOn: 0 (Sunday)
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const isInMonth = d.getFullYear() === year && d.getMonth() === month;
    return { date: d, isInMonth };
  });

  // Refs
  const profileImageRef = useRef<HTMLInputElement>(null);
  const musicCoverInputRef = useRef<HTMLInputElement>(null);
  const dDayBgImageRef = useRef<HTMLInputElement>(null);
  const cdBodyBgImageRef = useRef<HTMLInputElement>(null);
  const bucketBgImageRef = useRef<HTMLInputElement>(null);
  const monthHeaderBgRef = useRef<HTMLInputElement>(null);
  const dowInputRefs = {
    sun: useRef<HTMLInputElement>(null),
    mon: useRef<HTMLInputElement>(null),
    tue: useRef<HTMLInputElement>(null),
    wed: useRef<HTMLInputElement>(null),
    thu: useRef<HTMLInputElement>(null),
    fri: useRef<HTMLInputElement>(null),
    sat: useRef<HTMLInputElement>(null),
  };

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [bucketInput, setBucketInput] = useState('');
  const [showDdayDatePicker, setShowDdayDatePicker] = useState(false);

  // 🎨 CD 플레이어 사진 관리 모달
  const [cdPhotoModalOpen, setCdPhotoModalOpen] = useState(false);

  // 🖼️ 프로필 사진 관리 모달
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // 📅 달 헤더 사진 관리 모달
  const [monthHeaderModalOpen, setMonthHeaderModalOpen] = useState(false);

  // 🔮 OhaAsa Horoscope
  const OHAASA_SIGN_KEY = 'dingel:ohaasa:selectedSign';
  const [ohaasaSign, setOhaasaSign] = useState<OhaasaSignId>(() => {
    try {
      const saved = localStorage.getItem(OHAASA_SIGN_KEY) as OhaasaSignId | null;
      if (saved && OHAASA_SIGNS.some((s) => s.id === saved)) return saved;
    } catch {
      // ignore
    }
    return 'aries';
  });
  const [ohaasaResult, setOhaasaResult] = useState<OhaasaResult | null>(null);
  const [ohaasaError, setOhaasaError] = useState<string>('');
  const [ohaasaLoading, setOhaasaLoading] = useState(false);
  const [ohaasaOpen, setOhaasaOpen] = useState(false);
  const ohaasaRef = useRef<HTMLDivElement | null>(null);
  const [ohaasaLinkModalOpen, setOhaasaLinkModalOpen] = useState(false);
  const [ohaasaLinkModalUrl, setOhaasaLinkModalUrl] = useState<string>('');

  const isTranslationFailed = (res: OhaasaResult | null) => {
    if (!res) return true;
    if ((res as any).translationError === true) return true;
    if ((res as any).translated === false) return true;
    if (!res.textKo || !res.textKo.trim()) return true;
    return false;
  };

  useEffect(() => {
    if (!ohaasaOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = ohaasaRef.current;
      if (!el) return;
      if (e.target && el.contains(e.target as Node)) return;
      setOhaasaOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [ohaasaOpen]);
  
  // 🎵 Persistent Music (Global)
  const music = useMusicStore();

  const getVideoId = (url: string) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };
  
  const videoId = getVideoId(currentData.musicUrl || '');
  const isThisTrackPlaying = !!videoId && music.provider === 'youtube' && music.videoId === videoId && music.isPlaying;

  const handleCdClick = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('💿 [CD Player] CD 클릭됨');
      console.log('💿 [CD Player] videoId:', videoId);
      console.log('💿 [CD Player] music.videoId:', music.videoId);
      console.log('💿 [CD Player] music.isPlaying:', music.isPlaying);
      
      if (!videoId) {
          console.log('💿 [CD Player] videoId 없음, 커버 사진 변경');
          musicCoverInputRef.current?.click();
      } else {
          // If different track is selected, switch then play
          if (music.videoId !== videoId) {
              console.log('💿 [CD Player] 다른 트랙 선택됨, 변경 후 재생');
              music.setTrack(videoId);
              music.play();
          } else {
              console.log('💿 [CD Player] 같은 트랙, 토글');
              music.toggle();
          }
      }
      console.log('💿 [CD Player] 처리 후 MusicStore 상태:', { 
          provider: music.provider, 
          videoId: music.videoId, 
          isPlaying: music.isPlaying 
      });
  };

  // D-Day Logic
  const calculateDDay = () => {
      if (!currentData.dDayDate) return "D-?";
      const today = new Date();
      today.setHours(0,0,0,0);
      const target = new Date(currentData.dDayDate);
      target.setHours(0,0,0,0);
      const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 0) return "D-Day";
      if (diff > 0) return `D-${diff}`;
      return `D+${Math.abs(diff)}`;
  };

  // Image Upload Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      try {
          const result = await compressImage(e.target.files[0], 600, 0.7);
          onUpdateText(dashboardKey, field, result);
      } catch (err) {
          console.error("Image upload failed", err);
      }
    }
  };

  const handleLinkSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          const url = (e.target as HTMLInputElement).value;
          console.log('🎵 [CD Player] 링크 입력:', url);
          onUpdateText(dashboardKey, 'musicUrl', url);
          
          const id = getVideoId(url);
          console.log('🎵 [CD Player] Video ID 추출:', id);
          if (id) {
              const thumbUrl = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
              onUpdateText(dashboardKey, 'photoUrl', thumbUrl);
              // ✅ 전역 MusicStore에 트랙 설정 및 재생
              console.log('🎵 [CD Player] music.setTrack 호출:', id);
              music.setTrack(id);
              console.log('🎵 [CD Player] music.play 호출');
              music.play();
              console.log('🎵 [CD Player] MusicStore 상태:', { 
                  provider: music.provider, 
                  videoId: music.videoId, 
                  isPlaying: music.isPlaying 
              });
          } else if (url.trim()) {
              // 올바르지 않은 URL
              alert('올바른 YouTube URL을 입력해주세요.\n예: https://youtube.com/watch?v=...');
          }
          
          setShowLinkInput(false);
      }
  };

  const handleOhaasaFetch = async (opts?: { force?: boolean }) => {
    setOhaasaError('');
    const todayKey = formatDateKey(new Date());
    const cacheKey = `dingel:ohaasa:cache:${todayKey}:${ohaasaSign}`;
    
    // ⭐ force 옵션이면 캐시 삭제
    if (opts?.force) {
      console.log('🔄 [OhaAsa] 캐시 강제 클리어');
      localStorage.removeItem(cacheKey);
      // Electron 캐시도 클리어 요청
      if (typeof window !== 'undefined' && (window as any).electron?.clearOhaasaCache) {
        try {
          await (window as any).electron.clearOhaasaCache();
        } catch (e) {
          console.warn('Electron 캐시 클리어 실패:', e);
        }
      }
    }
    
    // 캐시 확인 (force가 아닐 때만)
    if (!opts?.force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as OhaasaResult;
          if (parsed?.rank) {
            console.log('📦 [OhaAsa] 캐시 사용:', parsed);
            setOhaasaResult(parsed);
            return;
          }
        }
      } catch {
        // ignore cache parse
      }
    }

    setOhaasaLoading(true);
    try {
      console.log('🌐 [OhaAsa] API 호출 시작:', { date: todayKey, sign: ohaasaSign });
      const result = await fetchOhaasa({ date: todayKey, sign: ohaasaSign });
      console.log('✅ [OhaAsa] API 응답:', result);
      setOhaasaResult(result);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('❌ [OhaAsa] API 실패:', err);
      setOhaasaError('불러오기 실패');
      setOhaasaResult(null);
    } finally {
      setOhaasaLoading(false);
    }
  };

  // Goals Management (Checklist - same format as Bucket List)
  const parseGoalsList = () => {
      const raw = currentData.goals || '';
      const lines = raw.split('\n');
      
      return lines
          .map(line => {
              const checkMatch = line.match(/^- \[([ x])\] (.+)$/);
              if (checkMatch) {
                  return { completed: checkMatch[1] === 'x', text: checkMatch[2] };
              }
              if (line.trim()) {
                  return { completed: false, text: line.trim() };
              }
              return null;
          })
          .filter(Boolean) as { completed: boolean; text: string }[];
  };

  const saveGoalsList = (items: { completed: boolean; text: string }[]) => {
      const formatted = items.map(item => `- [${item.completed ? 'x' : ' '}] ${item.text}`).join('\n');
      onUpdateText(dashboardKey, 'goals', formatted);
  };

  const goals = parseGoalsList();
  
  const handleAddGoal = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && goalInput.trim()) {
          e.stopPropagation();
          const newItems = [...goals, { completed: false, text: goalInput.trim() }];
          saveGoalsList(newItems);
          setGoalInput('');
      }
  };

  const toggleGoalItem = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const newItems = goals.map((item, i) => 
          i === index ? { ...item, completed: !item.completed } : item
      );
      saveGoalsList(newItems);
  };

  const removeGoal = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const newItems = goals.filter((_, i) => i !== index);
      saveGoalsList(newItems);
  };

  // Bucket List Management (Task Format)
  const parseBucketList = () => {
      const raw = currentData.bucketList || '';
      const lines = raw.split('\n');
      
      return lines
          .map(line => {
              const checkMatch = line.match(/^- \[([ x])\] (.+)$/);
              if (checkMatch) {
                  return { completed: checkMatch[1] === 'x', text: checkMatch[2] };
              }
              if (line.trim()) {
                  return { completed: false, text: line.trim() };
              }
              return null;
          })
          .filter(Boolean) as { completed: boolean; text: string }[];
  };

  const saveBucketList = (items: { completed: boolean; text: string }[]) => {
      const formatted = items.map(item => `- [${item.completed ? 'x' : ' '}] ${item.text}`).join('\n');
      onUpdateText(dashboardKey, 'bucketList', formatted);
  };

  const bucketItems = parseBucketList();

  const handleAddBucketItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && bucketInput.trim()) {
          e.stopPropagation();
          const newItems = [...bucketItems, { completed: false, text: bucketInput.trim() }];
          saveBucketList(newItems);
          setBucketInput('');
      }
  };

  const toggleBucketItem = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const newItems = bucketItems.map((item, i) => 
          i === index ? { ...item, completed: !item.completed } : item
      );
      saveBucketList(newItems);
  };

  const removeBucket = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const newItems = bucketItems.filter((_, i) => i !== index);
      saveBucketList(newItems);
  };

  // Calendar Cell Renderer
  const renderCell = (date: Date, isInMonth: boolean) => {
      const dateStr = formatDateKey(date);
      const dayItems = items.filter(i => i.diaryDate === dateStr);
      const isToday = new Date().toDateString() === date.toDateString();
      
      const mainItem = dayItems.find(i => i.isMainItem);
      const coverImage = textData[dateStr]?.coverImage;
      
      const handleDragOver = (e: React.DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.add('ring-2', 'ring-purple-400', 'ring-inset', 'bg-purple-50/50');
      };
      
      const handleDragLeave = (e: React.DragEvent) => {
          e.preventDefault();
          e.currentTarget.classList.remove('ring-2', 'ring-purple-400', 'ring-inset', 'bg-purple-50/50');
      };
      
      const handleDrop = async (e: React.DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.remove('ring-2', 'ring-purple-400', 'ring-inset', 'bg-purple-50/50');
          
          const files = Array.from(e.dataTransfer.files) as File[];
          const imageFile = files.find((f: File) => f.type.startsWith('image/'));
          
          if (imageFile) {
              try {
                  const dataURL = await compressImage(imageFile, 400, 0.7);
                  onUpdateText(dateStr, 'coverImage', dataURL);
              } catch (err) {
                  console.error('Image drop failed', err);
              }
          }
      };
      
      const displayImage = coverImage || (mainItem?.metadata?.imageUrl);
      
      return (
        <div 
          data-ui="calendar-cell"
          data-diary-date={dateStr}
          data-in-month={isInMonth ? 'true' : 'false'}
          {...(isToday ? { 'data-today-cell': 'true' } : {})}
          onClick={(e) => {
            e.stopPropagation();
            onDateClick(date);
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          className="relative p-0.5 w-full h-full cursor-pointer transition-all group/cell flex flex-col gap-0.5 overflow-hidden touch-manipulation"
          style={{
            backgroundColor: isToday
              ? 'var(--calendar-today-highlight-bg, #FFFCE1)'
              : isInMonth
                ? 'var(--calendar-cell-background, #ffffff)'
                : '#ffffff'
          }}
        >
            {/* hover 시 은은한 오버레이 */}
            <div className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 transition-opacity bg-black/5 z-0"></div>
            
            {displayImage ? (
                <>
                    <div className="absolute inset-0 rounded-sm overflow-hidden z-0">
                        <img 
                            src={displayImage} 
                            alt="day cover" 
                            className="w-full h-full object-cover opacity-90 mix-blend-multiply transition-transform group-hover/cell:scale-105 duration-300" 
                        />
                    </div>
                    <span
                      className={`relative z-10 ${compactMode ? 'text-[8px]' : 'text-[9px]'} font-mono font-bold ml-0.5 px-1 py-0.5 rounded`}
                      style={{ 
                        color: 'var(--text-color-primary, #764737)', 
                        opacity: isInMonth ? 1 : 0.35,
                        textShadow: '0 0 2px rgba(255, 255, 255, 0.8), 0 0 4px rgba(255, 255, 255, 0.6)'
                      }}
                    >
                      {date.getDate()}
                    </span>
                </>
            ) : (
                <>
                    <span
                        className={`${compactMode ? 'text-[8px]' : 'text-[9px]'} font-mono font-bold ml-1`}
                        style={{ color: 'var(--text-color-primary, #764737)', opacity: isInMonth ? 1 : 0.35 }}
                    >
                        {date.getDate()}
                    </span>
                    
                    <div className="flex flex-wrap gap-0.5 content-start">
                        {dayItems.slice(0, 3).map(item => (
                            <div key={item.id} className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-70"></div>
                        ))}
                        {dayItems.length > 3 && (
                            <span className="text-[8px] leading-none" style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.5 }}>+</span>
                        )}
                    </div>
                </>
            )}
        </div>
      );
  };

  // --- Generate fixed 6×7 Grid (42) ---
  const weeks: { date: Date; isInMonth: boolean }[][] = [];
  for (let i = 0; i < 42; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const dowKeys = ['dowSunBg', 'dowMonBg', 'dowTueBg', 'dowWedBg', 'dowThuBg', 'dowFriBg', 'dowSatBg'];
  const dowRefs = [dowInputRefs.sun, dowInputRefs.mon, dowInputRefs.tue, dowInputRefs.wed, dowInputRefs.thu, dowInputRefs.fri, dowInputRefs.sat];

  return (
    <>
      {/* --- Left Page (Dashboard Area) --- */}
      {(viewMode === 'both' || viewMode === 'left') && (
      <div
        data-note-paper="left"
        className={`${isSpreadView ? '' : 'note-paper-surface '}flex-1 border-r relative flex flex-col p-8 gap-4 overflow-hidden`}
        style={{
          backgroundColor: isSpreadView ? 'transparent' : 'var(--note-paper-background, #f7f5ed)',
          backgroundImage: isSpreadView ? 'none' : undefined,
          borderRightColor: 'var(--note-center-fold-line-color, rgba(148, 163, 184, 0.3))',
          borderRightWidth: '2px',
        }}
      >
         {/* Dashboard 텍스트 제거 - 오하아사 위젯과 겹침 방지 */}
         
         <div className="relative z-10 w-full h-full flex flex-col gap-4">
            
            {/* Top Row: Profile (1/3) & Goals (2/3) */}
            <div className="flex gap-4 h-[35%]">
                {/* 프로필 위젯: 세로 2단 구조 (정사각형 사진 + 직사각형 텍스트) */}
                <div data-widget="profile" className="w-[30%] border flex flex-col backdrop-blur-[1px] overflow-hidden" style={{ borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))', backgroundColor: 'var(--widget-surface-background, #ffffff)' }}>
                    {/* Bar에서 이름 수정 */}
                    <input 
                        data-widget-bar
                        className={`flex-shrink-0 bg-transparent text-center outline-none ${compactMode ? 'text-xs' : 'text-sm'} py-1`}
                        style={{ background: 'var(--profile-header-bar-bg, #F9D4F0)', borderBottom: '1px solid var(--widget-border-color, var(--ui-stroke-color, #94a3b8))' }}
                        value={currentData.profileName || ''}
                        onChange={(e) => onUpdateText(dashboardKey, 'profileName', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Name"
                    />
                    {/* 세로 2단 레이아웃 */}
                    <div className="flex-1 flex flex-col p-3 gap-2">
                        {/* 상단 2/3: 정사각형 사진 슬롯 */}
                        <div 
                            className="flex-[2] w-full aspect-square cursor-pointer transition-all active:scale-[0.98] touch-manipulation overflow-hidden relative group/profile"
                            style={{ borderRadius: '8px' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setProfileModalOpen(true);
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setProfileModalOpen(true);
                            }}
                        >
                            {currentData.profileImage ? (
                                <>
                                    <img 
                                        src={currentData.profileImage} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                    />
                                    {/* hover 시 은은한 오버레이 */}
                                    <div className="absolute inset-0 opacity-0 group-hover/profile:opacity-100 transition-opacity bg-black/5 flex items-center justify-center">
                                        <span className="text-xs drop-shadow-md" style={{ color: 'var(--text-color-primary, #764737)' }}>Change photo</span>
                                    </div>
                                </>
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center border relative"
                                    style={{
                                        backgroundColor: 'var(--widget-surface-background, #ffffff)',
                                        borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))'
                                    }}
                                >
                                    <span className="text-4xl opacity-30">👤</span>
                                    {/* hover 시 은은한 오버레이 */}
                                    <div className="absolute inset-0 opacity-0 group-hover/profile:opacity-100 transition-opacity bg-black/5"></div>
                                </div>
                            )}
                            <input type="file" ref={profileImageRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profileImage')} />
                        </div>
                        {/* 하단 1/3: 직사각형 텍스트 슬롯 */}
                        <div className="flex-1 flex items-center">
                            <input 
                                data-widget-input
                                className="w-full text-xs text-center rounded px-2 py-2 outline-none transition-colors touch-manipulation"
                                style={{
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--widget-input-background, #f8fafc)',
                                    border: '1px solid var(--widget-border-color, var(--ui-stroke-color, #94a3b8))',
                                    color: 'var(--text-color-primary, #764737)'
                                }}
                                value={currentData.profileText || ''}
                                onChange={(e) => onUpdateText(dashboardKey, 'profileText', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="소개글을 입력하세요..."
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Goals - Checklist (진행도 제거) */}
                <div data-widget="goals" className="flex-1 border flex flex-col backdrop-blur-[1px] overflow-hidden" style={{ borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))', backgroundColor: 'var(--widget-surface-background, #ffffff)' }}>
                    {/* Bar (진행도 없음) */}
                    <div data-widget-bar className={`text-center ${compactMode ? 'text-[11px]' : 'text-[13px]'} py-1`} style={{ background: 'var(--goals-header-bar-bg, #FEDFDC)', borderBottom: '1px solid var(--widget-border-color, var(--ui-stroke-color, #94a3b8))' }}>
                        Monthly Goals
                    </div>
                    <div className="flex-1 p-3 flex flex-col overflow-hidden">
                        <input 
                            data-widget-input
                            className="w-full text-sm border rounded-[4px] px-2 py-1.5 outline-none transition-colors mb-2 touch-manipulation"
                            style={{
                                backgroundColor: 'var(--widget-input-background, #f8fafc)',
                                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                                color: 'var(--text-color-primary, #764737)'
                            }}
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value)}
                            onKeyDown={handleAddGoal}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Add goal…"
                        />
                        <div className="flex-1 flex flex-col gap-2 overflow-auto">
                            {goals.map((item, idx) => (
                                <div 
                                    key={idx}
                                    data-widget-input
                                    className="flex items-center gap-2 px-2 py-1.5 border rounded-[4px] transition-colors"
                                    style={{
                                        backgroundColor: 'var(--widget-surface-background, #ffffff)',
                                        borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.completed}
                                        onChange={(e) => toggleGoalItem(idx, e as any)}
                                        className="w-4 h-4 rounded cursor-pointer"
                                        style={{
                                            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                                            accentColor: 'var(--text-color-primary, #764737)'
                                        }}
                                    />
                                    <span className={`flex-1 text-xs ${item.completed ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--text-color-primary, #764737)' }}>
                                        {item.text}
                                    </span>
                                    <button
                                        onClick={(e) => removeGoal(idx, e)}
                                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 transition-colors"
                                        title="삭제"
                                    >
                                        <span className="text-xs text-red-500">×</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Row */}
            <div className="flex gap-4 h-[35%]">
                {/* Column 1: D-Day & OhaAsa */}
                <div className="w-[30%] flex flex-col gap-4">
                     {/* 3. D-Day - Simplified (배경 변경 버튼 분리) */}
                    <div 
                        data-widget="dday"
                        className="flex-1 relative border rounded-sm backdrop-blur-[1px] overflow-hidden"
                        style={{
                            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                            backgroundColor: currentData.dDayBgImage ? 'transparent' : 'var(--widget-surface-background, #ffffff)',
                            backgroundImage: currentData.dDayBgImage ? `url(${currentData.dDayBgImage})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        {currentData.dDayBgImage && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-0"></div>
                        )}
                        
                        {/* 상단 바: Event 이름 입력 */}
                        <input 
                            data-widget-bar
                            className={`relative z-10 w-full bg-transparent text-center outline-none ${compactMode ? 'text-[11px]' : 'text-[13px]'} py-1`}
                            style={{ background: 'var(--dday-header-bar-bg, #FCF5C8)', borderBottom: '1px solid var(--widget-border-color, var(--ui-stroke-color, #94a3b8))' }}
                            value={currentData.dDayTitle || ''}
                            onChange={(e) => onUpdateText(dashboardKey, 'dDayTitle', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="EVENT"
                        />
                        
                        {/* D-? 클릭 영역 */}
                        <div 
                            className="relative z-10 flex flex-col items-center justify-center h-[calc(100%-32px)] p-2 cursor-pointer group/dday transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDdayDatePicker(!showDdayDatePicker);
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowDdayDatePicker(!showDdayDatePicker);
                            }}
                        >
                            {/* hover 시 은은한 오버레이 */}
                            <div className="absolute inset-0 opacity-0 group-hover/dday:opacity-100 transition-opacity bg-black/5"></div>
                            
                            <div
                                className="relative z-10 font-mono text-3xl font-bold"
                                style={{ color: 'var(--text-color-primary, #764737)' }}
                            >
                                {calculateDDay()}
                            </div>
                            {currentData.dDayDate && (
                                <div
                                    className="relative z-10 text-[10px] mt-1"
                                    style={{ color: 'var(--text-color-primary, #764737)', opacity: 0.7 }}
                                >
                                    {new Date(currentData.dDayDate).toLocaleDateString()}
                                </div>
                            )}
                            
                            {/* 날짜 선택기 (토글) */}
                            {showDdayDatePicker && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                    <input 
                                        type="date"
                                        data-widget-input
                                        className="border rounded text-sm text-center outline-none px-2 py-1"
                                        style={{
                                            backgroundColor: 'var(--widget-input-background, #f8fafc)',
                                            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                                            color: 'var(--text-color-primary, #764737)'
                                        }}
                                        value={currentData.dDayDate || ''}
                                        onChange={(e) => {
                                            onUpdateText(dashboardKey, 'dDayDate', e.target.value);
                                            setShowDdayDatePicker(false);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>
                        
                        {/* 배경 변경 버튼 (우측 하단, 작은 버튼) */}
                        <button
                            className="absolute bottom-2 right-2 z-10 w-7 h-7 flex items-center justify-center bg-white/80 hover:bg-white rounded opacity-0 group-hover/dday:opacity-100 transition-all"
                            style={{ color: 'var(--text-color-primary, #764737)' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                dDayBgImageRef.current?.click();
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                dDayBgImageRef.current?.click();
                            }}
                            title="Change Background"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* 8. OhaAsa - 3단 구조 */}
                    <div
                      ref={ohaasaRef}
                      data-widget="ohaasa"
                      className="flex-1 border backdrop-blur-sm flex flex-col overflow-hidden relative"
                      style={{
                        borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                        backgroundColor: 'var(--widget-surface-background, #ffffff)',
                      }}
                    >
                      {/* 1. 상단: 별자리 드롭다운 */}
                      <div className="relative">
                        <button
                          type="button"
                          data-widget-bar
                          className={`w-full text-center ${compactMode ? 'text-[11px]' : 'text-[13px]'} py-0.5 cursor-pointer select-none transition-all hover:brightness-95 active:brightness-90 active:translate-y-[1px]`}
                          style={{
                            background: 'var(--ohaasa-header-bar-bg, #EBE7F5)',
                            color: 'inherit',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOhaasaOpen((v) => !v);
                          }}
                          title="별자리 선택"
                        >
                          <span className="inline-flex items-center justify-center w-full relative">
                            <span className="truncate px-6">{getSignLabelKo(ohaasaSign)}</span>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px]" style={{ opacity: 0.75 }}>
                              ▾
                            </span>
                          </span>
                        </button>

                        {ohaasaOpen && (
                          <div
                            className="absolute left-0 right-0 top-full z-30 border bg-white rounded-b-lg overflow-hidden"
                            style={{
                              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                              color: 'inherit',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col p-2 gap-1 max-h-[240px] overflow-auto">
                              {OHAASA_SIGNS.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  className="text-[11px] px-2 py-1 rounded border hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-between gap-2"
                                  style={{
                                    backgroundColor: 'var(--widget-surface-background, #ffffff)',
                                    borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                                    color: 'inherit',
                                    fontWeight: s.id === ohaasaSign ? 700 : 500,
                                  }}
                                  onClick={() => {
                                    const next = s.id as OhaasaSignId;
                                    setOhaasaSign(next);
                                    setOhaasaOpen(false);
                                    setOhaasaResult(null);
                                    setOhaasaError('');
                                    try {
                                      localStorage.setItem(OHAASA_SIGN_KEY, next);
                                    } catch {
                                      // ignore
                                    }
                                  }}
                                >
                                  <span className="truncate">{s.ko}</span>
                                  <span className="shrink-0 text-[12px]" style={{ opacity: s.id === ohaasaSign ? 0.9 : 0 }}>
                                    ✓
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. 하단: 2열 레이아웃 - 순위 확인 & 결과 표시 */}
                      <div 
                        className="flex-1 flex"
                        style={{
                          borderTop: '1px solid var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                        }}
                        ref={(el) => {
                          if (el) console.log('🔮 오하아사 하단 UI 렌더링됨 (v2.0 - 2열 레이아웃)');
                        }}
                      >
                        {/* 왼쪽: 순위 확인 버튼만 */}
                        <div 
                          className="flex-1 p-2 flex items-center justify-center"
                          style={{
                            borderRight: '1px solid var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                          }}
                        >
                          <button
                            className="px-3 py-1.5 text-xs font-medium rounded border hover:opacity-80 transition-all disabled:opacity-50"
                            style={{
                              backgroundColor: 'var(--widget-surface-background, #ffffff)',
                              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                              color: 'inherit',
                            }}
                            onClick={() => {
                              if (ohaasaResult?.rank) {
                                // 이미 순위가 있으면 외부 링크 모달 열기
                                setOhaasaLinkModalUrl('https://x.com/Hi_Ohaasa');
                                setOhaasaLinkModalOpen(true);
                              } else {
                                // 순위가 없으면 가져오기
                                handleOhaasaFetch({ force: false });
                              }
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              console.log('🔄 강제 새로고침 (더블클릭)');
                              handleOhaasaFetch({ force: true });
                            }}
                            disabled={ohaasaLoading}
                            title="더블클릭: 강제 새로고침"
                          >
                            {ohaasaLoading ? '확인 중...' : '순위 확인'}
                          </button>
                        </div>
                        
                        {/* 오른쪽: 결과 표시 (오늘의 오하아사 OR 순위+행운컬러) */}
                        <div className="flex-1 p-2 flex flex-col items-center justify-center gap-1">
                          {!ohaasaResult?.rank ? (
                            // 순위가 없으면 "오늘의 오하아사" 표시
                            <div className="text-[10px] opacity-70 text-center leading-tight" style={{ color: 'inherit' }}>
                              오늘의<br />오하아사
                            </div>
                          ) : (
                            // 순위가 있으면 순위 + 행운 컬러 표시
                            <>
                              <div className="flex flex-col items-center gap-0">
                                <div className="text-lg font-bold leading-tight" style={{ color: 'inherit' }}>
                                  {ohaasaResult.rank}위
                                </div>
                                {ohaasaResult.date && (
                                  <div className="text-[9px] opacity-60" style={{ color: 'inherit' }}>
                                    ({ohaasaResult.date.slice(5).replace('-', '/')} 기준)
                                  </div>
                                )}
                              </div>
                              {ohaasaResult.luckyColor && (
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="w-4 h-4 rounded border flex-shrink-0"
                                    style={{
                                      backgroundColor: getColorHex(ohaasaResult.luckyColor),
                                      borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                                    }}
                                  />
                                  <span className="text-[10px] font-medium" style={{ color: 'inherit' }}>
                                    {ohaasaResult.luckyColor}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          {ohaasaLoading && (
                            <div className="text-[10px] opacity-50">로딩 중...</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <ExternalLinkModal
                      isOpen={ohaasaLinkModalOpen}
                      url={ohaasaLinkModalUrl}
                      title="원문 보기"
                      onClose={() => setOhaasaLinkModalOpen(false)}
                    />
                </div>

                {/* Column 2: CD Player (이중 테두리 제거) */}
                <div data-widget="cd" className="flex-1 relative">

                     {/* 외부 컨테이너: 테두리는 여기서만 */}
                     <div 
                        className="absolute inset-0 rounded-xl flex flex-row items-center p-3 gap-3 overflow-hidden"
                        style={{
                            backgroundColor: currentData.cdBodyBgImage ? 'transparent' : 'var(--cd-widget-background, #F4F5E1)',
                            backgroundImage: currentData.cdBodyBgImage ? `url(${currentData.cdBodyBgImage})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                     >
                         {currentData.cdBodyBgImage && (
                             <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]"></div>
                         )}
                         
                         {/* CD 디스크: border/outline 제거 */}
                         <div className="relative z-10 flex-shrink-0 cursor-pointer group/cd touch-manipulation"
                            onClick={handleCdClick}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCdClick(e);
                            }}
                         >
                             <div 
                                className={`w-40 h-40 rounded-full overflow-hidden relative ${isThisTrackPlaying ? 'animate-spin-slow' : 'paused-animation'}`}
                                style={{ 
                                    animationDuration: '4s',
                                    backgroundColor: 'var(--cd-disc-color, #1e293b)'
                                }}
                             >
                                 {currentData.photoUrl ? (
                                     <img src={currentData.photoUrl} alt="CD" className="w-full h-full object-cover" />
                                 ) : (
                                     <div
                                        className="w-full h-full flex flex-col items-center justify-center"
                                        style={{
                                            backgroundColor: 'var(--cd-disc-color, #1e293b)',
                                            color: 'var(--text-color-primary, #764737)'
                                        }}
                                     >
                                         <span className="text-[8px]">NO DISC</span>
                                     </div>
                                 )}
                                 
                                 {/* 광택 효과: border 제거 */}
                                 <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-full"></div>
                                {/* 내부 홀: inset box-shadow를 UI stroke 토큰으로 통일 */}
                                <div
                                  className="absolute inset-[40%] rounded-full"
                                  style={{ boxShadow: 'inset 0 0 0 var(--ui-stroke-width, 1px) var(--ui-stroke-color)' }}
                                ></div>
                             </div>

                             {/* 중앙 홀/라벨: border 제거, box-shadow로 대체 */}
                            <div 
                               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/30 backdrop-blur rounded-full flex items-center justify-center z-10 pointer-events-none"
                               style={{ boxShadow: 'inset 0 0 0 var(--ui-stroke-width, 1px) var(--ui-stroke-color)' }}
                            >
                                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-inner"></div>
                             </div>

                             {/* 재생/일시정지 오버레이 */}
                             <div className={`absolute inset-0 rounded-full flex items-center justify-center z-20 transition-opacity bg-black/10 ${isThisTrackPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-0 group-hover/cd:opacity-100'}`}>
                                 {isThisTrackPlaying ? (
                                     <svg className="w-10 h-10 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-color-primary, #764737)' }}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                 ) : (
                                     <svg className="w-10 h-10 drop-shadow-md ml-1" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-color-primary, #764737)' }}><path d="M8 5v14l11-7z"/></svg>
                                 )}
                             </div>
                         </div>

                         {/* 우측 컨트롤 패널 */}
                         <div className="relative z-10 flex-1 flex flex-col h-full justify-center gap-2 min-w-0">
                             {/* 스크린: border 유지 (내부 요소이므로 허용) */}
                             <div 
                                className="rounded p-2 shadow-inner mb-1 flex items-center h-16 relative overflow-hidden border"
                                style={{
                                    backgroundColor: 'var(--cd-screen-bg, #1e293b)',
                                    borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))'
                                }}
                             >
                                 <div className="absolute inset-0 bg-teal-500/5 pointer-events-none"></div>
                                <input 
                                    className="w-full text-xs outline-none text-center touch-manipulation"
                                    style={{
                                        backgroundColor: 'transparent',
                                        boxShadow: 'none',
                                        color: 'var(--text-color-primary, #764737)'
                                    }}
                                    placeholder="TRACK 01..."
                                    value={currentData.musicTitle || ''}
                                    onChange={(e) => onUpdateText(dashboardKey, 'musicTitle', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                 />
                                 {isThisTrackPlaying && (
                                     <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[var(--ui-danger-bg)] rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
                                 )}
                             </div>

                             <div className="flex flex-col gap-2">
                                 {showLinkInput ? (
                                     <input 
                                        className="w-full text-center rounded px-1 py-2 text-[9px] border outline-none animate-in fade-in slide-in-from-top-1 touch-manipulation"
                                        style={{
                                            backgroundColor: 'var(--widget-input-background, #f8fafc)',
                                            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                                            color: 'var(--text-color-primary, #764737)'
                                        }}
                                        placeholder="Paste Link..."
                                        onKeyDown={handleLinkSubmit}
                                        autoFocus
                                        onBlur={() => setShowLinkInput(false)}
                                        onClick={(e) => e.stopPropagation()}
                                     />
                                 ) : (
                                    <div className="flex gap-2 justify-center">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowLinkInput(true);
                                            }}
                                            onTouchEnd={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setShowLinkInput(true);
                                            }}
                                            className="h-10 flex-1 rounded shadow-sm border transition-all flex items-center justify-center gap-1 active:scale-95 touch-manipulation"
                                            style={{
                                                backgroundColor: 'var(--cd-button-bg, #ffffff)',
                                                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))'
                                            }}
                                        >
                                            <span className="text-[10px] font-bold" style={{ color: 'var(--text-color-primary, #764737)' }}>LINK</span>
                                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setCdPhotoModalOpen(true);
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCdPhotoModalOpen(true);
                            }}
                            className="h-10 w-10 rounded shadow-sm border transition-all flex items-center justify-center active:scale-95 touch-manipulation text-xl"
                            style={{
                                backgroundColor: 'var(--cd-button-bg, #ffffff)',
                                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                                color: 'var(--text-color-primary, #764737)'
                            }}
                            title="사진 관리"
                        >
                            💿
                        </button>
                                    </div>
                                 )}
                                 
                                 {/* 하단 점: border 제거 */}
                                <div className="flex justify-between px-2 pt-1" style={{ borderTop: 'var(--ui-stroke-width, 1px) solid var(--ui-stroke-color)' }}>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--ui-stroke-color)' }}></div>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--ui-stroke-color)' }}></div>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--ui-stroke-color)' }}></div>
                                 </div>
                             </div>
                         </div>
                     </div>
                     
                     <input type="file" ref={musicCoverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'photoUrl')} />
                     <input type="file" ref={cdBodyBgImageRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cdBodyBgImage')} />
                </div>
            </div>

            {/* Bottom Row: Bucket List (진행도 제거, 배경 변경 버튼 분리) */}
            <div 
                data-widget="bucket"
                className="flex-1 relative border flex flex-col backdrop-blur-[1px] overflow-hidden group/bucket"
                style={{
                    borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                    backgroundColor: currentData.bucketBgImage ? 'transparent' : 'var(--widget-surface-background, #ffffff)',
                    backgroundImage: currentData.bucketBgImage ? `url(${currentData.bucketBgImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {currentData.bucketBgImage && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-0"></div>
                )}
                
                <div className="relative z-10 flex flex-col h-full">
                    {/* Bar (진행도 제거) */}
                    <div data-widget-bar className={`text-center ${compactMode ? 'text-[11px]' : 'text-[13px]'} py-1`} style={{ background: 'var(--bucket-header-bar-bg, #EFF1AA)', borderBottom: '1px solid var(--widget-border-color, var(--ui-stroke-color, #94a3b8))' }}>
                        Bucket List
                    </div>
                    
                    {/* 입력/목록 영역 */}
                    <div className="flex-1 flex flex-col p-3 pt-2 overflow-hidden">
                        <input 
                            data-widget-input
                            className="w-full text-sm border rounded-[4px] px-2 py-1.5 outline-none transition-colors mb-2 touch-manipulation"
                            style={{
                                backgroundColor: 'var(--widget-input-background, #f8fafc)',
                                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                                color: 'var(--text-color-primary, #764737)'
                            }}
                            value={bucketInput}
                            onChange={(e) => setBucketInput(e.target.value)}
                            onKeyDown={handleAddBucketItem}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Add item…"
                        />
                        <div className="flex-1 flex flex-col gap-2 overflow-auto">
                            {bucketItems.map((item, idx) => (
                                <div 
                                    key={idx}
                                    data-widget-input
                                    className="flex items-center gap-2 px-2 py-1.5 border rounded-[4px] transition-colors"
                                    style={{
                                        backgroundColor: 'var(--widget-surface-background, #ffffff)',
                                        borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.completed}
                                        onChange={(e) => toggleBucketItem(idx, e as any)}
                                        className="w-4 h-4 rounded cursor-pointer"
                                        style={{
                                            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                                            accentColor: 'var(--text-color-primary, #764737)'
                                        }}
                                    />
                                    <span className={`flex-1 text-xs ${item.completed ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--text-color-primary, #764737)' }}>
                                        {item.text}
                                    </span>
                                    <button
                                        onClick={(e) => removeBucket(idx, e)}
                                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 transition-colors"
                                        title="삭제"
                                    >
                                        <span className="text-xs text-red-500">×</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* 배경 변경 버튼 (우측 하단, 작은 버튼) */}
                    {/* 버킷리스트 사진 아이콘 제거됨 */}
                </div>
            </div>
         </div>
      </div>
      )}

      {/* --- Right Page (Calendar) --- */}
      {(viewMode === 'both' || viewMode === 'right') && (
      <div
        data-note-paper="right"
        className={`${isSpreadView ? '' : 'note-paper-surface '}flex-1 relative flex flex-col p-8 gap-3`}
        style={{
          backgroundColor: isSpreadView ? 'transparent' : 'var(--note-paper-background, #f7f5ed)',
          backgroundImage: isSpreadView ? 'none' : undefined,
          color: 'var(--ui-text-color, var(--text-color-primary, #764737))',
        }}
      >
          {/* 1. Calendar Header Bar (얇은 링크바 형태) */}
          <div
            data-calendar-header-bar
            className="w-full border rounded-lg"
            style={{
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              backgroundColor: 'var(--widget-surface-background, #ffffff)',
              backgroundImage: currentData.monthHeaderBg ? `url(${currentData.monthHeaderBg})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: 52,
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 12,
              paddingRight: 12,
              display: 'grid',
              gridTemplateColumns: compactMode ? '100px 1fr 100px' : '140px 1fr 140px',
              alignItems: 'center',
              gap: 12,
              color: 'inherit',
            }}
          >
            {/* Month */}
            <div className="min-w-0">
              <div
                className="w-full h-8 border rounded flex items-center justify-center cursor-pointer select-none overflow-hidden text-ellipsis whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--widget-surface-background, #ffffff)',
                  borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                  color: 'inherit',
                  fontSize: compactMode ? 14 : 16,
                  fontWeight: 700,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setMonthHeaderModalOpen(true);
                }}
                title="헤더 커버 변경"
              >
                {new Date(year, month, 1).toLocaleString('en-US', { month: 'long' }).toUpperCase()}
              </div>
            </div>

            {/* Marquee / Input */}
            <div
              className="min-w-0 h-8 border rounded px-2 flex items-center"
              style={{
                backgroundColor: 'var(--widget-surface-background, #ffffff)',
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                color: 'inherit',
              }}
            >
              <MarqueeField
                storageKey={`dingel:calendarMarquee:${year}-${String(month + 1).padStart(2, '0')}`}
                placeholder="전광판 문구를 입력하세요..."
                className="min-w-0 w-full"
              />
            </div>

            {/* Year controls */}
            <div
              className="flex items-center justify-end gap-2 h-8 border rounded px-1"
              style={{
                backgroundColor: 'var(--widget-surface-background, #ffffff)',
                borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                color: 'inherit',
              }}
            >
              <button
                className="flex items-center justify-center w-7 h-7 hover:opacity-75 active:scale-95 transition-all touch-manipulation"
                style={{ backgroundColor: 'transparent' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onYearChange) onYearChange(year - 1);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onYearChange) onYearChange(year - 1);
                }}
                title="이전 년도"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className={compactMode ? "text-[11px]" : "text-[13px]"} style={{ fontWeight: 600 }}>
                {year}
              </span>

              <button
                className="flex items-center justify-center w-7 h-7 hover:opacity-75 active:scale-95 transition-all touch-manipulation"
                style={{ backgroundColor: 'transparent' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onYearChange) onYearChange(year + 1);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onYearChange) onYearChange(year + 1);
                }}
                title="다음 년도"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* cover 기능은 유지(실험 단계: UI는 숨김) */}
          <input type="file" ref={monthHeaderBgRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'monthHeaderBg')} />

          {/* ✅ ui:selftest/레거시 호환: 기존 cover 헤더 DOM은 유지하되 UI에서는 숨김 */}
          <div
            data-calendar-header
            data-has-bg-image={currentData.monthHeaderBg ? 'true' : 'false'}
            style={{
              display: 'none',
              backgroundColor: 'var(--calendar-date-header-bg, var(--calendar-weekday-header-bg))',
              backgroundImage: currentData.monthHeaderBg ? `url(${currentData.monthHeaderBg})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              boxShadow: 'none',
              filter: 'none',
            }}
          />

          {/* 2. 달력 그리드 (6×7 고정 + 정사각형에 가깝게, 높이만 소폭 감소) */}
          <div className="flex-none w-full" style={{ aspectRatio: '1.04 / 1' }}>
              <div
                data-calendar-grid
                className="w-full h-full border rounded overflow-hidden flex flex-col"
                style={{ 
                  borderColor: 'var(--calendar-grid-line-color, var(--ui-stroke-color, #d1d5db))',
                  backgroundColor: 'transparent'
                }}
              >
                 {/* Header Row - 요일 */}
                 <div data-calendar-weekday-header className="grid grid-cols-7 h-9" style={{ backgroundColor: 'var(--calendar-weekday-header-bg, #FEDFDC)' }}>
                     {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
                         <div 
                            key={d} 
                            className={`flex items-center justify-center font-mono font-bold ${compactMode ? 'text-[10px]' : 'text-xs'} relative group/dow overflow-hidden`}
                            style={{
                                borderRight: i < 6 ? '1px solid var(--calendar-grid-line-color, var(--ui-stroke-color, #d1d5db))' : 'none',
                                borderBottom: '1px solid var(--calendar-grid-line-color, var(--ui-stroke-color, #d1d5db))',
                                backgroundImage: currentData[dowKeys[i]] ? `url(${currentData[dowKeys[i]]})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                color: 'var(--text-color-primary, #764737)'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                dowRefs[i].current?.click();
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                dowRefs[i].current?.click();
                            }}
                         >
                             {/* hover 시 은은한 오버레이 */}
                             <div className="absolute inset-0 opacity-0 group-hover/dow:opacity-100 transition-opacity bg-black/5"></div>
                             
                             {currentData[dowKeys[i]] && (
                                 <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]"></div>
                             )}
                             <span className="relative z-10">{d}</span>
                             <input 
                                type="file" 
                                ref={dowRefs[i]} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => handleImageUpload(e, dowKeys[i])} 
                             />
                         </div>
                     ))}
                 </div>
                 
                 {/* Calendar Grid - 6행 고정, gap 0, border-right/bottom만 (중복 제거) */}
                 <div
                   className="grid grid-cols-7 flex-1"
                   style={{
                     gridTemplateRows: 'repeat(6, 1fr)',
                     gap: 0,
                     minHeight: compactMode ? '550px' : 'auto'
                   }}
                 >
                   {weeks.map((week, wIdx) =>
                     week.map((cell, cIdx) => (
                       <div
                         key={`${formatDateKey(cell.date)}-${wIdx}-${cIdx}`}
                         style={{
                           borderRight: cIdx < 6 ? '1px solid var(--calendar-grid-line-color, var(--ui-stroke-color, #d1d5db))' : 'none',
                           borderBottom: wIdx < 5 ? '1px solid var(--calendar-grid-line-color, var(--ui-stroke-color, #d1d5db))' : 'none',
                           backgroundColor: 'transparent'
                         }}
                       >
                         {renderCell(cell.date, cell.isInMonth)}
                       </div>
                     ))
                   )}
                 </div>
              </div>
          </div>

          {/* 3. Link Dock (달력 아래, 폭=달력과 동일) */}
          {onInsertLinksToDate && linkDockItems && setLinkDockItems && (
            <div className="w-full">
              <LinkDock
                viewDate={currentDate}
                items={linkDockItems}
                setItems={setLinkDockItems}
                onInsertLinksToDate={onInsertLinksToDate}
                onAddPhotoToDate={onAddPhotoToDate}
              />
            </div>
          )}
      </div>
      )}

      {/* CD 플레이어 사진 관리 모달 */}
      <CompactModal
        isOpen={cdPhotoModalOpen}
        onClose={() => setCdPhotoModalOpen(false)}
        title="CD 플레이어 사진 관리"
      >
        <button
          className="w-full px-3 py-1.5 text-xs font-medium rounded border hover:opacity-80 transition-all"
          style={{
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            color: 'inherit',
          }}
          onClick={(e) => {
            e.stopPropagation();
            musicCoverInputRef.current?.click();
            setCdPhotoModalOpen(false);
          }}
        >
          💿 CD 커버 사진 교체
        </button>
        <button
          className="w-full px-3 py-1.5 text-xs font-medium rounded border hover:opacity-80 transition-all"
          style={{
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            color: 'inherit',
          }}
          onClick={(e) => {
            e.stopPropagation();
            cdBodyBgImageRef.current?.click();
            setCdPhotoModalOpen(false);
          }}
        >
          🎨 플레이어 본체 사진 교체
        </button>
        {currentData.photoUrl && (
          <button
            className="w-full px-3 py-1.5 text-xs font-medium rounded border hover:opacity-80 transition-all text-red-600"
            style={{
              backgroundColor: 'var(--widget-surface-background, #ffffff)',
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateText(dashboardKey, 'photoUrl', '');
              setCdPhotoModalOpen(false);
            }}
          >
            🗑️ CD 커버 삭제
          </button>
        )}
        {currentData.cdBodyBgImage && (
          <button
            className="w-full px-3 py-1.5 text-xs font-medium rounded border hover:opacity-80 transition-all text-red-600"
            style={{
              backgroundColor: 'var(--widget-surface-background, #ffffff)',
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateText(dashboardKey, 'cdBodyBgImage', '');
              setCdPhotoModalOpen(false);
            }}
          >
            🗑️ 플레이어 본체 삭제
          </button>
        )}
      </CompactModal>

      {/* 프로필 사진 관리 모달 */}
      <CompactModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="프로필 사진 관리"
      >
        <button
          className="w-full px-3 py-1.5 text-xs font-medium rounded border hover:opacity-80 transition-all"
          style={{
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            color: 'inherit',
          }}
          onClick={(e) => {
            e.stopPropagation();
            profileImageRef.current?.click();
            setProfileModalOpen(false);
          }}
        >
          이번 달만 등록
        </button>
        <button
          className="w-full px-3 py-1.5 text-xs font-medium rounded border hover:opacity-80 transition-all"
          style={{
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            color: 'inherit',
          }}
          onClick={async (e) => {
            e.stopPropagation();
            if (!currentData.profileImage) {
              alert('먼저 프로필 사진을 등록해주세요.');
              profileImageRef.current?.click();
              return;
            }
            // 2026년 전체 월에 동일 프로필 사진 적용
            for (let m = 1; m <= 12; m++) {
              const key = `2026-${String(m).padStart(2, '0')}-DASHBOARD`;
              onUpdateText(key, 'profileImage', currentData.profileImage);
            }
            setProfileModalOpen(false);
          }}
        >
          2026년 전체 등록
        </button>
        {currentData.profileImage && (
          <button
            className="w-full px-3 py-1.5 text-xs font-medium rounded border hover:opacity-80 transition-all text-red-600"
            style={{
              backgroundColor: 'var(--widget-surface-background, #ffffff)',
              borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateText(dashboardKey, 'profileImage', '');
              setProfileModalOpen(false);
            }}
          >
            🗑️ 사진 삭제
          </button>
        )}
      </CompactModal>

      {/* 달력 사진 관리 모달 - 고도화 버전 */}
      <CalendarPhotoModal
        isOpen={monthHeaderModalOpen}
        onClose={() => setMonthHeaderModalOpen(false)}
        year={year}
        month={month}
        textData={textData}
        onUpdateText={onUpdateText}
        dashboardKey={dashboardKey}
        monthHeaderBgRef={monthHeaderBgRef}
        currentMonthHeaderBg={currentData.monthHeaderBg}
        dowKeys={dowKeys}
        dowRefs={dowRefs}
      />
    </>
  );
};

export default MonthlySpread;

