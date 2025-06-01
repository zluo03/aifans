"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import { PASSWORD_RULES, validatePassword } from '@/lib/utils/validation';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuthStore } from '@/lib/store/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [passwordError, setPasswordError] = useState('');

  // 检查是否已登录，如果已登录则重定向
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('用户已登录，重定向到首页');
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  // 验证码倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 实时验证确认密码
  useEffect(() => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setPasswordError('两次输入的密码不一致');
    } else {
      setPasswordError('');
    }
  }, [formData.password, formData.confirmPassword]);

  // 发送验证码
  const handleSendVerificationCode = async () => {
    if (!formData.email) {
      toast.error('请先填写邮箱地址');
      return;
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    setIsSendingCode(true);

    try {
      await authApi.sendVerificationCode(formData.email);
      toast.success('验证码已发送到您的邮箱，请查收');
      setCountdown(60); // 60秒倒计时
    } catch (error: any) {
      console.error('发送验证码失败:', error);
      toast.error(error.response?.data?.message || '发送验证码失败，请重试');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    const { username, nickname, email, password, confirmPassword, verificationCode } = formData;

    // 表单验证
    if (!username || !email || !password || !confirmPassword || !verificationCode) {
      toast.error('请填写所有必填字段');
      return;
    }

    // 验证用户名格式
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      toast.error('用户名只能包含字母、数字和下划线，长度3-20位');
      return;
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    // 验证密码
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message);
      return;
    }

    // 验证确认密码
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    // 验证验证码
    if (!/^\d{6}$/.test(verificationCode)) {
      toast.error('请输入6位数字验证码');
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.register({
        username,
        nickname: nickname || username,
        email,
        password,
        verificationCode
      });

      toast.success('注册成功，请登录');
      router.push('/login');
    } catch (error: any) {
      console.error('注册失败:', error);
      toast.error(error.response?.data?.message || '注册失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">注册AI灵感社</h2>
          <p className="mt-2 text-gray-600">
            创建您的账号，开始创作之旅
          </p>
        </div>
        
        <div className="bg-gray-50 shadow-lg rounded-xl p-8 backdrop-blur-sm border border-gray-200" 
             style={{
               boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)'
             }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground">
                用户名
              </label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="输入用户名（字母、数字、下划线）"
                className="mt-1 block w-full rounded-md border border-input bg-background/30 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <Label htmlFor="nickname">昵称（选填）</Label>
              <Input
                id="nickname"
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="输入昵称"
              />
            </div>

            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="输入邮箱"
                required
              />
            </div>

            <div>
              <Label htmlFor="verificationCode">邮箱验证码</Label>
              <div className="flex gap-2">
                <Input
                  id="verificationCode"
                  type="text"
                  value={formData.verificationCode}
                  onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="输入6位验证码"
                  maxLength={6}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendVerificationCode}
                  disabled={isSendingCode || countdown > 0 || !formData.email}
                  className="whitespace-nowrap"
                >
                  {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码'}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="password">密码</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="输入密码"
                required
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {PASSWORD_RULES.text}
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">确认密码</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="再次输入密码"
                required
                error={passwordError}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !!passwordError}
            >
              {isSubmitting ? '注册中...' : '注册'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 