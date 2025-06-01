"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import WechatLoginModal from './components/WechatLoginModal';

interface LoginForm {
  login: string;
  password: string;
  captcha: string;
}

interface CaptchaData {
  captchaId: string;
  image: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error: authError, clearError, isAuthenticated, user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
  const [showWechatModal, setShowWechatModal] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>({
    defaultValues: {
      login: '',
      password: '',
      captcha: '',
    }
  });

  // 检查是否已登录，如果已登录则重定向
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('用户已登录，重定向到首页');
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  // 获取验证码
  const loadCaptcha = async () => {
    setIsLoadingCaptcha(true);
    try {
      const response = await fetch('/api/auth/captcha');
      const data = await response.json();
      setCaptchaData(data);
      setValue('captcha', ''); // 清空验证码输入
    } catch (error) {
      console.error('获取验证码失败:', error);
      toast.error('获取验证码失败，请重试');
    } finally {
      setIsLoadingCaptcha(false);
    }
  };

  // 页面加载时获取验证码和清除错误信息
  useEffect(() => {
    // 清除任何现有的错误信息
    if (clearError) clearError();
    loadCaptcha();
  }, []); // 空依赖数组，只在组件挂载时执行一次
  
  const onSubmit = async (data: LoginForm) => {
    if (!captchaData) {
      toast.error('请先获取验证码');
      return;
    }

    clearError();
    try {
      console.log('尝试登录:', data.login);
      await login({
        login: data.login,
        password: data.password,
        captchaId: captchaData.captchaId,
        captcha: data.captcha
      });
      console.log('登录成功，跳转首页');
      router.push('/');
    } catch (err: any) {
      console.error('登录错误:', err);
      // 登录失败后刷新验证码
      loadCaptcha();
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">登录AI灵感社</h2>
          <p className="mt-2 text-gray-600">
            使用您的账号登录，开始创作之旅
          </p>
        </div>
        
        <div className="bg-gray-50 shadow-lg rounded-xl p-8 backdrop-blur-sm border border-gray-200" 
             style={{
               boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)'
             }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-foreground">
              用户名/邮箱
            </label>
            <input
              id="login"
              type="text"
              autoComplete="username"
              className="mt-1 block w-full rounded-md border border-input bg-background/30 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              {...register('login', { 
                required: '请输入用户名或邮箱',
                minLength: { 
                  value: 3, 
                  message: '用户名至少需要3个字符' 
                }
              })}
            />
            {errors.login && (
              <p className="mt-1 text-sm text-destructive">{errors.login.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              密码
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="mt-1 block w-full rounded-md border border-input bg-background/30 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                {...register('password', { 
                  required: '请输入密码',
                  minLength: { 
                    value: 6, 
                    message: '密码至少需要6个字符' 
                  }
                })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <span className="text-muted-foreground">隐藏</span>
                ) : (
                  <span className="text-muted-foreground">显示</span>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="captcha" className="block text-sm font-medium text-foreground">
              验证码
            </label>
            <div className="flex gap-2 mt-1">
              <input
                id="captcha"
                type="text"
                autoComplete="off"
                className="flex-1 rounded-md border border-input bg-background/30 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="输入验证码"
                maxLength={4}
                {...register('captcha', { 
                  required: '请输入验证码',
                  minLength: { 
                    value: 4, 
                    message: '请输入4位验证码' 
                  }
                })}
              />
              <div 
                className="w-24 h-10 border border-input rounded-md cursor-pointer flex items-center justify-center bg-background/30 hover:bg-background/50 transition-colors"
                onClick={loadCaptcha}
              >
                {isLoadingCaptcha ? (
                  <span className="text-xs text-muted-foreground">加载中...</span>
                ) : captchaData ? (
                  <img 
                    src={captchaData.image} 
                    alt="验证码" 
                    className="w-full h-full object-contain rounded"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">点击获取</span>
                )}
              </div>
            </div>
            {errors.captcha && (
              <p className="mt-1 text-sm text-destructive">{errors.captcha.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">点击验证码图片可刷新</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/forgot-password" className="text-primary hover:underline">
                忘记密码?
              </Link>
            </div>
          </div>
          
          {authError && (
            <div className="rounded-md bg-destructive/15 p-4">
              <div className="text-sm text-destructive">{authError}</div>
            </div>
          )}
          
          <div className="mt-6 flex flex-col space-y-3">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? '登录中...' : '登录'}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">或</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
                onClick={() => setShowWechatModal(true)}
              className="flex items-center justify-center gap-2 border-green-500 text-green-600 hover:bg-green-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.69 11.52a.96.96 0 0 1-.96-.96c0-.53.43-.96.96-.96s.96.43.96.96-.43.96-.96.96m6.62 0a.96.96 0 0 1-.96-.96c0-.53.43-.96.96-.96s.96.43.96.96-.43.96-.96.96m-3.2-7.04c-4.79 0-8.69 3.28-8.69 7.32C3.42 15 5.5 17.59 8.49 18.64l-.8 2.39c-.03.09 0 .18.07.24.06.06.16.1.24.07l2.82-1.42c.73.2 1.5.31 2.29.31 4.79 0 8.69-3.28 8.69-7.32s-3.9-7.32-8.69-7.32" />
              </svg>
              微信登录
            </Button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            还没有账号？
            <Link href="/register" className="text-primary hover:underline ml-1">
              立即注册
            </Link>
          </p>
        </div>
        </div>
      </div>

      {showWechatModal && (
        <WechatLoginModal
          isOpen={showWechatModal}
          onClose={() => setShowWechatModal(false)}
          qrCodeUrl="/icon/wechatlogin.png"
        />
      )}
    </div>
  );
} 