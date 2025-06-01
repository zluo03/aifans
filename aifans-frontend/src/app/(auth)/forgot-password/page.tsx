"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { authApi } from '@/lib/api';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    defaultValues: {
      email: '',
    }
  });
  
  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 发送忘记密码请求
      await authApi.forgotPassword(data.email);
      
      setSuccess(true);
    } catch (error: any) {
      setError(error.response?.data?.message || '操作失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary">忘记密码</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            输入您的注册邮箱，我们将向您发送重置密码的链接
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
              <div className="text-4xl mb-4">✉️</div>
              <h3 className="text-xl font-semibold mb-2">请检查您的邮箱</h3>
              <p className="text-muted-foreground mb-6">
                如果该邮箱已注册，我们已向其发送了重置密码的链接。链接有效期为1小时。
              </p>
              <Link 
                href="/login"
                className="text-primary hover:underline"
              >
                返回登录页面
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  电子邮箱
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  {...register('email', { 
                    required: '请输入邮箱',
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: '请输入有效的邮箱地址'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      发送中...
                    </div>
                  ) : '发送重置链接'}
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