
export enum ScrapType {
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  PINTEREST = 'pinterest',
  BOOK = 'book',
  YOUTUBE = 'youtube',
  SPOTIFY = 'spotify',
  SOUNDCLOUD = 'soundcloud',
  TIKTOK = 'tiktok',
  VIMEO = 'vimeo',
  FASHION = 'fashion',
  CHAT = 'chat',
  TICKET = 'ticket',
  BOARDING = 'boarding',
  RECEIPT = 'receipt',
  TOPLOADER = 'toploader',
  CUPSLEEVE = 'cupsleeve',
  NOTE = 'note',
  GENERAL = 'general',
  STICKER = 'sticker',
  TAPE = 'tape',
  MOVING_PHOTO = 'moving_photo',
  PROFILE = 'profile',
  TODO = 'todo',
  OHAASA = 'ohaasa'
}

// =========================================================
// Font IDs (single source)
// - 실제 CSS 폰트 적용은 index.html의 [data-font="..."]에 정의됨.
// =========================================================
import type { FontId } from './constants/fonts';
export type { FontId };

// 🛡️ V2: 저장 모드 (정책 준수)
export type StoreMode = 'safe' | 'preview' | 'snapshot';

// 🛡️ V2: 플랫폼 식별 (1차 릴리즈: 6개만)
export type Platform = 
  // 🟢 1차 지원
  | 'twitter'      // X (트위터)
  | 'youtube'      // YouTube
  | 'instagram'    // Instagram
  | 'pinterest'    // Pinterest
  | 'aladin'       // 알라딘
  | 'googlemap'    // Google Maps
  // ⚪ 일반 링크
  | 'link';

// 🛡️ V2: Embed 정보 (공식 위젯용)
export interface EmbedInfo {
  kind: 'twitter' | 'instagram' | 'youtube' | 'spotify' | 'pinterest' | 'tiktok' | 'vimeo' | 'twitch';
  id?: string;           // Twitter: tweetId, YouTube: videoId, Spotify: trackId, TikTok: videoId
  permalink?: string;    // Instagram: 전체 URL, TikTok: 전체 URL
  username?: string;     // TikTok, Twitch: 사용자명
}

// 🛡️ V2: 소스 정보
export interface SourceInfo {
  url: string;           // 원본 URL
  canonicalUrl?: string; // 정규화된 URL
  externalId?: string;   // Twitter: tweetId, Instagram: shortcode
}

// 🛡️ V2: 프리뷰 정보 (TTL 있음)
export interface PreviewInfo {
  title: string;
  subtitle?: string;
  textSnippet?: string;  // 최대 100자
  thumbnailUrl?: string;
  themeColor?: string;
  fetchedAt: number;     // timestamp
  expiresAt: number;     // timestamp (fetchedAt + TTL)
}

// 🛡️ V2: 스냅샷 정보 (유저 업로드)
export interface SnapshotInfo {
  coverAssetId: string;  // 유저가 업로드한 이미지 ID
  coverText?: string;    // 유저가 작성한 텍스트
  createdAt: number;     // timestamp
}

// 🎀 Link/Embed Decoration (링크 카드/임베드 전용)
// - 기존 preset(테이프/폴라로이드 등) + MVP 프레임 계열(pearls/ribbon/customImage)까지 확장
export type DecorationPresetId =
  | 'none'
  // =========================
  // ✅ NEW: SVG Frame/Device Preset IDs (요청 스키마)
  // - 기존 ID(lace/pearls 등)는 이후 단계에서 아래 ID로 매핑/마이그레이션 처리 예정
  // =========================
  // Frame Series
  | 'frame_simple_round'
  | 'frame_scallop_lace'
  | 'frame_pearl_border'
  | 'frame_bow_top'
  | 'frame_bow_corners'
  // Device Series
  | 'device_ds'
  | 'device_gameboy'
  | 'device_camera'
  | 'device_tamagotchi'
  | 'device_tv'
  | 'tape'
  | 'polaroid'
  | 'lace'
  | 'stickerCorners'
  | 'pearls'
  | 'ribbon'
  | 'customImage'
  // ✅ 새로운 “얇은 선 + 단색” 프레임 프리셋들
  // (구버전 id는 로드 시 clean/thin으로 매핑됨)
  | 'scallop_lace_clean'
  | 'pearl_thin'
  | 'ribbon_top_thin'
  | 'ribbon_corners_thin'
  | 'sticker_corners_thin'
  | 'polaroid_thin'
  // legacy overlay ids (deprecated; kept for backward compatibility)
  | 'scallop_lace'
  | 'pearl'
  | 'ribbon_top'
  | 'ribbon_corners'
  | 'sticker_corners'
  | 'wavy_frame'
  | 'heart_lace';
