import React, { useState } from 'react';
import { DEFAULT_THEMES, Theme } from '../../constants/themes';
import { Sticker } from '../../types';
import { AVAILABLE_FONTS, FontId } from '../../constants/fonts';

interface UIPanelProps {
  onClose: () => void;
  onApplyTheme: (theme: Theme) => void;
  onShowAdvanced: () => void;
  stickers?: Sticker[];
  onStickerAdd?: (sticker: Sticker) => void;
  onStickerDelete?: (stickerId: string) => void;
}

// 🍔 음식 스티커
const FOOD_STICKERS = [
    { name: '햄버거', url: '/hamburger_361.webp' },
    { name: '피자', url: '/pizza_slice_362.webp' },
    { name: '감자튀김', url: '/french_fries_363.webp' },
    { name: '핫도그', url: '/hot_dog_364.webp' },
    { name: '샌드위치', url: '/sandwich_365.webp' },
    { name: '치킨', url: '/fried_chicken_366.webp' },
    { name: '콘도그', url: '/corn_dog_367.webp' },
    { name: '타코', url: '/taco_368.webp' },
    { name: '초밥', url: '/shrimp_sushi_369.webp' },
    { name: '주먹밥', url: '/onigiri_370.webp' },
    { name: '라멘', url: '/ramen_bowl_371.webp' },
    { name: '튀김', url: '/tempura_shrimp_372.webp' },
    { name: '만두', url: '/dumpling_373.webp' },
    { name: '카레', url: '/curry_rice_374.webp' },
    { name: '팬케이크', url: '/pancakes_375.webp' },
    { name: '도넛', url: '/donut_376.webp' },
    { name: '아이스크림', url: '/ice_cream_cone_377.webp' },
    { name: '푸딩', url: '/pudding_378.webp' },
    { name: '팝콘', url: '/popcorn_379.webp' },
    { name: '소프트아이스크림', url: '/soft_serve_380.webp' },
];

// 🥤 음료 스티커
const DRINK_STICKERS = [
    { name: '커피', url: '/hot_coffee_mug_421.webp' },
    { name: '라떼', url: '/iced_latte_422.webp' },
    { name: '소다', url: '/soda_bottle_glass_423.webp' },
    { name: '주스박스', url: '/juice_box_424.webp' },
    { name: '버블티', url: '/bubble_tea_425.webp' },
    { name: '티팟', url: '/teapot_426.webp' },
    { name: '핫초코', url: '/hot_cocoa_marshmallow_427.webp' },
    { name: '콜라', url: '/cola_can_428.webp' },
    { name: '레모네이드', url: '/lemonade_jar_429.webp' },
    { name: '우유', url: '/milk_bottle_vintage_430.webp' },
    { name: '스무디', url: '/berry_smoothie_431.webp' },
    { name: '컵캐리어', url: '/cup_carrier_432.webp' },
    { name: '물병', url: '/water_bottle_sport_433.webp' },
    { name: '맥주', url: '/beer_stein_434.webp' },
    { name: '와인', url: '/wine_glass_435.webp' },
    { name: '티컵', url: '/teacup_saucer_436.webp' },
    { name: '에너지드링크', url: '/energy_drink_can_437.webp' },
    { name: '텀블러', url: '/thermos_tumbler_438.webp' },
    { name: '말차', url: '/matcha_bowl_whisk_439.webp' },
    { name: '마티니', url: '/martini_glass_440.webp' },
];

// 🍎 과일 스티커
const FRUIT_STICKERS = [
    { name: '사과', url: '/apple_red_441.webp' },
    { name: '바나나', url: '/banana_peeled_442.webp' },
    { name: '포도', url: '/grapes_bunch_443.webp' },
    { name: '수박', url: '/watermelon_slice_444.webp' },
    { name: '딸기', url: '/strawberry_445.webp' },
    { name: '파인애플', url: '/pineapple_446.webp' },
    { name: '오렌지', url: '/orange_half_447.webp' },
    { name: '복숭아', url: '/peach_pink_448.webp' },
    { name: '체리', url: '/cherries_pair_449.webp' },
    { name: '키위', url: '/kiwi_slice_450.webp' },
    { name: '레몬', url: '/lemon_yellow_451.webp' },
    { name: '멜론', url: '/melon_cantaloupe_452.webp' },
    { name: '감', url: '/persimmon_453.webp' },
    { name: '망고', url: '/mango_yellow_455.webp' },
    { name: '배', url: '/pear_green_456.webp' },
    { name: '블루베리', url: '/blueberries_group_457.webp' },
    { name: '라즈베리', url: '/raspberry_red_458.webp' },
    { name: '용과', url: '/dragon_fruit_459.webp' },
    { name: '코코넛', url: '/coconut_brown_460.webp' },
];

