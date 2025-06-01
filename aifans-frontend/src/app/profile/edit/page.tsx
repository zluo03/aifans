'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';
import { usersApi } from '../../../lib/api';
import { processImageUrl, ensureAvatarUrlConsistency, getProxyAvatarUrl } from '@/lib/utils/image-url';
import { membershipApi } from '@/lib/api/membership';
import { Badge } from '@/components/ui/badge';
import { Crown, Gift } from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, forceRefreshUserProfile } = useAuthStore();
  
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // 初始化表单
    setNickname(user.nickname || '');
    
    // 统一处理用户头像，不再区分是否为微信用户
    if (user.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
      console.log('用户有头像，使用现有头像:', user.avatarUrl);
    } else {
      // 没有头像时使用默认头像
      setAvatarUrl('');
      console.log('用户没有头像，使用默认头像');
    }
    
    setLoading(false);

    // 添加调试输出
    console.log('编辑个人资料 - 用户信息:', {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl || '未设置',
      isWechatUser: user.isWechatUser || false
    });
  }, [user, router]);

  // 处理上传的头像URL - 使用新的确保一致性的函数
  const consistentAvatarUrl = ensureAvatarUrlConsistency(avatarUrl);
  const displayAvatarUrl = avatarUrl ? getProxyAvatarUrl(avatarUrl) : '/images/default-avatar.png';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 文件大小限制(5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('文件大小不能超过5MB');
      return;
    }
    
    // 文件类型限制
    if (!file.type.startsWith('image/')) {
      toast.error('只能上传图片文件');
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatar');
      
      const result = await usersApi.uploadAvatar(formData);
      console.log('上传头像响应:', result);
      
      // 保存头像URL
      const newAvatarUrl = result.url;
      setAvatarUrl(newAvatarUrl);
      
      // 检查URL格式是否正确
      const consistentUrl = ensureAvatarUrlConsistency(newAvatarUrl);
      console.log('头像URL检查:', {
        原始URL: newAvatarUrl,
        一致性处理后: consistentUrl,
        处理后URL: processImageUrl(consistentUrl),
        是否包含uploads: newAvatarUrl.includes('/uploads/'),
        是否包含http: newAvatarUrl.startsWith('http')
      });
      
      toast.success('头像上传成功');
    } catch (error) {
      console.error('上传头像失败:', error);
      toast.error('头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      toast.error('昵称不能为空');
      return;
    }
    
    setSaving(true);
    
    try {
      // 确保使用最新的avatarUrl值
      const updateData = {
        nickname: nickname.trim(),
        avatarUrl,
      };
      
      console.log('更新个人资料数据:', updateData);
      
      // 1. 更新个人资料
      const result = await usersApi.updateProfile(updateData);
      console.log('更新个人资料成功，后端返回:', result);
      
      // 2. 强制刷新用户信息（确保获取最新的）
      console.log('开始强制刷新用户信息...');
      const refreshResult = await forceRefreshUserProfile();
      console.log('强制刷新用户信息结果:', refreshResult, '当前用户信息:', useAuthStore.getState().user);
      
      // 3. 等待短暂时间确保状态已更新
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 4. 手动更新当前状态确保UI一致性
      useAuthStore.setState((state) => {
        console.log('手动更新前的状态:', state.user);
        
        // 确保user存在
        if (!state.user) {
          console.warn('无法更新用户状态：当前用户状态为null');
          return state;
        }
        
        const updatedState = {
          ...state,
          user: {
            ...state.user,
            nickname: nickname.trim(),
            avatarUrl: avatarUrl
          }
        };
        
        console.log('手动更新后的状态:', updatedState.user);
        return updatedState;
      });
      
      // 记录日志
      console.log('最终更新后的用户信息:', useAuthStore.getState().user);
      
      toast.success('个人资料已更新');
      
      // 5. 使用硬重定向而不是客户端导航（确保完全刷新）
      console.log('准备重定向到个人资料页面...');
      window.location.href = '/profile';
    } catch (error) {
      console.error('更新个人资料失败:', error);
      toast.error('更新个人资料失败');
    } finally {
      setSaving(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) {
      toast.error('请输入兑换码');
      return;
    }

    if (redeemCode.length !== 16) {
      toast.error('兑换码必须是16位');
      return;
    }

    setRedeeming(true);

    try {
      const result = await membershipApi.user.redeemCode({ code: redeemCode.trim() });
      toast.success(result.message);
      setRedeemCode('');
      
      // 刷新用户信息
      await forceRefreshUserProfile();
    } catch (error: any) {
      console.error('兑换失败:', error);
      toast.error(error.response?.data?.message || '兑换失败');
    } finally {
      setRedeeming(false);
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'NORMAL':
        return '普通用户';
      case 'PREMIUM':
        return '高级会员';
      case 'LIFETIME':
        return '终身会员';
      case 'ADMIN':
        return '管理员';
      default:
        return '未知';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'NORMAL':
        return 'secondary';
      case 'PREMIUM':
        return 'default';
      case 'LIFETIME':
        return 'destructive';
      case 'ADMIN':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-6">编辑个人资料</h1>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6">编辑个人资料</h1>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>个人信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative h-32 w-32 rounded-full overflow-hidden">
                  <img 
                    src={displayAvatarUrl} 
                    alt={user?.nickname || '用户头像'} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      {uploading ? '上传中...' : '更换头像'}
                    </div>
                    <Input 
                      id="avatar" 
                      type="file" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      disabled={uploading}
                    />
                  </Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nickname">昵称</Label>
                <Input 
                  id="nickname" 
                  value={nickname} 
                  onChange={(e) => setNickname(e.target.value)} 
                  placeholder="请输入昵称"
                  disabled={saving}
                />
              </div>
              
              <div className="space-y-2">
                <Label>用户名</Label>
                <Input 
                  value={user?.username || ''} 
                  disabled 
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">用户名不可修改</p>
              </div>
              
              <div className="space-y-2">
                <Label>邮箱</Label>
                <Input 
                  value={user?.email || ''} 
                  disabled 
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">邮箱地址不可修改</p>
              </div>

              {/* 会员状态 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  会员等级
                </Label>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(user?.role || 'NORMAL') as any}>
                    {getRoleText(user?.role || 'NORMAL')}
                  </Badge>
                </div>
                {user?.premiumExpiryDate && user?.role !== 'LIFETIME' && (
                  <p className="text-xs text-muted-foreground">
                    到期时间：{new Date(user.premiumExpiryDate).toLocaleDateString('zh-CN')}
                  </p>
                )}
                {user?.role === 'LIFETIME' && (
                  <p className="text-xs text-green-600">
                    永久有效
                  </p>
                )}
              </div>

              {/* 兑换码 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  兑换码
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    placeholder="请输入16位兑换码"
                    maxLength={16}
                    disabled={redeeming}
                  />
                  <Button 
                    type="button"
                    onClick={handleRedeemCode}
                    disabled={redeeming || !redeemCode.trim()}
                    size="sm"
                  >
                    {redeeming ? '兑换中...' : '兑换'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  输入兑换码可以获得会员时长
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/profile')}
                disabled={saving}
              >
                取消
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving ? '保存中...' : '保存更改'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 