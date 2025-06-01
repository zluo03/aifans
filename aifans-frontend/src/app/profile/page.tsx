'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { requestsApi } from '@/lib/api';
import { Request, RequestResponse } from '@/types';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { usersApi } from '@/lib/api';

// 加载状态UI
function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">个人资料</h1>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        <Skeleton className="h-14 w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// 主要内容组件
function ProfileContent() {
  const { user, forceRefreshUserProfile, token } = useAuthStore();
  const router = useRouter();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const displayAvatarUrl = avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `/images/default-avatar.png`) : '/images/default-avatar.png';

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('文件大小不能超过5MB');
      return;
    }
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
      setAvatarUrl(result.url);
      toast.success('头像上传成功');
    } catch (error) {
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
      await usersApi.updateProfile({ nickname: nickname.trim(), avatarUrl });
      if (token && user) {
        try {
          // 先查creator信息
          const creatorRes = await fetch(`/api/creators/user/${user.id}`);
          let creatorPayload: any = null;
          if (creatorRes.ok) {
            const creatorData = await creatorRes.json();
            if (creatorData) {
              // 用新昵称替换，其他字段保持不变
              creatorPayload = {
                ...creatorData,
                nickname: nickname.trim(),
                avatarUrl: avatarUrl || user.avatarUrl || '',
                // 兼容images/videos/audios为undefined的情况
                images: Array.isArray(creatorData.images) ? creatorData.images : [],
                videos: Array.isArray(creatorData.videos) ? creatorData.videos : [],
                audios: Array.isArray(creatorData.audios) ? creatorData.audios : [],
              };
            }
          }
          if (!creatorPayload) {
            // creator不存在，按初次创建逻辑
            creatorPayload = {
              nickname: nickname.trim(),
              avatarUrl: avatarUrl || user.avatarUrl || '',
              bio: '',
              expertise: '',
              backgroundUrl: '',
              images: [],
              videos: [],
              audios: [],
            };
          }
          await fetch('/api/creators', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(creatorPayload)
          });
        } catch (e) {
          // 忽略同步失败
        }
      }
      await forceRefreshUserProfile();
      toast.success('个人资料已更新');
    } catch (error) {
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
      const result = await import('@/lib/api/membership').then(m => m.membershipApi.user.redeemCode({ code: redeemCode.trim() }));
      toast.success(result.message);
      setRedeemCode('');
      await forceRefreshUserProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '兑换失败');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-12 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8">编辑个人资料</h1>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-32 w-32 rounded-full overflow-hidden shadow-lg border-4 border-white bg-gray-100">
            <img src={avatarUrl || '/images/default-avatar.png'} alt="用户头像" className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <label htmlFor="avatar-upload" className="inline-block mt-2 cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            {uploading ? '上传中...' : '更换头像'}
            <input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" disabled={uploading} />
          </label>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="nickname" className="font-medium text-lg">昵称</label>
          <input id="nickname" className="border rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-primary outline-none" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="请输入昵称" disabled={saving} maxLength={20} />
        </div>
        <button type="submit" className="mt-4 w-full py-3 bg-primary text-white text-lg font-bold rounded-lg shadow hover:bg-primary/90 transition" disabled={saving}>{saving ? '保存中...' : '保存修改'}</button>
      </form>
      {/* 会员兑换码区域 */}
      <div className="w-full mt-8 flex flex-col items-center gap-3 bg-white/80 rounded-xl p-6 shadow">
        <div className="text-lg font-semibold mb-2">会员兑换码</div>
        <div className="flex flex-col md:flex-row gap-2 w-full max-w-md">
          <input
            className="flex-1 border rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-primary outline-none"
            placeholder="请输入16位会员兑换码"
            value={redeemCode}
            onChange={e => setRedeemCode(e.target.value)}
            maxLength={16}
            disabled={redeeming}
          />
          <button
            type="button"
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-lg font-bold rounded-lg shadow hover:from-yellow-600 hover:to-orange-600 transition disabled:opacity-60"
            onClick={handleRedeemCode}
            disabled={redeeming}
          >
            {redeeming ? '兑换中...' : '立即兑换'}
          </button>
        </div>
        <div className="text-sm text-gray-500 mt-1">兑换码可用于开通/续费会员</div>
      </div>
    </div>
  );
}

// 主组件
export default function ProfilePage() {
  return <ProfileContent />;
} 