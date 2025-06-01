import React, { useState } from 'react';
import { BackgroundUploadDialog } from './background-upload-dialog';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface CreatorBannerProps {
  creator: {
    avatarUrl: string | null;
    nickname: string;
    bio: string | null;
    expertise: string | null;
    backgroundUrl?: string | null;
    userId?: number;
    score?: number; // 添加积分字段
    images?: any[];
    videos?: any[];
    audios?: any[];
    stats?: {
      totalWorks: number;
      totalLikes: number;
      totalFavorites: number;
    };
  };
  onBackgroundUpdate?: (backgroundUrl: string) => void;
}

export function CreatorBanner({ creator, onBackgroundUpdate }: CreatorBannerProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [showBackgroundUpload, setShowBackgroundUpload] = useState(false);
  
  // 是否是自己的主页
  const isSelf = creator && user && user.id === creator.userId;

  return (
    <div className="relative w-full border-b border-gray-100 overflow-hidden">
      {/* 背景图片或默认背景 */}
      {creator.backgroundUrl ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${creator.backgroundUrl})` }}
        >
          <div className="absolute inset-0 bg-black/20" />
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--custom-primary)]/5 via-[var(--custom-accent)]/5 to-[var(--custom-secondary)]/5" />
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-20 h-20 bg-[var(--custom-primary)]/20 rounded-full blur-xl"></div>
            <div className="absolute top-20 right-20 w-32 h-32 bg-[var(--custom-accent)]/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 left-1/3 w-24 h-24 bg-[var(--custom-secondary)]/20 rounded-full blur-xl"></div>
          </div>
        </>
      )}

      {/* 编辑和背景按钮 */}
      {isSelf && (
        <div className="absolute top-4 right-4 z-10 flex gap-3">
          <Button
            onClick={() => router.push('/creators/edit')}
            className="bg-primary-gradient text-white border-0 px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            编辑主页
          </Button>
          <button
            onClick={() => setShowBackgroundUpload(true)}
            className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            更换背景
          </button>
        </div>
      )}
      
      <div className="relative max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* 头像 */}
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-primary-gradient p-1 shadow-2xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-white">
                {creator.avatarUrl ? (
                  <img 
                    src={creator.avatarUrl} 
                    alt={creator.nickname} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-gradient flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {creator.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 认证徽章 */}
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary-gradient rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* 在线状态 */}
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-white shadow-sm"></div>
          </div>



          {/* 信息 */}
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-4">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {creator.nickname}
              </h1>
            </div>
            
            {creator.expertise && (
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
                {creator.expertise.split(/[,，]/).map((skill, index) => (
                  <span 
                    key={index} 
                    className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            )}
            
            {creator.bio && (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                <p className="text-gray-700 leading-relaxed max-w-3xl">
                  {creator.bio}
                </p>
              </div>
            )}
            
            {/* 统计信息 */}
            <div className="flex items-center justify-center lg:justify-start gap-8 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {creator.stats?.totalWorks || (creator.images?.length || 0) + (creator.videos?.length || 0) + (creator.audios?.length || 0)}
                </div>
                <div className="text-sm text-gray-500">作品数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{creator.stats?.totalLikes || 0}</div>
                <div className="text-sm text-gray-500">获赞数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{creator.stats?.totalFavorites || 0}</div>
                <div className="text-sm text-gray-500">收藏数</div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 背景上传对话框 */}
      <BackgroundUploadDialog
        open={showBackgroundUpload}
        onOpenChange={setShowBackgroundUpload}
        onSuccess={(backgroundUrl) => {
          if (onBackgroundUpdate) {
            onBackgroundUpdate(backgroundUrl);
          }
        }}
      />
    </div>
  );
} 