export type DecorationOutlineStyle = 'solid' | 'dashed' | 'dotted';
export type DecorationShadow = 'none' | 'soft' | 'hard';

export interface Decoration {
  presetId: DecorationPresetId;

  // ===== MVP (링크 카드 “프레임/꾸미기”용 확장 필드) =====
  // 주의: 내부 embed DOM은 건드리지 않고, 카드 “외곽 컨테이너”에서만 사용한다.
  fillColor?: string; // 단색 배경(기본: var(--note-paper-background) 같은 CSS var 가능)
  strokeColor?: string; // 기본: var(--ui-stroke-color)
  strokeWidth?: number; // 기본: 1
  radius?: number; // 기본: 12
  padding?: number; // 프레임 두께 느낌(기본: 12~18 권장)
  customImageDataUrl?: string; // presetId=customImage에서 사용(선택)

  // ===== 기존 필드(하위 호환/기존 UI 유지) =====
  borderColor?: string;
  borderWidth?: number;      // 1~8
  borderRadius?: number;     // 0~24
  outlineStyle?: DecorationOutlineStyle;
  shadow?: DecorationShadow;
  tapeColor?: string;
  stickerSetId?: string;
}

// 🖼️ Link/Embed Frame Decoration (카드 바깥 프레임/오버레이 전용)
export type FrameDecorationPresetId = 'none' | 'pearl' | 'lace' | 'ribbon';

export interface FrameDecoration {
  presetId: FrameDecorationPresetId;
  padding?: number; // overlay가 카드 밖으로 나가는 여백(px), 기본 10
  opacity?: number; // 0~1, 기본 1
  color?: string; // 기본 var(--ui-stroke-color) 등 CSS var 허용
  customFrameUrl?: string; // (MVP) 사용자 URL 프레임 (png/svg)
}

// 🛡️ V2: 내보내기 정책
export interface ExportPolicy {
  excludeEmbeds: boolean;           // SNS embed 제외 여부
  embedFallback: 'link_card' | 'hidden'; // 제외 시 대체 방법
}

export type LayoutType = 'free' | 'monthly' | 'weekly' | 'scrap_page';
export type BorderStyle = 'none' | 'stitch' | 'marker' | 'tape' | 'shadow';

// ===== UI 색상 팔레트 시스템 (1:1 정확 매핑) =====
export type UIColorHex = string; // "#RRGGBB" or "#RRGGBBAA"

// ===== UI 액션 토큰 (테마 팔레트와 1:1) =====
export type UITokenKey =
  | '--ui-primary-bg'
  | '--ui-primary-text'
  | '--ui-primary-hover'
  | '--ui-danger-bg'
  | '--ui-danger-text'
  | '--ui-danger-hover'
  | '--ui-success-bg'
  | '--ui-success-text'
  | '--ui-success-hover'
  | '--ui-sunday-text';

export type UITokens = Record<UITokenKey, UIColorHex>;

export interface UIPalette {
  // ===== 전역 선(Stroke) =====
  strokeColor: UIColorHex;                       // 모든 선(테두리) 통일용 기본 색 (--ui-stroke-color)

