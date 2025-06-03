"use client";

import React, { useEffect, useState } from 'react';
import { CreatorBanner } from '../components/creator-banner';
import { CreatorWorksTabs } from '../components/creator-works-tabs';
import { CreatorMessageDialog } from '../components/creator-message-dialog';
import { useAuthStore } from '@/lib/store/auth-store';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { parseCreatorData } from '@/lib/utils/json-parser';
import { AuthWrapper } from '@/components/auth-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

interface Creator {
  id: number;
  userId: number;
  avatarUrl: string | null;
  nickname: string;
  bio: string | null;
  expertise: string | null;
  backgroundUrl?: string | null;
  score?: number; // 添加积分字段
  images: any[];
  videos: any[];
  audios: any[];
  stats?: {
    totalWorks: number;
    totalLikes: number;
    totalFavorites: number;
  };
}

// 创作者详情加载状态
function CreatorDetailSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-168px)] max-h-[calc(100vh-168px)] overflow-hidden">
      <div className="flex-1 overflow-y-auto content-scrollbar">
        <div className="w-full">
          {/* 背景横幅 */}
          <div className="relative">
            <Skeleton className="w-full h-64" />
            <div className="absolute -bottom-16 left-10 z-10">
              <Skeleton className="w-32 h-32 rounded-full" />
            </div>
          </div>
          
          {/* 个人信息 */}
          <div className="mt-20 px-10">
            <Skeleton className="h-8 w-48 mb-3" />
            <Skeleton className="h-5 w-64 mb-6" />
            
            {/* 作品区域 */}
            <div className="mt-6">
              <Skeleton className="h-10 w-full mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 创作者详情内容组件
function CreatorDetailContent() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  // 禁用右键菜单
  useEffect(() => {
    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    document.addEventListener('contextmenu', disableContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
    };
  }, []);

  const fetchCreator = async () => {
    if (!userId) {
      toast.error('创作者ID无效');
      router.push('/creators');
      return;
    }

    try {
      // 通过userId获取创作者信息
      const response = await fetch(`/api/creators/user/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // 检查data是否是错误对象
        if (data && data.error) {
          toast.error(data.error || '获取创作者信息失败');
          router.push('/creators');
          return;
        }
        
        if (data) {
          const parsedCreator = parseCreatorData(data);
          setCreator(parsedCreator);
        } else {
          toast.error('创作者不存在');
          router.push('/creators');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: '创作者不存在' }));
        toast.error(errorData.error || '创作者不存在');
        router.push('/creators');
      }
    } catch (error) {
      console.error('获取创作者数据失败:', error);
      toast.error('获取创作者信息失败');
      router.push('/creators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCreator();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-168px)]">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!creator) {
    return null;
  }

  // 只有高级/永久会员和管理员可以发送私信
  const canMessage = user && (user.role === 'PREMIUM' || user.role === 'LIFETIME' || user.role === 'ADMIN');
  
  // 是否是自己的主页
  const isSelf = creator && user && user.id === creator.userId;

  return (
    <div className="flex flex-col h-[calc(100vh-168px)] max-h-[calc(100vh-168px)] overflow-hidden">
      <div className="flex-1 overflow-y-auto content-scrollbar">
        <div className="w-full">
          <CreatorBanner 
            creator={creator} 
            onBackgroundUpdate={async (backgroundUrl) => {
              // 重新获取最新数据
              await fetchCreator();
            }}
          />
          
          <CreatorWorksTabs creator={creator} />
          
          {/* 私信按钮：不是自己且有权限 */}
          {!isSelf && canMessage && (
            <CreatorMessageDialog creatorId={creator.userId.toString()} creatorName={creator.nickname} />
          )}
        </div>
      </div>
    </div>
  );
}

// 创作者详情页面组件
export default function CreatorDetailPage() {
  return (
    <AuthWrapper
      showToast={false}
      loadingFallback={<CreatorDetailSkeleton />}
    >
      <CreatorDetailContent />
    </AuthWrapper>
  );
} 