import React, { useState } from 'react';
import { ScrapType, ScrapMetadata } from '../types';

interface DecorationSelectorProps {
  onSelect: (type: ScrapType, metadata: ScrapMetadata) => void;
  className?: string;
}

const EMOJIS = ['🧸', '🎀', '✨', '💖', '🐰', '🍒', '🦋', '🍀', '👑', '⭐️', '🐾', '🌷', '🍰', '🎧', '📸'];
const TAPE_COLORS = [
    { name: 'Red', val: 'rgba(252, 165, 165, 0.8)' },
    { name: 'Orange', val: 'rgba(253, 186, 116, 0.8)' },
    { name: 'Yellow', val: 'rgba(253, 224, 71, 0.8)' },
    { name: 'Green', val: 'rgba(134, 239, 172, 0.8)' },
    { name: 'Blue', val: 'rgba(147, 197, 253, 0.8)' },
    { name: 'Purple', val: 'rgba(216, 180, 254, 0.8)' },
    { name: 'Pink', val: 'rgba(249, 168, 212, 0.8)' },
    { name: 'Grey', val: 'rgba(209, 213, 219, 0.8)' },
];

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
    { name: '석류', url: '/pomegranate_open_454.webp' },
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

const DecorationSelector: React.FC<DecorationSelectorProps> = ({ onSelect, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'emoji' | 'food' | 'drink' | 'fruit' | 'nature' | 'tape'>('emoji');

  return (
    <div className={`relative ${className}`}>
        {/* Toggle Button - Styled to match Top Toolbar */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-12 h-12 bg-white rounded-full shadow-md border border-stone-200 flex items-center justify-center text-stone-600 hover:text-purple-600 hover:scale-105 active:scale-95 transition-all group touch-manipulation"
            title="Decorations"
        >
            <span className="text-xl group-hover:rotate-12 transition-transform block">🎨</span>
        </button>

        {/* Modal Popover */}
        {isOpen && (
            <div className="fixed top-8 right-24 z-[9000] bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-slate-200 w-80 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                {/* Header with Close Button */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700">스티커 & 데코</h3>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="text-slate-400 hover:text-red-500 font-bold text-2xl touch-manipulation w-8 h-8 flex items-center justify-center"
                    >
                        ×
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-slate-100 p-1 gap-1 overflow-x-auto">
                    <button onClick={() => setActiveTab('emoji')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors touch-manipulation whitespace-nowrap ${activeTab === 'emoji' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>😊 이모지</button>
                    <button onClick={() => setActiveTab('food')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors touch-manipulation whitespace-nowrap ${activeTab === 'food' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>🍔 음식</button>
                    <button onClick={() => setActiveTab('drink')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors touch-manipulation whitespace-nowrap ${activeTab === 'drink' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>🥤 음료</button>
                    <button onClick={() => setActiveTab('fruit')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors touch-manipulation whitespace-nowrap ${activeTab === 'fruit' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>🍎 과일</button>
                    <button onClick={() => setActiveTab('nature')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors touch-manipulation whitespace-nowrap ${activeTab === 'nature' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>🌸 자연</button>
                    <button onClick={() => setActiveTab('tape')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors touch-manipulation whitespace-nowrap ${activeTab === 'tape' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>📏 테이프</button>
                </div>

                {/* Content Area */}
                <div className="p-3 max-h-[400px] overflow-y-auto">
                    {/* 이모지 스티커 */}
                    {activeTab === 'emoji' && (
                        <div className="grid grid-cols-4 gap-2">
                            {EMOJIS.map(emoji => (
                                <button 
                                    key={emoji} 
                                    onClick={() => {
                                        onSelect(ScrapType.STICKER, { title: 'Sticker', url: '', stickerConfig: { emoji } });
                                        setIsOpen(false);
                                    }}
                                    className="text-3xl hover:bg-slate-100 active:bg-slate-200 rounded p-2 transition-all hover:scale-125 active:scale-110 touch-manipulation min-h-[52px]"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 음식 스티커 */}
                    {activeTab === 'food' && (
                        <div className="grid grid-cols-4 gap-2">
                            {FOOD_STICKERS.map(sticker => (
                                <button 
                                    key={sticker.url} 
                                    onClick={() => {
                                        onSelect(ScrapType.STICKER, { 
                                            title: sticker.name, 
                                            url: '', 
                                            stickerConfig: { imageUrl: sticker.url } 
                                        });
                                        setIsOpen(false);
                                    }}
                                    className="hover:bg-slate-100 active:bg-slate-200 rounded p-2 transition-all hover:scale-110 active:scale-105 touch-manipulation"
                                    title={sticker.name}
                                >
                                    <img 
                                        src={sticker.url} 
                                        alt={sticker.name}
                                        className="w-full h-full object-contain"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 음료 스티커 */}
                    {activeTab === 'drink' && (
                        <div className="grid grid-cols-4 gap-2">
                            {DRINK_STICKERS.map(sticker => (
                                <button 
                                    key={sticker.url} 
                                    onClick={() => {
                                        onSelect(ScrapType.STICKER, { 
                                            title: sticker.name, 
                                            url: '', 
                                            stickerConfig: { imageUrl: sticker.url } 
                                        });
                                        setIsOpen(false);
                                    }}
                                    className="hover:bg-slate-100 active:bg-slate-200 rounded p-2 transition-all hover:scale-110 active:scale-105 touch-manipulation"
                                    title={sticker.name}
                                >
                                    <img 
                                        src={sticker.url} 
                                        alt={sticker.name}
                                        className="w-full h-full object-contain"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 과일 스티커 */}
                    {activeTab === 'fruit' && (
                        <div className="grid grid-cols-4 gap-2">
                            {FRUIT_STICKERS.map(sticker => (
                                <button 
                                    key={sticker.url} 
                                    onClick={() => {
                                        onSelect(ScrapType.STICKER, { 
                                            title: sticker.name, 
                                            url: '', 
                                            stickerConfig: { imageUrl: sticker.url } 
                                        });
                                        setIsOpen(false);
                                    }}
                                    className="hover:bg-slate-100 active:bg-slate-200 rounded p-2 transition-all hover:scale-110 active:scale-105 touch-manipulation"
                                    title={sticker.name}
                                >
                                    <img 
                                        src={sticker.url} 
                                        alt={sticker.name}
                                        className="w-full h-full object-contain"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 자연/꽃 스티커 */}
                    {activeTab === 'nature' && (
                        <div className="grid grid-cols-4 gap-2">
                            {NATURE_STICKERS.map(sticker => (
                                <button 
                                    key={sticker.url} 
                                    onClick={() => {
                                        onSelect(ScrapType.STICKER, { 
                                            title: sticker.name, 
                                            url: '', 
                                            stickerConfig: { imageUrl: sticker.url } 
                                        });
                                        setIsOpen(false);
                                    }}
                                    className="hover:bg-slate-100 active:bg-slate-200 rounded p-2 transition-all hover:scale-110 active:scale-105 touch-manipulation"
                                    title={sticker.name}
                                >
                                    <img 
                                        src={sticker.url} 
                                        alt={sticker.name}
                                        className="w-full h-full object-contain"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 테이프 */}
                    {activeTab === 'tape' && (
                        <div className="flex flex-col gap-3">
                            {TAPE_COLORS.map(color => (
                                <button
                                    key={color.name}
                                    onClick={() => {
                                        onSelect(ScrapType.TAPE, { title: 'Tape', url: '', tapeConfig: { color: color.val, pattern: 'solid' } });
                                        setIsOpen(false);
                                    }}
                                    className="w-full h-12 tape-edge shadow-sm hover:opacity-80 active:opacity-70 transition-opacity touch-manipulation"
                                    style={{ backgroundColor: color.val }}
                                >
                                </button>
                            ))}
                            <div className="text-[10px] text-center text-slate-400 mt-2">탭하여 와시 테이프 추가</div>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default DecorationSelector;