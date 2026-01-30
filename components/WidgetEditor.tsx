import React, { useState, useEffect, useRef } from 'react';

// 위젯/테마 팔레트 전용 설정 변수들
const WIDGET_VARIABLES = [
  // --- 앱/노트 배경 ---
  { label: '앱 배경색 (바깥)', name: '--app-background', type: 'color' },
  { label: '노트 종이 배경', name: '--note-paper-background', type: 'color' },

  // --- 위젯 공통 ---
  { label: '위젯 테두리 색', name: '--widget-border-color', type: 'color' },
  { label: '위젯 내부 배경', name: '--widget-surface-background', type: 'color' },
  { label: '입력칸 배경', name: '--widget-input-background', type: 'color' },
  { label: '텍스트 색(Primary)', name: '--text-color-primary', type: 'color' },

  // --- 위젯 상단 바 색상 ---
  { label: '프로필 위젯 바', name: '--profile-header-bar-bg', type: 'color' },
  { label: '목표 위젯 바', name: '--goals-header-bar-bg', type: 'color' },
  { label: '디데이 위젯 바', name: '--dday-header-bar-bg', type: 'color' },
  { label: '오하아사 위젯 바', name: '--ohaasa-header-bar-bg', type: 'color' },
  { label: '버킷리스트 위젯 바', name: '--bucket-header-bar-bg', type: 'color' },

  // --- 달력 ---
  { label: '달력 날짜 헤더 배경(상단 바)', name: '--calendar-date-header-bg', type: 'color' },
  { label: '달력 요일 헤더 배경', name: '--calendar-weekday-header-bg', type: 'color' },
  { label: '오늘 하이라이트 배경', name: '--calendar-today-highlight-bg', type: 'color' },

  // --- CD / 키링 ---
  { label: 'CD 위젯 배경', name: '--cd-widget-background', type: 'color' },
  { label: '키링 메탈 색', name: '--keyring-metal-color', type: 'color' },

  // --- 둥글기 ---
  { label: '작은 둥글기 (위젯 내부)', name: '--radius-sm', type: 'range', min: 0, max: 30, unit: 'px' },
  { label: '큰 둥글기 (위젯 전체)', name: '--radius-md', type: 'range', min: 0, max: 50, unit: 'px' },

  // --- 글자 크기 ---
  { label: '위젯 바 글자 크기', name: '--widget-title-size', type: 'range', min: 8, max: 20, unit: 'px' },
  { label: '입력칸 글자 크기', name: '--widget-input-size', type: 'range', min: 10, max: 24, unit: 'px' },
];

