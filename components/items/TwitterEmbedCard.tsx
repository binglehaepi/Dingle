import React, { useEffect, useRef, useState } from 'react';
import { ScrapMetadata } from '../../types';
import LinkCardFallback from './LinkCardFallback';
import { requestEmbedPreview } from '../../utils/embedPreview';
import { createLinkCardNavHandlers } from '../../utils/linkCardNav';

interface TwitterEmbedCardProps {
  data: ScrapMetadata;
}

// Twitter 위젯 스크립트 로드 (전역에서 1번만)
let widgetScriptLoaded = false;
let widgetScriptLoading = false;
const widgetLoadCallbacks: (() => void)[] = [];

function loadTwitterWidgetScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 로드됨
    if (widgetScriptLoaded && window.twttr) {
      resolve();
      return;
    }

    // 로딩 중
    if (widgetScriptLoading) {
      widgetLoadCallbacks.push(resolve);
      return;
    }

    widgetScriptLoading = true;

    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';

    script.onload = () => {
      widgetScriptLoaded = true;
      widgetScriptLoading = false;
      resolve();
      
      // 대기 중인 콜백 실행
      widgetLoadCallbacks.forEach(cb => cb());
      widgetLoadCallbacks.length = 0;
    };

    script.onerror = () => {
      widgetScriptLoading = false;
      reject(new Error('Failed to load Twitter widget script'));
    };

    document.body.appendChild(script);
  });
}

// 트윗 ID 추출
function extractTweetId(url: string): string | null {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

const TwitterEmbedCard: React.FC<TwitterEmbedCardProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const DBG = !!import.meta.env.DEV && (typeof window !== 'undefined') && ((window as any).__DSD_DEBUG_DRAG ?? true);
  // decoration은 ItemRenderer의 “카드 외곽 컨테이너”에서만 적용한다(내부 embed DOM/renderer 무변경).
  const nav = createLinkCardNavHandlers(data?.url, data?.title || data?.subtitle || 'Twitter');
  
  // 🛡️ 방어: data가 없을 때 처리
  if (!data) {
    return <LinkCardFallback data={{
      title: "데이터 없음",
      subtitle: "트위터 카드",
      url: '',
      platform: 'twitter' as any,
      themeColor: '#1DA1F2'
    }} />;
  }
  
  // 🛡️ 정책 준수: tweetId 우선 사용 (metadata에서)
  const tweetId = data.tweetId || extractTweetId(data.url || '');

  useEffect(() => {
    if (!DBG) return;
    const dragActive = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
    console.debug('[twitterEmbed] MOUNT', { tweetId, url: data?.url, dragActive });
    return () => {
      const dragActive2 = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
      console.debug('[twitterEmbed] UNMOUNT', { tweetId, url: data?.url, dragActive: dragActive2 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!tweetId || embedFailed) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const embedTweet = async () => {
      try {
        if (DBG) {
          const dragActive = typeof window !== 'undefined' ? !!(window as any).__DSD_DRAG_ACTIVE : false;
          console.debug('[twitterEmbed] effect RUN', { tweetId, embedFailed, dragActive });
        }
        // 위젯 스크립트 로드
        await loadTwitterWidgetScript();

        if (!mounted || !containerRef.current) return;

        // 기존 내용 제거
        containerRef.current.innerHTML = '';

        // 트윗 임베드
        const result = await window.twttr.widgets.createTweet(
          tweetId,
          containerRef.current,
          {
            dnt: true, // Do Not Track
            conversation: 'none', // 대화 숨기기
            cards: 'visible', // 카드 표시
            align: 'center',
            theme: 'light',
            width: 380,
          }
        );

        if (!result && mounted) {
          console.warn('⚠️ Twitter 위젯 로드 실패, 커스텀 카드로 전환');
          setEmbedFailed(true);
        }

        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Twitter 임베드 실패:', error);
        if (mounted) {
          setEmbedFailed(true);
          setIsLoading(false);
        }
      }
    };

    embedTweet();

    return () => {
      mounted = false;
    };
  }, [tweetId, embedFailed]);

  // Fallback: 공식 위젯 실패 시 안전한 링크 카드
  if (embedFailed || !tweetId) {
    return <LinkCardFallback data={data} />;
  }

  return (
    <div className="relative" data-sns-embed="twitter">
      {/* 로딩 중 */}
      {isLoading && (
        <div className="w-[380px] h-[200px] bg-white rounded-lg shadow-xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500">트윗 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 트위터 공식 위젯 컨테이너 - no-drag로 표시하여 DraggableItem이 드래그 시작하지 않도록 */}
      <div 
        ref={containerRef}
        className="twitter-embed-container no-drag sns-embed-content"
        data-sns-type="twitter"
        style={{ 
          minHeight: isLoading ? 0 : 200,
          pointerEvents: 'none' // 드래그 가능하게 하기 위해 비활성화
        }}
      />

      {/* 통계 정보 오버레이 (서버에서 받은 데이터) */}
      {data.twitterStats && !isLoading && (
        <div className="mt-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-slate-600">
              {/* 댓글 */}
              {data.twitterStats.replies > 0 && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="font-medium">{data.twitterStats.replies.toLocaleString()}</span>
                </div>
              )}
              
              {/* 리트윗 */}
              {data.twitterStats.retweets > 0 && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="font-medium">{data.twitterStats.retweets.toLocaleString()}</span>
                </div>
              )}
              
              {/* 좋아요 */}
              {data.twitterStats.likes > 0 && (
                <div className="flex items-center gap-1.5 text-pink-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-medium">{data.twitterStats.likes.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            <a 
              href={data.url}
              className="text-blue-500 hover:text-blue-600 font-medium text-xs no-drag"
              style={{ pointerEvents: 'auto' }}
              onClick={nav.onClick}
              onDoubleClick={nav.onDoubleClick}
            >
              원본 보기 →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwitterEmbedCard;