// 🌸 꽃/식물 스티커
const NATURE_STICKERS = [
    { name: '해바라기', url: '/sunflower_461.webp' },
    { name: '클로버', url: '/four_leaf_clover_462.webp' },
    { name: '장미', url: '/red_rose_463.webp' },
    { name: '튤립', url: '/tulip_pink_464.webp' },
    { name: '민들레', url: '/dandelion_puff_465.webp' },
    { name: '몬스테라', url: '/monstera_leaf_466.webp' },
    { name: '다육식물', url: '/succulent_rosette_467.webp' },
    { name: '은방울꽃', url: '/lily_of_the_valley_468.webp' },
    { name: '파리지옥', url: '/venus_flytrap_469.webp' },
    { name: '벚꽃', url: '/cherry_blossom_470.webp' },
    { name: '버섯', url: '/mushroom_toadstool_471.webp' },
    { name: '대나무', url: '/bamboo_stalk_472.webp' },
    { name: '양치식물', url: '/fern_fiddlehead_473.webp' },
    { name: '라벤더', url: '/lavender_stalks_474.webp' },
    { name: '은행잎', url: '/ginkgo_leaf_475.webp' },
    { name: '솔방울', url: '/pinecone_476.webp' },
    { name: '새싹', url: '/sprout_seedling_477.webp' },
    { name: '수련', url: '/water_lily_pad_478.webp' },
    { name: '선인장', url: '/cactus_bunnyears_479.webp' },
    { name: '블루벨', url: '/bluebell_flower_480.webp' },
];

const ALL_DEFAULT_STICKERS = [
    ...FOOD_STICKERS,
    ...DRINK_STICKERS,
    ...FRUIT_STICKERS,
    ...NATURE_STICKERS,
];

