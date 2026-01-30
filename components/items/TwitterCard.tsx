import React, { useState } from 'react';
import { ScrapMetadata } from '../../types';
import { requestEmbedPreview } from '../../utils/embedPreview';
import { createLinkCardNavHandlers } from '../../utils/linkCardNav';

interface TwitterCardProps {
  data: ScrapMetadata;
}

const TwitterCard: React.FC<TwitterCardProps> = ({ data }) => {
  const [embedFailed, setEmbedFailed] = useState(false);
  const nav = createLinkCardNavHandlers(data.url, data.title || data.subtitle || 'Twitter Post');

  // 커스텀 카드 렌더링 (임베드 실패 시 또는 Vercel 환경에서 사용)
  const renderCustomCard = () => (
    <a 
      href={data.url} 
      className="block w-[380px] bg-white shadow-xl relative group transition-all hover:shadow-2xl hover:scale-[1.01] no-drag rounded-lg overflow-hidden"
      onClick={nav.onClick}
      onDoubleClick={nav.onDoubleClick}
    >
      {/* Texture Overlay */}
      <div className="texture-overlay"></div>

      {/* Decorative Tape */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-10 z-30 opacity-90 rotate-1">
        <div className="w-full h-full bg-blue-100/60 backdrop-blur-sm shadow-sm border-l border-r border-white/40" 
             style={{ clipPath: 'polygon(0% 10%, 5% 0%, 95% 0%, 100% 10%, 100% 90%, 95% 100%, 5% 100%, 0% 90%)' }}>
        </div>
      </div>

      {/* Twitter Card Content */}
      <div className="p-5 relative z-10">
        {/* Header with Profile Image or Twitter Icon */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          {data.twitterStats?.profileImage ? (
            <img 
              src={data.twitterStats.profileImage} 
              alt="Profile"
              className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
              onError={(e) => {
                // 프로필 이미지 로드 실패 시 Twitter 아이콘으로 대체
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const icon = document.createElement('div');
                  icon.className = 'w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0';
                  icon.innerHTML = '<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
                  parent.appendChild(icon);
                }
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-slate-900 truncate">
              {data.title || data.subtitle || 'Twitter Post'}
            </p>
            <p className="text-sm text-slate-500">
              {data.subtitle || 'Twitter (X)'}
            </p>
          </div>
        </div>

        {/* Tweet Content */}
        {data.description && (
          <div className="mb-4">
            <p className="font-handwriting text-slate-700 leading-relaxed text-base line-clamp-5">
              {data.description}
            </p>
          </div>
        )}

        {/* Tweet Image */}
        {data.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
            <img 
              src={data.imageUrl} 
              alt="Tweet" 
              className="w-full h-auto object-cover max-h-80"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Footer - Stats & Link */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4 text-slate-400 text-sm">
            {/* 댓글 수 */}
            {data.twitterStats && data.twitterStats.replies > 0 ? (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-xs">{data.twitterStats.replies}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            )}
            
            {/* 리트윗 수 */}
            {data.twitterStats && data.twitterStats.retweets > 0 ? (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs font-medium">{data.twitterStats.retweets}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            )}
            
            {/* 좋아요 수 */}
            {data.twitterStats && data.twitterStats.likes > 0 ? (
              <div className="flex items-center gap-1.5 text-pink-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-xs font-medium">{data.twitterStats.likes}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-blue-500 text-sm font-bold group-hover:text-blue-600 transition-colors">
            <span className="hidden sm:inline">트위터에서 보기</span>
            <span className="sm:hidden">보기</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 border-2 border-blue-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20"></div>
    </a>
  );

  // 항상 커스텀 카드 렌더링 (Vercel에서 안정적)
  return renderCustomCard();
};

export default TwitterCard;