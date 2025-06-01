'use client';

import { useAuthStore } from '@/lib/store/auth-store';

/**
 * 简化的认证同步Hook
 * 现在主要依赖轮询机制进行跨浏览器同步
 */
export function useAuthSync() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  
  return {
    user,
    isAuthenticated,
    isLoading
  };
} 