import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { toast } from 'sonner';

interface WechatLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string;
}

export default function WechatLoginModal({ isOpen, onClose, qrCodeUrl }: WechatLoginModalProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error('请输入验证码');
      return;
    }

    setIsVerifying(true);
    try {
      console.log('发送验证请求...');
      
      const response = await fetch('/api/auth/wechat/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode })
      });

      console.log('收到响应:', response.status);
      
      if (!response.ok) {
        console.error('验证请求返回错误状态码:', response.status);
        if (response.status === 404) {
          toast.error('验证接口不存在，请检查服务器配置');
        } else {
          const errorText = await response.text().catch(() => '未知错误');
          console.error('错误详情:', errorText);
          toast.error('验证失败，请重试');
        }
        setIsVerifying(false);
        return;
      }
      
      const data = await response.json();
      console.log('响应数据:', data);
      
      if (data.success) {
        if (data.token) {
          console.log('验证成功，准备保存token:', {
            tokenLength: data.token.length,
            tokenPrefix: data.token.substring(0, 10) + '...',
            userData: data.user
          });
          
          // 先清除可能存在的旧token
          localStorage.removeItem('token');
          localStorage.removeItem('auth-storage');
          
          // 保存token到localStorage，确保格式正确
          const formattedToken = data.token.startsWith('Bearer ') ? data.token : `Bearer ${data.token}`;
          localStorage.setItem('token', formattedToken);
          
          // 确保用户头像处理
          if (data.user && !data.user.avatarUrl && data.user.wechatAvatar) {
            data.user.avatarUrl = data.user.wechatAvatar;
            console.log('用户没有头像，使用微信头像');
          }
          
          // 创建完整的auth-storage对象
          const authStorage = {
            state: {
              user: data.user,
              token: formattedToken,
              isAuthenticated: true,
              isLoading: false,
              error: null
            },
            version: 0
          };
          
          // 保存完整的auth-storage
          localStorage.setItem('auth-storage', JSON.stringify(authStorage));
          
          // 触发认证状态变更事件
          if (typeof window !== 'undefined') {
            console.log('触发auth-state-changed事件');
            window.dispatchEvent(new Event('auth-state-changed'));
          }
          
          // 显示成功提示
          toast.success('微信登录成功');
          
          // 关闭对话框
          onClose();
          
          // 延迟跳转，确保状态更新
          console.log('准备跳转到首页...');
          setTimeout(() => {
            console.log('执行跳转');
            window.location.href = '/';
          }, 1000);
        } else {
          console.error('登录成功但未收到token');
          toast.error('登录成功但未收到token，请联系管理员');
        }
      } else {
        console.error('验证失败:', data.message);
        toast.error(data.message || '验证失败，请重试');
      }
    } catch (error) {
      console.error('验证请求失败:', error);
      toast.error('网络请求失败，请重试');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>微信登录</DialogTitle>
          <DialogDescription>
            请使用微信扫描二维码关注公众号，发送"登录"获取验证码。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-64 h-64">
                <Image
              src={qrCodeUrl}
                      alt="微信二维码"
                      fill
                      className="object-contain"
                    />
                  </div>
          <div className="w-full space-y-2">
            <input
              type="text"
              maxLength={6}
              placeholder="请输入验证码"
              className="w-full px-3 py-2 border rounded-md"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isVerifying) {
                  handleVerifyCode();
                }
              }}
            />
            <p className="text-sm text-gray-500">
              验证码5分钟内有效，可发送"登录"获取新验证码
                </p>
          </div>
        </div>
        <DialogFooter className="flex space-x-2 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
                取消
              </Button>
          <Button
            type="button"
            onClick={handleVerifyCode}
            disabled={isVerifying}
          >
            {isVerifying ? '验证中...' : '验证'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 