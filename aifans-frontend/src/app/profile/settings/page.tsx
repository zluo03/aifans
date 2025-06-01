'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';
import { usersApi } from '../../../lib/api';
import Link from 'next/link';
import { Role } from '../../../types/user';
import { PASSWORD_RULES, validatePassword } from '@/lib/utils/validation';
import { PasswordInput } from '@/components/ui/password-input';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // 实时验证确认密码
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致');
    } else {
      setPasswordError('');
    }
  }, [newPassword, confirmPassword]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('开始修改密码');
    
    // 预处理密码，去除首尾空格
    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    
    console.log('处理后的密码长度:', {
      currentPassword: trimmedCurrentPassword.length,
      newPassword: trimmedNewPassword.length,
      confirmPassword: trimmedConfirmPassword.length
    });
    
    if (!trimmedCurrentPassword || !trimmedNewPassword || !trimmedConfirmPassword) {
      console.warn('表单验证失败：密码字段为空');
      toast.error('请填写所有密码字段');
      return;
    }
    
    // 验证当前密码
    if (trimmedCurrentPassword.length < 8) {
      console.warn('表单验证失败：当前密码长度不足');
      toast.error('当前密码长度不能少于8位');
      return;
    }
    
    // 验证新密码
    const passwordValidation = validatePassword(trimmedNewPassword);
    if (!passwordValidation.isValid) {
      console.warn('表单验证失败：新密码不符合规则');
      toast.error(passwordValidation.message);
      return;
    }
    
    if (trimmedNewPassword !== trimmedConfirmPassword) {
      console.warn('表单验证失败：新密码不一致');
      toast.error('新密码与确认密码不一致');
      return;
    }
    
    if (trimmedCurrentPassword === trimmedNewPassword) {
      console.warn('表单验证失败：新密码与当前密码相同');
      toast.error('新密码不能与当前密码相同');
      return;
    }
    
    setChangingPassword(true);
    console.log('发送修改密码请求');
    
    try {
      // 确保密码字段不包含多余的空格
      const response = await usersApi.changePassword({
        currentPassword: trimmedCurrentPassword,
        newPassword: trimmedNewPassword,
      });
      
      console.log('密码修改成功:', response);
      toast.success('密码已更新，请重新登录');
      
      // 清空表单
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      
      // 清除认证状态，要求用户重新登录
      localStorage.removeItem('auth-storage');
      router.push('/login');
    } catch (error: any) {
      console.error('修改密码失败:', {
        error,
        response: error.response,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      // 获取详细的错误信息
      const errorResponse = error.response?.data;
      const errorMessage = errorResponse?.message || error.message || '修改密码失败，请重试';
      
      // 根据错误类型显示不同的提示
      if (errorMessage.includes('当前密码不正确')) {
        toast.error('当前密码不正确，请重新输入');
        setCurrentPassword('');
      } else if (errorMessage.includes('新密码不符合要求')) {
        toast.error('新密码不符合要求：' + PASSWORD_RULES.text);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(errorMessage);
      }
      
      // 记录详细的错误信息
      console.error('修改密码错误详情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: errorMessage,
        stack: error.stack,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6">账号设置</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>修改密码</CardTitle>
          </CardHeader>
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">当前密码</Label>
                <PasswordInput
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="输入当前密码"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="输入新密码"
                />
                <p className="text-sm text-muted-foreground">
                  {PASSWORD_RULES.text}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认新密码</Label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  error={passwordError}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="ml-auto" 
                disabled={changingPassword || !!passwordError}
              >
                {changingPassword ? '更新中...' : '更新密码'}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        {user.role === Role.NORMAL && (
          <Card>
            <CardHeader>
              <CardTitle>会员升级</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                升级到高级会员，解锁更多功能和特权
              </p>
              <Button asChild className="w-full">
                <Link href="/membership">查看会员套餐</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 