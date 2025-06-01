'use client';

import React, { useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { toast } from 'sonner';

export function WechatLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleWechatLogin = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      console.log('正在获取微信登录配置...');
      const config = await authApi.getWechatLoginConfig();
      console.log('微信登录配置:', {
        appId: config.appId,
        redirectUri: config.redirectUri,
        scope: config.scope
      });
      
      // 验证配置是否完整
      if (!config.appId || !config.redirectUri || !config.scope) {
        throw new Error('微信登录配置不完整');
      }
      
      // 构建微信授权URL
      const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${config.appId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=${config.scope}&state=${Math.random().toString(36).substring(7)}#wechat_redirect`;
      
      console.log('即将跳转到微信授权页面:', authUrl);
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('微信登录失败:', error);
      setIsError(true);
      toast.error(error.message || '微信登录暂时不可用，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isError ? 'border-red-300 bg-red-50' : ''}`}
      onClick={handleWechatLogin}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" fill="#07C160"/>
        <path d="M18.5 12.3C18.5 10.1 16.7 8.3 14.5 8.3C12.3 8.3 10.5 10.1 10.5 12.3C10.5 13.4 10.9 14.4 11.6 15.2L10.5 17.8L13.1 16.7C13.5 16.9 14 17 14.5 17C16.7 17 18.5 15.2 18.5 13V12.3Z" fill="white"/>
        <path d="M13.5 6C9.9 6 7 8.9 7 12.5C7 14.1 7.6 15.6 8.5 16.7L7 20L10.3 18.5C11.3 19 12.4 19.2 13.5 19.2C17.1 19.2 20 16.3 20 12.7C20 9.1 17.1 6.2 13.5 6Z" fill="white"/>
      </svg>
      {isLoading ? '正在跳转...' : isError ? '微信登录不可用' : '微信登录'}
    </button>
  );
} 