  // ===== 앱 / 노트 구조 =====
  appBackground: UIColorHex;                    // 노트 바깥 배경 (독립)
  notePaperBackground: UIColorHex;              // 좌/우 페이지 종이 바탕 (독립)
  noteOuterBorderColor: UIColorHex;             // 노트 전체 외곽선
  noteCenterFoldLineColor: UIColorHex;          // 가운데 접힘선

  // ===== 위젯 공통 =====
  widgetBorderColor: UIColorHex;                // 위젯 박스 테두리 (공통)
  widgetSurfaceBackground: UIColorHex;          // 위젯 내부 기본 배경 (공통)
  widgetInputBackground: UIColorHex;            // input 배경 (공통)

  // ===== 위젯 상단 바 (각각 분리) =====
  profileHeaderBarBg: UIColorHex;               // 프로필 위젯 상단 바
  goalsHeaderBarBg: UIColorHex;                 // Monthly Goals 상단 바
  ddayHeaderBarBg: UIColorHex;                  // D-day 위젯 상단 바
  ohaasaHeaderBarBg: UIColorHex;                // 오하아사 위젯 상단 바
  bucketHeaderBarBg: UIColorHex;                // Bucket List 상단 바

  // ===== 달력 =====
  calendarDateHeaderBg: UIColorHex;             // 월/년도 네비 헤더 배경 (fallback: calendarWeekdayHeaderBg)
  calendarWeekdayHeaderBg: UIColorHex;          // SUN~SAT 줄 배경
  calendarGridLineColor: UIColorHex;            // 달력 선 색
  calendarCellBackground: UIColorHex;           // 칸 내부 배경
  calendarTodayHighlightBg: UIColorHex;         // 오늘 칸 배경

  // ===== 월 탭 (RGBA/alpha 지원) =====
  monthTabBg: UIColorHex;                       // 기본 탭 배경 (RGBA 지원)
  monthTabBgActive: UIColorHex;                 // 활성 탭 배경
  monthTabBorderColor: UIColorHex;              // 탭 테두리
  monthTabTextColor: UIColorHex;                // 탭 텍스트 색

  // ===== 키링 =====
  keyringMetalColor: UIColorHex;                // 키링 금속/체인 색
  keyringFrameBorderColor: UIColorHex;          // 사진 프레임 테두리

  // ===== CD 플레이어 =====
  cdWidgetBackground: UIColorHex;               // CD 위젯 배경
  
  // ===== 센터 그림자 =====
  centerShadowColor?: UIColorHex;               // 다이어리 중앙 그림자 색상
  cdDiscColor: UIColorHex;                      // 디스크 색
  cdScreenBg: UIColorHex;                       // 스크린 배경
  cdButtonBg: UIColorHex;                       // 버튼 배경
  cdDotColor: UIColorHex;                       // 하단 점 색

  // ===== 글로벌 텍스트 =====
  textColorPrimary: UIColorHex;                 // 기본 글씨색 (전체 텍스트 통일)
}

// 📱 모바일 1페이지 모드: 좌/우 페이지 구분
export type PageSide = 'left' | 'right';

export interface ScrapMetadata {
  // ===== V1 Legacy 필드 (하위 호환) =====
  title: string;
  subtitle?: string; // Author, artist, or price
  description?: string; // ⚠️ SNS는 저장 금지 (일반 URL만)
  imageUrl?: string; // ⚠️ SNS는 저장 금지 (일반 URL만)
  videoUrl?: string; // Added for MP4 loops
  url: string;
  themeColor?: string;
  isEditable?: boolean; // Level 4: Fallback UI support
  sourceId?: string; // 원본 아이템 ID 추적용 (스크랩 페이지에서 사용)
  embedHtml?: string; // ⚠️ Deprecated - embed 사용
  soundcloudEmbedUrl?: string; // SoundCloud oEmbed에서 추출한 iframe URL

