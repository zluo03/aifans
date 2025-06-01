import React from 'react';
import Link from 'next/link';

interface CreatorCardProps {
  creator: {
    id: number;
    userId: number;
    avatarUrl: string | null;
    nickname: string;
    bio: string | null;
    expertise: string | null;
    score?: number;
    images: any[];
    videos: any[];
    audios: any[];
    createdAt: string;
    updatedAt: string;
  };
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Link href={`/creators/${creator.userId}`} className="group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 p-6 h-full flex flex-col group-hover:-translate-y-2 group-hover:scale-[1.02]">
        {/* 头像和基本信息 */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-gradient flex items-center justify-center ring-2 ring-gray-100 group-hover:ring-2 group-hover:ring-[var(--custom-primary)] transition-all duration-200 p-0.5">
              <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                {creator.avatarUrl ? (
                  <img 
                    src={creator.avatarUrl} 
                    className="w-full h-full object-cover" 
                    alt={creator.nickname} 
                  />
                ) : (
                  <span className="text-xl font-bold text-primary-gradient">
                    {creator.nickname.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            {/* 在线状态指示器 */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-[var(--custom-primary)] transition-colors duration-200">
              {creator.nickname}
            </h3>
            {creator.expertise && (
              <p className="text-sm text-gray-500 truncate mt-1">
                {creator.expertise}
              </p>
            )}

          </div>
        </div>

        {/* 个人简介 */}
        {creator.bio && (
          <div className="flex-1">
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {creator.bio}
            </p>
          </div>
        )}

        {/* 底部装饰 */}
        <div className="mt-4 pt-4 border-t border-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-[var(--custom-primary)] rounded-full"></div>
              <div className="w-2 h-2 bg-[var(--custom-accent)] rounded-full"></div>
              <div className="w-2 h-2 bg-[var(--custom-secondary)] rounded-full"></div>
            </div>
            {/* 作品数量统计 */}
            <div className="text-gray-500">
              {(creator.images?.length || 0) + (creator.videos?.length || 0) + (creator.audios?.length || 0)} 作品
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
} 