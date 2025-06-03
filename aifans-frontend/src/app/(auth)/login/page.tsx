"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import WechatLoginModal from './components/WechatLoginModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

interface LoginForm {
  login: string;
  password: string;
  captcha: string;
}

interface CaptchaData {
  id?: string;
  captchaId?: string;
  image?: string;
  imageUrl?: string;
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
      // 检查是否有登录后的重定向路径
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.replace(redirectPath);
      } else {
        router.replace('/');
      }
    }
  }, [isAuthenticated, user, router]);

  // 获取验证码
  const loadCaptcha = async () => {
    setIsLoadingCaptcha(true);
    try {
      const response = await fetch('/api/auth/captcha', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      console.log('获取验证码成功:', data);
      
      // 处理API返回的数据
      setCaptchaData({
        id: data.id || data.captchaId,
        captchaId: data.captchaId,
        image: data.image,
        imageUrl: data.imageUrl
      });
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
  }, []);

  // 处理登录表单提交
  const onSubmit = async (data: LoginForm) => {
    if (!captchaData) {
      toast.error('验证码未加载，请刷新页面');
      return;
    }

    try {
      await login({
        login: data.login,
        password: data.password,
        captchaId: captchaData.captchaId || captchaData.id || '',
        captcha: data.captcha
      });
      
      // 登录成功后，检查是否有保存的重定向路径
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.replace(redirectPath);
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      // 登录失败，刷新验证码
      loadCaptcha();
    }
  };

  // 获取验证码图片URL
  const getCaptchaImageUrl = () => {
    if (!captchaData) return null;
    return captchaData.imageUrl || captchaData.image;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">登录</h1>
          <p className="text-gray-600 mt-2">欢迎回来，请登录您的账号</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="login">用户名或邮箱</Label>
            <Input
              id="login"
              type="text"
              placeholder="请输入用户名或邮箱"
              {...register('login', { required: '请输入用户名或邮箱' })}
            />
            {errors.login && <p className="text-red-500 text-sm">{errors.login.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                {...register('password', { required: '请输入密码' })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="captcha">验证码</Label>
            <div className="flex space-x-2">
              <Input
                id="captcha"
                type="text"
                placeholder="请输入验证码"
                {...register('captcha', { required: '请输入验证码' })}
              />
              <div 
                className="w-32 h-10 flex-shrink-0 cursor-pointer border rounded overflow-hidden"
                onClick={loadCaptcha}
              >
                {getCaptchaImageUrl() ? (
                  <img 
                    src={getCaptchaImageUrl() || ''} 
                    alt="验证码" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('验证码图片加载失败', e);
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // 防止循环错误
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWFsZXJ0LWNpcmNsZSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48bGluZSB4MT0iMTIiIHkxPSI4IiB4Mj0iMTIiIHkyPSIxMiIvPjxsaW5lIHgxPSIxMiIgeTE9IjE2IiB4Mj0iMTIuMDEiIHkyPSIxNiIvPjwvc3ZnPg==';
                      loadCaptcha(); // 自动重新加载验证码
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    {isLoadingCaptcha ? '加载中...' : '点击获取'}
                  </div>
                )}
              </div>
            </div>
            {errors.captcha && <p className="text-red-500 text-sm">{errors.captcha.message}</p>}
          </div>

          {authError && <p className="text-red-500 text-sm">{authError}</p>}

          <div className="flex justify-between items-center">
            <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
              忘记密码?
            </a>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </Button>
        </form>

        <div className="flex items-center justify-center">
          <span className="text-gray-500">还没有账号?</span>
          <a href="/register" className="ml-2 text-blue-600 hover:text-blue-800">
            立即注册
          </a>
        </div>
        
        <div className="pt-4 text-center">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowWechatModal(true)}
          >
            微信登录
          </Button>
        </div>
      </div>
      
      {/* 微信登录模态框 */}
      <WechatLoginModal 
        isOpen={showWechatModal} 
        onClose={() => setShowWechatModal(false)} 
      />
    </div>
  );
} 