const UIPanel: React.FC<UIPanelProps> = ({
  onClose,
  onApplyTheme,
  onShowAdvanced,
  stickers = [],
  onStickerAdd,
  onStickerDelete,
}) => {
  const [activePage, setActivePage] = useState<'theme' | 'sticker' | 'font'>('theme');
  const [selectedFont, setSelectedFont] = useState<FontId>(() => {
    const saved = localStorage.getItem('dingle:font') as FontId;
    return saved || 'noto';
  });

  const handleStickerUpload = async () => {
    if (!window.electron?.stickerUpload) return;
    
    const result = await window.electron.stickerUpload();
    if (result.success && result.sticker && onStickerAdd) {
      onStickerAdd(result.sticker);
    }
  };

  const handleStickerDelete = async (sticker: Sticker) => {
    if (!window.electron?.stickerDelete || !onStickerDelete) return;
    
    if (confirm(`"${sticker.name}" 스티커를 삭제하시겠습니까?`)) {
      const result = await window.electron.stickerDelete(sticker.filePath);
      if (result.success) {
        onStickerDelete(sticker.id);
      }
    }
  };
  return (
    <div className="h-full flex flex-col" style={{
      backgroundColor: 'var(--note-paper-background, #f7f5ed)',
      color: 'var(--month-tab-text-color, #764737)',
    }}>
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between" style={{
        borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
      }}>
        <h3 className="text-base font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.747 18.747 0 00-3.471 2.987 10.04 10.04 0 014.815 4.815 18.748 18.748 0 002.987-3.472l3.386-5.079A1.902 1.902 0 0020.599 1.5zm-8.3 14.025a18.76 18.76 0 001.896-1.207 8.026 8.026 0 00-4.513-4.513A18.75 18.75 0 008.475 11.7l-.278.5a5.26 5.26 0 013.601 3.602l.502-.278zM6.75 13.5A3.75 3.75 0 003 17.25a1.5 1.5 0 01-1.601 1.497.75.75 0 00-.7 1.123 5.25 5.25 0 009.8-2.62 3.75 3.75 0 00-3.75-3.75z" clipRule="evenodd" />
          </svg>
          꾸미기
        </h3>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b" style={{
        borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
      }}>
        <button
          onClick={() => setActivePage('theme')}
          className={`flex-1 px-3 py-2 text-sm font-semibold transition-colors ${
            activePage === 'theme' ? 'border-b-2' : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            borderColor: activePage === 'theme' ? 'currentColor' : 'transparent',
          }}
        >
          테마
        </button>
        <button
          onClick={() => setActivePage('sticker')}
          className={`flex-1 px-3 py-2 text-sm font-semibold transition-colors ${
            activePage === 'sticker' ? 'border-b-2' : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            borderColor: activePage === 'sticker' ? 'currentColor' : 'transparent',
          }}
        >
          스티커
        </button>
        <button
          onClick={() => setActivePage('font')}
          className={`flex-1 px-3 py-2 text-sm font-semibold transition-colors ${
            activePage === 'font' ? 'border-b-2' : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            borderColor: activePage === 'font' ? 'currentColor' : 'transparent',
          }}
        >
          폰트
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* 테마 페이지 */}
        {activePage === 'theme' && (
          <>
            <section className="mb-4">
              <h4 className="text-sm font-semibold mb-2 pb-1.5 border-b" style={{
                borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}>
                테마 선택
              </h4>
              
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[600px]">
                {DEFAULT_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => onApplyTheme(theme)}
                    className="w-full p-2 rounded-lg border hover:shadow-lg transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: 'var(--widget-input-background, #f8fafc)',
                      borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                    }}
                  >
                    {/* 테마 색상 미리보기 */}
                    <div className="flex gap-1">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.uiPalette.strokeColor }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.uiPalette.monthTabBgActive }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.uiPalette.keyringMetalColor }}
                      />
                    </div>
                    
                    {/* 테마 이름 (가운데 정렬) */}
                    <div className="flex-1 text-center">
                      <div className="text-sm font-semibold">{theme.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* 고급 모드 */}
            <section>
              <button
                onClick={onShowAdvanced}
                className="w-full px-3 py-2 rounded-lg border text-left hover:opacity-80 transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--widget-input-background, #f8fafc)',
                  borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">고급 모드</div>
                  <div className="text-[10px] opacity-60">1:1 매핑</div>
                </div>
              </button>
            </section>
          </>
        )}

        {/* 스티커 페이지 */}
        {activePage === 'sticker' && (
          <>
            {/* 기본 스티커 섹션 - 드래그 가능 */}
            <section className="mb-4">
              <h4 className="text-sm font-semibold mb-2 pb-1.5 border-b" style={{
                borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}>
                기본 스티커 ({ALL_DEFAULT_STICKERS.length})
              </h4>
              
              <div className="grid grid-cols-4 gap-1.5 max-h-[300px] overflow-y-auto">
                {ALL_DEFAULT_STICKERS.map((sticker, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('sticker-type', 'default');
                      e.dataTransfer.setData('sticker-url', sticker.url);
                      e.dataTransfer.setData('sticker-name', sticker.name);
                    }}
                    className="aspect-square rounded-lg border overflow-hidden hover:shadow-lg transition-all cursor-grab active:cursor-grabbing"
                    style={{
                      borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                    }}
                    title={sticker.name}
                  >
                    <img
                      src={sticker.url}
                      alt={sticker.name}
                      className="w-full h-full object-contain p-1"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* 스티커 업로드 섹션 */}
            <section className="mb-4">
              <h4 className="text-sm font-semibold mb-2 pb-1.5 border-b" style={{
                borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}>
                스티커 업로드
              </h4>
              
              <button
                onClick={handleStickerUpload}
                className="w-full px-3 py-2 rounded-lg border text-left hover:opacity-80 transition-colors flex items-center gap-2"
                title="PNG, JPG, GIF, WEBP, SVG 파일을 업로드할 수 있습니다"
                style={{
                  backgroundColor: 'var(--widget-input-background, #f8fafc)',
                  borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">스티커 추가</div>
                  <div className="text-[10px] opacity-60">PNG/SVG/GIF</div>
                </div>
              </button>
            </section>

            {/* 내 스티커 섹션 - 드래그 가능 */}
            <section>
              <h4 className="text-sm font-semibold mb-2 pb-1.5 border-b" style={{
                borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}>
                내 스티커 ({stickers.length})
              </h4>
              
              {stickers.length === 0 ? (
                <div className="text-xs opacity-60 text-center py-6">
                  아직 스티커가 없습니다
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {stickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('sticker-type', 'uploaded');
                        e.dataTransfer.setData('sticker-path', sticker.filePath);
                        e.dataTransfer.setData('sticker-name', sticker.name);
                        e.dataTransfer.setData('sticker-thumbnail', sticker.thumbnail || '');
                      }}
                      className="relative group aspect-square rounded-lg border overflow-hidden hover:shadow-lg transition-all cursor-grab active:cursor-grabbing"
                      style={{
                        borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                      }}
                    >
                      <img
                        src={sticker.thumbnail || sticker.filePath}
                        alt={sticker.name}
                        className="w-full h-full object-contain p-2"
                        draggable={false}
                      />
                      <button
                        onClick={() => handleStickerDelete(sticker)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="삭제"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* 폰트 페이지 */}
        {activePage === 'font' && (
          <>
            <section className="mb-4">
              <h4 className="text-sm font-semibold mb-2 pb-1.5 border-b" style={{
                borderColor: 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
              }}>
                폰트 선택
              </h4>
              
              <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto">
                {AVAILABLE_FONTS.map((font) => {
                  const isSelected = selectedFont === font.id;
                  return (
                    <button
                      key={font.id}
                      onClick={() => {
                        // 1. data-font 속성 변경 (documentElement에 적용!)
                        document.documentElement.setAttribute('data-font', font.id);
                        // 2. localStorage에 저장
                        localStorage.setItem('dingle:font', font.id);
                        // 3. 상태 업데이트
                        setSelectedFont(font.id);
                        // 4. 강제로 CSS 변수 적용 확인
                        console.log('✅ Font changed to:', font.id, font.family);
                      }}
                      className="w-full px-3 py-2 rounded-lg border text-left hover:opacity-80 transition-all"
                      style={{
                        backgroundColor: isSelected 
                          ? 'var(--month-tab-bg-active, #fef3c7)' 
                          : 'var(--widget-input-background, #f8fafc)',
                        borderColor: isSelected
                          ? 'var(--ui-primary-color, #f59e0b)'
                          : 'var(--month-tab-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
                        borderWidth: isSelected ? '2px' : '1px',
                        fontFamily: font.family,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{font.name}</div>
                          <div className="text-[10px] opacity-60">가나다 ABC 123</div>
                        </div>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default UIPanel;