  // ===== V2 정책 준수 필드 =====
  platform?: Platform;           // 플랫폼 식별
  storeMode?: StoreMode;         // 저장 모드 (기본: safe)
  source?: SourceInfo;           // 소스 정보
  embed?: EmbedInfo;             // Embed 정보
  preview?: PreviewInfo;         // 프리뷰 (TTL)
  snapshot?: SnapshotInfo;       // 스냅샷 (유저 업로드)
  exportPolicy?: ExportPolicy;   // 내보내기 정책
  decoration?: Decoration;       // ✅ 링크/임베드 꾸미기(테두리/테이프/폴라로이드 등)
  frameDecoration?: FrameDecoration; // ✅ 링크/임베드 프레임(오버레이) 꾸미기
  
  // Advanced YouTube Config
  youtubeConfig?: {
    mode: 'cd' | 'player';
    startTime?: number; // seconds
  };

  // Ticket Config
  ticketConfig?: {
    date: string;
    time: string;
    seat: string;
    cinema: string;
  };

  // Boarding Pass Config
  boardingConfig?: {
    from: string;
    to: string;
    flight: string;
    seat: string;
    date: string;
    gate: string;
    color: string;
  };

  // Receipt Config
  receiptConfig?: {
    items: { name: string; price: string }[];
    total: string;
    date: string;
  };

  // Toploader Config
  toploaderConfig?: {
    stickers: { id: string; x: number; y: number; emoji: string; rotation: number }[];
  };

  // Cup Sleeve Config
  cupSleeveConfig?: {
    cafeName: string;
    eventDate: string;
  };

  // Fashion Tag Config
  fashionConfig?: {
    brand: string;
    price: string;
    size?: string;
  };

  // Handwritten Note Config
  noteConfig?: {
    text: string;
    color?: string; // ink color
    fontSize?: string;
    isEditing?: boolean; // 초기 편집 모드
  };

  /**
   * Legacy alias: 일부 저장 데이터/서비스에서 textNoteConfig를 사용했던 흔적이 있어
   * 하위호환을 위해 optional로 유지한다.
   * - 런타임 동작 변경 없이 타입만 정합성 맞춤
   */
  textNoteConfig?: {
    text: string;
    color?: string;
    fontSize?: string;
  };

  // Sticker Config
  stickerConfig?: {
    emoji?: string;
    imageUrl?: string; // 이미지 스티커 지원
  };

  // Tape Config
  tapeConfig?: {
    color: string;
    pattern?: 'solid' | 'stripe' | 'grid';
  };

  // Twitter Stats (⚠️ V2 Safe 모드에서는 저장 안 함)
  twitterStats?: {
    likes: number;
    retweets: number;
    replies: number;
    profileImage?: string;
  };

  // 🛡️ Legacy 호환 필드 (V1)
  embedType?: string;       // embed 렌더링 타입 (twitter_widget 등)
  fetchedAt?: number;       // 수집 시점 (timestamp)
  ttl?: number;             // Time To Live (밀리초)
  
  // 🛡️ SNS ID (원문 대신 ID만 저장)
  tweetId?: string;         // Twitter 트윗 ID
  igPermalink?: string;     // Instagram 포스트 URL
  videoId?: string;         // YouTube 동영상 ID

  // Profile Config
  profileConfig?: {
    name: string;
    status: string;
    tags: string[];
  };

  // Todo Config
  todoConfig?: {
    items: { id: string; text: string; completed: boolean }[];
  };
}

export interface ScrapPosition {
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale?: number;
}

export interface ScrapItem {
  id: string;
  type: ScrapType;
  metadata: ScrapMetadata;
  position: ScrapPosition;
  createdAt: number;
  diaryDate: string; // Format: YYYY-MM-DD for daily, YYYY-MM for monthly left page
  borderStyle?: BorderStyle;
  isMainItem?: boolean; // Represents the cover image for this day in Monthly view
  pageSide?: PageSide; // 📱 좌/우 페이지 구분 (기본값: 'left')
}

// ✅ Link Dock (월간 달력 하단 링크 도크)
export type LinkDockItem = {
  id: string;
  url: string;
  assignedDate?: string; // YYYY-MM-DD
  createdAt: number;
  insertedItemId?: string; // 생성된 ScrapItem.id
};

