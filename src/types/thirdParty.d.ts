// src/types/thirdParty.d.ts
// 3rd-party global typings (최소 선언)

export {};

declare global {
  interface Window {
    /**
     * Twitter widgets.js global
     * - react-twitter-embed가 window.twttr를 required로 선언하므로(optional 금지)
     * - 3rd-party 영역이므로 any 허용
     */
    twttr: any;
  }
}


