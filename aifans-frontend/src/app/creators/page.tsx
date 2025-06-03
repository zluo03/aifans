"use client";

import React, { useEffect, useState } from 'react';
import { CreatorCard } from './components/creator-card';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, User, Lock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Link from 'next/link';
import { AuthWrapper } from '@/components/auth-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

// 游客访问限制组件
function GuestAccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
      <div className="text-center max-w-md">
        <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">需要登录才能访问</h1>
        <p className="text-gray-600 mb-6">
          创作者页面需要登录后才能浏览。请先登录或注册账号。
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/login">登录</Link>
          </Button>
          <Button asChild>
            <Link href="/register">注册</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// 创作者卡片加载状态
function CreatorCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-12 w-full mb-4" />
      <div className="mt-4 pt-4 border-t border-gray-50">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

// 创作者列表加载状态
function CreatorsLoadingSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden">
      <div className="flex-1 overflow-y-auto content-scrollbar">
        <div className="w-full px-4 py-6">
          <div className="max-w-7xl mx-auto">
            {/* 页面头部 */}
            <div className="mb-8">
              <div className="flex items-center justify-between gap-6 mb-6">
                <div className="flex-shrink-0">
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex-1 max-w-4xl">
                  <Skeleton className="h-10 w-full mx-auto" />
                </div>
                <div className="flex-shrink-0">
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
            
            {/* 创作者列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <CreatorCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 创作者内容组件
function CreatorsContent() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [allCreators, setAllCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasOwnProfile, setHasOwnProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 获取创作者列表
    const fetchCreators = async () => {
      try {
        const response = await fetch('/api/creators');
        if (response.ok) {
          const data = await response.json();
          setAllCreators(data);
          setCreators(data);
        } else {
          toast.error('获取创作者列表失败');
        }
      } catch (error) {
        console.error('Failed to fetch creators:', error);
        toast.error('获取创作者列表失败');
      } finally {
        setLoading(false);
      }
    };
    
    // 检查当前用户是否已有个人主页
    const checkOwnProfile = async () => {
      if (user && (user.role === 'PREMIUM' || user.role === 'LIFETIME' || user.role === 'ADMIN')) {
        try {
          const response = await fetch(`/api/creators/user/${user.id}`);
          const text = await response.text();
          
          if (!text || text === 'null') {
            setHasOwnProfile(false);
            return;
          }

          try {
            const data = JSON.parse(text);
            setHasOwnProfile(!!data);
          } catch (e) {
            console.error('Failed to parse creator profile:', e);
            setHasOwnProfile(false);
          }
        } catch (error) {
          console.error('Failed to check own profile:', error);
          setHasOwnProfile(false);
        }
      }
    };
    
    fetchCreators();
    checkOwnProfile();
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setCreators(allCreators);
    } else {
      const filtered = allCreators.filter(creator => 
        creator.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (creator.bio && creator.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (creator.expertise && creator.expertise.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setCreators(filtered);
    }
  }, [searchQuery, allCreators]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 搜索逻辑已在useEffect中处理
  };

  const canCreateProfile = user && (user.role === 'PREMIUM' || user.role === 'LIFETIME' || user.role === 'ADMIN');

  return (
    <div className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden">
      <div className="flex-1 overflow-y-auto content-scrollbar">
        <div className="w-full px-4 py-6">
          <div className="max-w-7xl mx-auto">
            {/* 页面头部 */}
            <div className="mb-8">
              <div className="flex items-center justify-between gap-6 mb-6">
                <div className="flex-shrink-0">
                  <h1 className="text-3xl font-bold text-primary-gradient">
                    创作者
                  </h1>
                  <p className="text-gray-500 mt-1">发现优秀的AI创作者和他们的作品</p>
                </div>
                
                {/* 搜索栏 */}
                <div className="flex-1 max-w-4xl">
                  <form onSubmit={handleSearch} className="w-4/5 mx-auto">
                    <div className="relative">
                      <Input
                        placeholder="搜索创作者昵称、简介或专长..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </form>
                </div>
                
                {canCreateProfile && (
                  <div className="flex-shrink-0">
                    <Button 
                      onClick={() => router.push(hasOwnProfile ? `/creators/${user.id}` : '/creators/edit')} 
                      className="btn-primary shadow-lg hover:shadow-xl"
                    >
                      {hasOwnProfile ? '查看我的主页' : '创建我的个人主页'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* 创作者列表 */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CreatorCardSkeleton key={i} />
                ))}
              </div>
            ) : creators.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无创作者</h3>
                <p className="text-gray-500 text-center max-w-md mb-6">
                  还没有创作者加入我们的平台。
                  {canCreateProfile && !hasOwnProfile && '成为第一个创作者，展示你的AI创作才华！'}
                </p>
                {canCreateProfile && !hasOwnProfile && (
                  <Button 
                    onClick={() => router.push('/creators/edit')}
                    className="btn-primary"
                  >
                    创建我的个人主页
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {creators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 主页组件
export default function CreatorsPage() {
  return (
    <AuthWrapper
      showToast={false}
      loadingFallback={<CreatorsLoadingSkeleton />}
    >
      <CreatorsContent />
    </AuthWrapper>
  );
} 