"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import type { DefaultOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

import { getCrossTabBroadcast } from '@/lib/utils/broadcast-channel';
import { startRolePolling, stopRolePolling } from '@/lib/utils/role-polling';
import { isUserBanned } from '@/lib/utils/permissions';

// 定义事件类型，确保TypeScript不会报错
declare global {
  interface WindowEventMap {
    'auth-state-changed': CustomEvent<{
      oldAvatarUrl?: string;
      newAvatarUrl?: string;
      timestamp?: number;
    }>;
    'user-role-updated': CustomEvent<{
      userId: number;
      role: string;
      timestamp: number;
    }>;
    'user-status-updated': CustomEvent<{
      userId: number;
      status: string;
      timestamp: number;
    }>;
  }
}

const queryCache = new QueryCache({
  onError: (error) => {
    const axiosError = error as AxiosError<{ message: string }>;
    const message = axiosError.response?.data?.message || '请求失败，请稍后重试';
    toast.error(message);
  },
});

const mutationCache = new MutationCache({
  onError: (error) => {
    const axiosError = error as AxiosError<{ message: string }>;
    const message = axiosError.response?.data?.message || '操作失败，请稍后重试';
    toast.error(message);
  },
});

const queryClientOptions: DefaultOptions = {
  queries: {
    staleTime: 30000, // 默认30秒内认为数据是新鲜的
    gcTime: 300000, // 默认缓存5分钟
    retry: (failureCount, error) => {
      const axiosError = error as AxiosError;
      // 对于404错误不重试
      if (axiosError.response?.status === 404) return false;
      // 对于其他错误最多重试2次
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // 窗口获得焦点时不自动重新获取数据
    refetchOnReconnect: true, // 网络重新连接时重新获取数据
  },
  mutations: {
    retry: false, // 默认不重试变更操作
  },
};

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: storeLoading, initialize } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: queryClientOptions,
    queryCache,
    mutationCache,
  }));

  // 统一的认证检查函数
  const checkAuth = async () => {
    if (!isInitialized) {
      await initialize();
      setIsInitialized(true);
    }
    return !!user;
  };

  // 初始化认证状态
  useEffect(() => {
    const init = async () => {
      if (!isInitialized) {
        await initialize();
        setIsInitialized(true);
      }
      setIsLoading(false);
    };

    init();
  }, [initialize, isInitialized]);

  const value = {
    isLoading: isLoading || storeLoading,
    isAuthenticated: !!user,
    checkAuth,
  };

  useEffect(() => {
    // 初始化跨标签页广播通道
    const broadcast = getCrossTabBroadcast();

    // 启动角色轮询（用于跨浏览器检测角色变化）
    if (user) {
      startRolePolling();
    }

    // 监听认证状态变化事件
    const handleAuthStateChange = async (event: CustomEvent) => {
      // 添加短暂延迟，避免在登录刚完成时的竞态条件
      setTimeout(async () => {
        try {
          await checkAuth();
        } catch (error) {
          // 处理错误
        }
      }, 100); // 延迟100ms
    };

    // 注释掉storage监听，避免多标签页同步登录状态
    // const handleStorageChange = async (e: StorageEvent) => {
    //   if (e.key === 'auth-storage') {
    //     console.log('[AuthProvider] 检测到存储变化，重新加载用户状态');
    //     try {
    //       await checkAuth();
    //     } catch (error) {
    //       console.error('[AuthProvider] 重新加载用户状态失败:', error);
    //     }
    //   }
    // };

    // 监听用户角色更新事件 - 统一处理逻辑
    const handleUserRoleUpdate = async (event: CustomEvent) => {
      const { userId, role } = event.detail;
      const currentUser = useAuthStore.getState().user;
      
      // 如果更新的是当前用户，刷新状态
      if (currentUser && currentUser.id === userId) {
        try {
          // 先等待一小段时间，确保后端数据已更新
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 使用checkAuth获取最新数据
          await checkAuth();
          
          // 检查用户是否被封禁，如果是则自动登出
          const updatedUser = useAuthStore.getState().user;
          if (updatedUser && isUserBanned(updatedUser as any)) {
            toast.error('您的账号已被封禁，即将自动登出');
            setTimeout(() => {
              useAuthStore.getState().logout();
              window.location.href = '/login';
            }, 2000);
          }
        } catch (error) {
          // 处理错误
        }
      }
    };

    // 监听用户状态更新事件
    const handleUserStatusUpdate = async (event: CustomEvent) => {
      const { userId } = event.detail;
      const currentUser = useAuthStore.getState().user;
      
      if (currentUser && currentUser.id === userId) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          await checkAuth();
          
          // 检查用户是否被封禁，如果是则自动登出
          const updatedUser = useAuthStore.getState().user;
          if (updatedUser && isUserBanned(updatedUser as any)) {
            toast.error('您的账号已被封禁，即将自动登出');
            setTimeout(() => {
              useAuthStore.getState().logout();
              window.location.href = '/login';
            }, 2000);
          }
        } catch (error) {
          // 处理错误
        }
      }
    };

    // 添加事件监听器
    window.addEventListener('auth-state-changed', handleAuthStateChange as EventListener);
    // window.addEventListener('storage', handleStorageChange); // 移除storage监听
    window.addEventListener('user-role-updated', handleUserRoleUpdate as EventListener);
    window.addEventListener('user-status-updated', handleUserStatusUpdate as EventListener);

    // 清理事件监听器
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange as EventListener);
      // window.removeEventListener('storage', handleStorageChange); // 移除storage监听
      window.removeEventListener('user-role-updated', handleUserRoleUpdate as EventListener);
      window.removeEventListener('user-status-updated', handleUserStatusUpdate as EventListener);
      
      // 停止角色轮询
      stopRolePolling();
    };
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 