// Persistable Text Data for Layouts
export interface LayoutTextData {
  [key: string]: { 
     goals?: string;
     important?: string;
     memo?: string;
     coverImage?: string; // Used for weekly cover

     // Monthly Dashboard Fields
     profileName?: string;
     profileStatus?: string;
     profileImage?: string;
     profileText?: string; // 프로필 위젯 하단 텍스트 (새로 추가)
     dDayTitle?: string;
     dDayDate?: string;
     photoUrl?: string; // Used for CD Cover or Photo Add
     musicTitle?: string;
     musicUrl?: string; // Added for YouTube Link
     bucketList?: string;
     monthHeaderBg?: string; // 월간 화면 오른쪽 페이지 커버 이미지
     dDayBgImage?: string; // D-Day 위젯 배경 (기존 필드 추가)
     cdBodyBgImage?: string; // CD 플레이어 배경 (기존 필드 추가)
     bucketBgImage?: string; // Bucket List 배경 (기존 필드 추가)
     dowSunBg?: string; // 요일 헤더 배경 (일요일 ~ 토요일)
     dowMonBg?: string;
     dowTueBg?: string;
     dowWedBg?: string;
     dowThuBg?: string;
     dowFriBg?: string;
     dowSatBg?: string;
  }
}

// Sticker data structure
export interface Sticker {
  id: string;
  name: string;
  filePath: string;  // 로컬 파일 경로
  thumbnail?: string; // data URL
  createdAt: number;
}

// Keyring Frame Types
export type KeyringFrameType = 'rounded-square' | 'heart' | 'circle';

// Global Style Preferences
export interface DiaryStyle {
  coverColor: string;
  coverPattern: 'quilt' | 'leather' | 'denim' | 'fur';
  keyring: string; // emoji char or image URL
  keyringFrame?: KeyringFrameType; // 키링 참 테두리 모양 (기본값: 'rounded-square')
  keyringImage?: string; // 키링 참 안에 넣을 이미지 (DataURL)
  backgroundImage?: string; // Custom Desk Image
  fontId?: FontId; // 폰트 ID (기본값: 'noto')
  uiPalette?: UIPalette; // 사용자 정의 UI 색상 팔레트
  uiTokens?: UITokens; // 사용자 정의 UI 액션 토큰(Primary/Danger/Success/Sunday)
  stickers?: Sticker[]; // 사용자 업로드 스티커 목록
  notePaperBackgroundImage?: string; // ✅ 노트 종이 바탕 이미지(DataURL)
  notePaperBackgroundFit?: 'contain' | 'cover' | 'zoom'; // ✅ 배경 이미지 맞춤 방식 (기본 contain)
  notePaperBackgroundZoom?: number; // ✅ zoom 모드일 때 확대/축소(%) (50~200, 기본 100)
  centerFoldShadowEnabled?: boolean; // ✅ 가운데 접힘(센터 폴드) 그림자 ON/OFF (기본 true)

  // ✅ 스프레드 중앙 그림자(센터 섀도우) 커스터마이즈
  centerShadowEnabled?: boolean; // default true
  centerShadowColor?: string; // hex (e.g. #5D4037)
  centerShadowOpacity?: number; // 0~1 (default 0.14)
  centerShadowWidth?: number; // px (default 44)

  // ✅ 대시보드(월간: 위젯+달력) 전용 노트 종이 배경 오버라이드
  // - CSS 변수 스코프(대시보드 래퍼)에서만 --note-paper-background를 덮는다.
  // - 다른 화면(weekly/free/scrap_page)은 전역 uiPalette.notePaperBackground를 그대로 사용.
  dashboardUseNotePaperOverride?: boolean; // 기본 false
  dashboardNotePaperBackground?: string; // hex/rgba 모두 허용
  
  // ✅ 다이어리 크기 모드
  compactMode?: boolean; // true = 900px (컴팩트), false/undefined = 1100px (편안함)
}
