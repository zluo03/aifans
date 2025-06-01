'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated, isLoading, loadUserFromToken } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 如果正在加载，等待加载完成
        if (isLoading) {
          console.log('管理后台权限检查: 等待加载用户状态完成');
          return;
        }

        // 获取并记录当前token状态
        const token = localStorage.getItem('token');
        console.log('管理后台权限检查: token状态', {
          hasToken: !!token,
          tokenPrefix: token ? token.substring(0, 10) + '...' : '无token'
        });

        // 如果没有认证状态，尝试从token加载用户
        if (!isAuthenticated || !user) {
          console.log('管理后台权限检查: 用户未认证或无用户信息，尝试从token加载');
          await loadUserFromToken();
          return;
        }

        console.log('管理后台权限检查: 用户角色', {
          username: user.username,
          role: user.role,
          status: user.status
        });

        // 检查用户是否是管理员
        if (user.role !== 'ADMIN') {
          console.warn('非管理员用户尝试访问管理后台，重定向到首页', {
            username: user.username,
            role: user.role
          });
          router.replace('/');
          return;
        }

        // 检查用户是否被封禁
        if (user.status === 'BANNED') {
          console.warn('封禁用户尝试访问管理后台，重定向到登录页', {
            username: user.username,
            status: user.status
          });
          router.replace('/login');
          return;
        }

        // 通过所有检查
        console.log('管理后台权限检查通过，允许访问');
        setIsChecking(false);
      } catch (error) {
        console.error('管理后台权限检查失败:', error);
        router.replace('/login');
      }
    };

    checkAuth();
  }, [user, isAuthenticated, isLoading, loadUserFromToken, router]);

  // 监听认证状态变化
  useEffect(() => {
    const handleAuthChange = () => {
      const currentState = useAuthStore.getState();
      
      // 如果用户登出或被封禁，重定向
      if (!currentState.isAuthenticated || !currentState.user) {
        router.replace('/login');
        return;
      }

      // 如果用户角色变化且不再是管理员，重定向
      if (currentState.user.role !== 'ADMIN') {
        router.replace('/');
        return;
      }

      // 如果用户被封禁，重定向
      if (currentState.user.status === 'BANNED') {
        router.replace('/login');
        return;
      }
    };

    window.addEventListener('auth-state-changed', handleAuthChange);
    window.addEventListener('user-role-updated', handleAuthChange);
    window.addEventListener('user-status-updated', handleAuthChange);

    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
      window.removeEventListener('user-role-updated', handleAuthChange);
      window.removeEventListener('user-status-updated', handleAuthChange);
    };
  }, [router]);

  // 如果正在检查权限或加载中，显示加载状态
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在验证管理员权限...</p>
        </div>
      </div>
    );
  }

  // 如果没有认证或不是管理员，不渲染内容（会被重定向）
  if (!isAuthenticated || !user || user.role !== 'ADMIN' || user.status === 'BANNED') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">正在重定向...</p>
        </div>
      </div>
    );
  }

  // 通过所有检查，渲染管理后台内容
  return <>{children}</>;
} 