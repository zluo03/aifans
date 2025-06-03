'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';

interface AuthWrapperProps {
  children: React.ReactNode;
  requiredRole?: 'NORMAL' | 'PREMIUM' | 'LIFETIME' | 'ADMIN';
  loadingFallback?: React.ReactNode;
  redirectTo?: string;
  showToast?: boolean;
}

// 默认的加载状态组件
function DefaultLoadingFallback() {
  return (
    <div className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden">
      <div className="p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-16 w-full mb-2" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 content-scrollbar">
        <div className="max-w-7xl mx-auto pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthWrapper({
  children,
  requiredRole,
  loadingFallback,
  redirectTo = '/login',
  showToast = true,
}: AuthWrapperProps) {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // 检测页面是否正在加载中
  useEffect(() => {
    // 页面加载完成后设置isPageLoading为false
    if (document.readyState === 'complete') {
      setIsPageLoading(false);
    } else {
      const handleLoad = () => setIsPageLoading(false);
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  useEffect(() => {
    // 如果认证状态还未初始化或正在加载中，不做任何处理
    if (!isInitialized || isLoading) {
      return;
    }

    // 如果需要登录但未登录
    if (!isAuthenticated) {
      // 保存当前URL，以便登录后返回
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      
      // 只有在页面完全加载后，且用户明确操作时才显示提示
      // 避免在页面刷新或初始加载时显示提示
      if (showToast && !isPageLoading) {
        toast.error('请先登录');
      }
      
      router.push(redirectTo);
      return;
    }

    // 如果指定了所需角色
    if (requiredRole && user) {
      const roleHierarchy = {
        'NORMAL': 0,
        'PREMIUM': 1,
        'LIFETIME': 2,
        'ADMIN': 3
      };

      const userRoleLevel = roleHierarchy[user.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      // 如果用户角色等级不够
      if (userRoleLevel < requiredRoleLevel) {
        if (showToast && !isPageLoading) {
          toast.error('权限不足，请升级会员');
        }
        router.push('/membership');
        return;
      }
    }

    // 通过所有权限检查
    setIsAuthorized(true);
  }, [isInitialized, isLoading, isAuthenticated, user, requiredRole, router, redirectTo, showToast, isPageLoading]);

  // 如果认证状态还未初始化或正在加载中
  if (!isInitialized || isLoading) {
    return loadingFallback || <DefaultLoadingFallback />;
  }

  // 只有在通过权限检查后才渲染子组件
  return isAuthorized ? children : null;
} 