export default function WidgetEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  // ✅ 검증(Flash) 모드
  const [testMode, setTestMode] = useState(false);
  const [testColor, setTestColor] = useState('#ff00ff'); // 눈에 띄는 핫핑크
  const [testDuration, setTestDuration] = useState(800); // ms
  const [activeTestVar, setActiveTestVar] = useState<string | null>(null);

  // flash 중복 클릭 방지 + 원복값 보관
  const flashTimerRef = useRef<number | null>(null);
  const flashOriginalRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const el = (document.querySelector('[data-theme]') as HTMLElement) || document.body;
    setTargetElement(el);

    const styles = getComputedStyle(el);
    const newValues: Record<string, string> = {};

    WIDGET_VARIABLES.forEach((v) => {
      const value = styles.getPropertyValue(v.name).trim();
      if (!value && v.name === '--widget-title-size') newValues[v.name] = '10px';
      else if (!value && v.name === '--widget-input-size') newValues[v.name] = '14px';
      else newValues[v.name] = value;
    });

    setValues(newValues);
  }, []);

  const handleChange = (name: string, value: string, unit: string = '') => {
    if (!targetElement) return;
    const fullValue = value + unit;
    setValues((prev) => ({ ...prev, [name]: fullValue }));
    targetElement.style.setProperty(name, fullValue);
  };

  // ✅ 검증: 해당 변수만 잠깐 튀는 색으로 바꾸고 원복
  const flashVar = (varName: string) => {
    if (!targetElement) return;

    // range류는 색으로 플래시하면 깨지니까 차단
    const meta = WIDGET_VARIABLES.find(v => v.name === varName);
    if (!meta || meta.type !== 'color') return;

    // 이미 flash 중이면 일단 원복하고 새로
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    if (activeTestVar) {
      const prevOriginal = flashOriginalRef.current[activeTestVar];
      if (prevOriginal != null) targetElement.style.setProperty(activeTestVar, prevOriginal);
      setActiveTestVar(null);
    }

    // 원래 값(컴퓨티드) 저장
    const original = getComputedStyle(targetElement).getPropertyValue(varName).trim();
    flashOriginalRef.current[varName] = original;

    // 적용 (⚠️ values는 건드리지 않음)
    targetElement.style.setProperty(varName, testColor);
    setActiveTestVar(varName);

    flashTimerRef.current = window.setTimeout(() => {
      targetElement.style.setProperty(varName, original);
      setActiveTestVar(null);
      flashTimerRef.current = null;
    }, testDuration);
  };

  // ✅ 전체 자동 검사(원하면): color 토큰을 순서대로 flash
  const runAutoTest = async () => {
    if (!targetElement) return;
    const colorVars = WIDGET_VARIABLES.filter(v => v.type === 'color').map(v => v.name);
    for (const name of colorVars) {
      flashVar(name);
      // flashDuration + 약간 여유
      await new Promise(res => setTimeout(res, testDuration + 120));
    }
  };

  const copyCSS = () => {
    let css = `/* 위젯 커스텀 CSS - index.html의 [data-theme] 안에 붙여넣으세요 */\n`;
    Object.entries(values).forEach(([key, val]) => {
      if (val) css += `${key}: ${val};\n`;
    });
    navigator.clipboard.writeText(css);
    alert('위젯 CSS 코드가 복사되었습니다! index.html의 테마 영역을 수정하세요.');
  };

  const resetToDefault = () => {
    if (!window.confirm('위젯 설정을 기본값으로 되돌릴까요?')) return;

    const defaults: Record<string, string> = {
      '--app-background': '#ffffff',
      '--note-paper-background': '#f7f5ed',
      '--widget-border-color': 'rgba(148, 163, 184, 0.6)',
      '--widget-surface-background': '#ffffff',
      '--widget-input-background': '#fef5f5',
      '--text-color-primary': '#764737',
      '--profile-header-bar-bg': '#f9d4f0',
      '--goals-header-bar-bg': '#fedfdc',
      '--dday-header-bar-bg': '#fcf5c8',
      '--ohaasa-header-bar-bg': '#ebe7f5',
      '--bucket-header-bar-bg': '#eff1aa',
      '--calendar-date-header-bg': '#f7f5ed',
      '--calendar-weekday-header-bg': '#f7f5ed',
      '--calendar-today-highlight-bg': '#fffce1',
      '--cd-widget-background': '#f4f5e1',
      '--keyring-metal-color': '#764737',
      '--radius-sm': '4px',
      '--radius-md': '7px',
      '--widget-title-size': '9px',
      '--widget-input-size': '10px',
    };

    if (targetElement) {
      Object.entries(defaults).forEach(([key, val]) => {
        targetElement.style.setProperty(key, val);
      });
    }
    setValues(defaults);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-36 right-4 z-[9997] bg-white text-stone-600 p-3 rounded-full shadow-lg border-2 border-stone-200 hover:scale-110 hover:text-pink-500 transition-all"
        title="위젯 디자인 편집"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-[9997] w-80 bg-white/95 backdrop-blur-md border-2 border-pink-300 rounded-xl shadow-2xl p-4 max-h-[85vh] overflow-y-auto font-sans">
      <div className="flex justify-between items-center mb-3 border-b border-pink-100 pb-2">
        <h3 className="font-bold text-stone-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
          </svg>
          위젯 디자인 편집
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-red-500 px-2 text-lg">✕</button>
      </div>

      {/* ✅ 검증(Flash) 컨트롤 */}
      <div className="mb-4 p-3 rounded-lg border border-pink-100 bg-pink-50/40">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-stone-700">🧪 검증 모드</div>
          <button
            onClick={() => setTestMode(v => !v)}
            className={`text-xs font-bold px-2 py-1 rounded border ${
              testMode ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-700 border-stone-200'
            }`}
          >
            {testMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {testMode && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-[10px] text-stone-500 w-14">색</div>
              <input
                type="color"
                value={testColor}
                onChange={(e) => setTestColor(e.target.value)}
                className="w-10 h-7 p-0 border-0 bg-transparent"
              />
              <input
                type="text"
                value={testColor}
                onChange={(e) => setTestColor(e.target.value)}
                className="flex-1 text-xs border border-stone-200 rounded px-2 py-1 bg-white font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="text-[10px] text-stone-500 w-14">시간</div>
              <input
                type="range"
                min={200}
                max={2000}
                step={50}
                value={testDuration}
                onChange={(e) => setTestDuration(parseInt(e.target.value))}
                className="flex-1 accent-pink-500"
              />
              <div className="text-[10px] font-mono w-12 text-right">{testDuration}ms</div>
            </div>

            <button
              onClick={runAutoTest}
              className="w-full text-xs font-bold py-2 rounded bg-white border border-stone-200 hover:bg-stone-50"
            >
              ▶ 전체 자동 검사 (색 토큰 순회)
            </button>

            <div className="text-[10px] text-stone-500 leading-snug">
              각 항목 오른쪽의 <b>TEST</b>를 누르면 <b>그 변수만</b> 잠깐 바뀜 → 어떤 영역이 물리는지 바로 확인 가능.
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {WIDGET_VARIABLES.map((v) => (
          <div
            key={v.name}
            className={`flex flex-col gap-1 rounded-lg p-2 -mx-2 ${
              activeTestVar === v.name ? 'bg-yellow-50 border border-yellow-200' : ''
            }`}
          >
            <div className="flex justify-between items-center text-xs font-bold text-stone-600">
              <label>{v.label}</label>
              <div className="flex items-center gap-2">
                {testMode && v.type === 'color' && (
                  <button
                    onClick={() => flashVar(v.name)}
                    className="text-[10px] font-bold px-2 py-1 rounded border border-stone-200 bg-white hover:bg-stone-50"
                    title="이 변수만 잠깐 변경"
                  >
                    TEST
                  </button>
                )}
                <span className="text-pink-500">{values[v.name]}</span>
              </div>
            </div>

            {v.type === 'color' ? (
              <div className="flex gap-2 items-center">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-stone-200 shadow-sm shrink-0">
                  <input
                    type="color"
                    // rgba 등이 들어오면 color input이 못 읽어서 fallback
                    value={values[v.name]?.trim().startsWith('#') ? values[v.name].trim() : '#ffffff'}
                    onChange={(e) => handleChange(v.name, e.target.value)}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 cursor-pointer border-0"
                  />
                </div>
                <input
                  type="text"
                  value={values[v.name] || ''}
                  onChange={(e) => handleChange(v.name, e.target.value)}
                  className="flex-1 text-xs border border-stone-200 rounded px-2 py-1 bg-stone-50 focus:border-pink-400 outline-none font-mono"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={v.min}
                  max={v.max}
                  value={parseInt(values[v.name] || '0')}
                  onChange={(e) => handleChange(v.name, e.target.value, v.unit)}
                  className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <span className="text-xs w-12 text-right font-mono">{values[v.name]}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-pink-100 space-y-2">
        <button
          onClick={copyCSS}
          className="w-full bg-stone-800 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-stone-700 active:scale-95 transition-all shadow-md"
        >
          📋 CSS 코드 복사하기
        </button>
        <button
          onClick={resetToDefault}
          className="w-full bg-pink-50 text-pink-600 py-2.5 rounded-lg text-sm font-bold border border-pink-200 hover:bg-pink-100 active:scale-95 transition-all"
        >
          🔄 기본값으로 되돌리기
        </button>
        <p className="text-[10px] text-stone-400 text-center mt-2">
          복사 후 index.html의 [data-theme] 안에 덮어쓰세요.
        </p>
      </div>
    </div>
  );
}
