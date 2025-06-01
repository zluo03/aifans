"use client";

import { useState, use } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    }
  });
  
  const password = watch('password');
  
  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 发送重置密码请求
      await authApi.resetPassword(token, data.password);
      
      setSuccess(true);
      
      // 3秒后重定向到登录页
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (error: any) {
      setError(error.response?.data?.message || '重置密码失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary">重置密码</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            请输入您的新密码
          </p>
        </div>
        
        <div className="mt-8 bg-card shadow-sm rounded-lg p-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
              <button 
                onClick={() => setError(null)}
                className="float-right font-bold"
              >
                &times;
              </button>
            </div>
          )}
          
          {success ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">密码已重置成功</h3>
              <p className="text-muted-foreground mb-6">
                您的密码已成功更新。即将跳转到登录页面...
              </p>
              <Link 
                href="/login"
                className="text-primary hover:underline"
              >
                立即前往登录页面
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium">
                  新密码
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    {...register('password', { 
                      required: '请输入新密码',
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
                <label htmlFor="confirmPassword" className="block text-sm font-medium">
                  确认新密码
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  {...register('confirmPassword', {
                    required: '请确认新密码',
                    validate: value => value === password || '两次输入的密码不一致'
                  })}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '提交中...' : '重置密码'}
                </button>
              </div>
              
              <div className="text-center">
                <Link 
                  href="/login"
                  className="text-sm text-primary hover:underline"
                >
                  返回登录
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 