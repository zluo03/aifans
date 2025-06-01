"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import { UploadWorkDialog } from '@/app/creators/components/upload-work-dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { parseCreatorData } from '@/lib/utils/json-parser';
import { usePermissions } from '@/hooks/use-permissions';

interface Work {
  url: string;
  key?: string;
  title?: string;
  desc?: string;
  type: string;
}

export default function EditCreatorProfilePage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const permissions = usePermissions();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // 表单数据
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [images, setImages] = useState<Work[]>([]);
  const [videos, setVideos] = useState<Work[]>([]);
  const [audios, setAudios] = useState<Work[]>([]);
  const [uploadType, setUploadType] = useState<null | 'image' | 'video' | 'audio'>(null);

  useEffect(() => {
    // 权限检查
    if (!user) {
      router.push('/login');
      return;
    }

    if (!permissions.canCreateProfile()) {
      toast.error(permissions.getPermissionDeniedMessage("创建个人主页"));
      router.push('/creators');
      return;
    }

    // 获取现有的创作者信息
    const fetchCreatorInfo = async () => {
      try {
        const response = await fetch(`/api/creators/user/${user.id}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data) {
            const creator = parseCreatorData(data);
            setNickname(creator.nickname || user.nickname || '');
            setBio(creator.bio || '');
            setExpertise(creator.expertise || '');
            setBackgroundUrl(creator.backgroundUrl || '');
            setImages(creator.images || []);
            setVideos(creator.videos || []);
            setAudios(creator.audios || []);
          } else {
            // 新创建时使用用户昵称
            setNickname(user.nickname || '');
          }
        } else {
          // 新创建时使用用户昵称
          setNickname(user.nickname || '');
        }
      } catch (error) {
        console.error('Failed to fetch creator info:', error);
        setNickname(user.nickname || '');
      } finally {
        setInitialLoading(false);
      }
    };

    if (user.id && token) {
      fetchCreatorInfo();
    }
  }, [user, token, router]);

  // 作品添加
  const handleAddWork = (work: Work) => {
    // 验证URL是否有效
    if (!work.url || work.url.trim() === '') {
      toast.error('作品URL无效');
      return;
    }
    
    const fixedWork = {
      ...work,
      url: work.url.trim(),
    };
    
    if (work.type === 'image' && images.length < 30) {
      setImages(prev => [...prev, fixedWork]);
    } else if (work.type === 'video' && videos.length < 5) {
      setVideos(prev => [...prev, fixedWork]);
    } else if (work.type === 'audio' && audios.length < 5) {
      setAudios(prev => [...prev, fixedWork]);
    } else {
      toast.error('已达到上传数量限制');
    }
  };

  // 作品删除
  const handleDeleteWork = (type: string, idx: number) => {
    if (type === 'image') setImages(prev => prev.filter((_, i) => i !== idx));
    if (type === 'video') setVideos(prev => prev.filter((_, i) => i !== idx));
    if (type === 'audio') setAudios(prev => prev.filter((_, i) => i !== idx));
  };

  // 保存数据
  const handleSave = async () => {
    // 权限检查
    if (!permissions.canEditProfile()) {
      toast.error(permissions.getPermissionDeniedMessage("编辑个人主页"));
      return;
    }
    
    if (!nickname.trim()) {
      toast.error('昵称不能为空');
      return;
    }

    setLoading(true);
    const payload = {
      avatarUrl: user?.avatarUrl || '',
      nickname: nickname.trim(),
      bio: bio.trim(),
      expertise: expertise.trim(),
      backgroundUrl: backgroundUrl.trim(),
      images: images.filter(img => img.url && img.url.trim() !== ''),
      videos: videos.filter(v => v.url && v.url.trim() !== ''),
      audios: audios.filter(a => a.url && a.url.trim() !== '')
    };

    try {
      const response = await fetch('/api/creators', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存失败');
      }
      
      const data = await response.json();
      toast.success('保存成功');
      router.push(`/creators/${user?.id}`);
    } catch (error: any) {
      console.error('保存创作者信息失败:', error);
      toast.error(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  if (!user || initialLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-172px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden">
      <div className="flex-1 overflow-y-auto content-scrollbar">
        <div className="w-full px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {/* 页面头部 */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary-gradient">
                编辑个人主页
              </h1>
              <p className="text-gray-500 mt-1">展示你的AI创作才华，让更多人发现你的作品</p>
            </div>

            {/* 主要内容卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">基本信息</h2>
              
              <div className="space-y-6">
                {/* 头像与昵称 */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-primary-gradient flex items-center justify-center ring-4 ring-gray-100 p-1">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                        {user.avatarUrl && user.avatarUrl.trim() !== '' ? (
                          <img src={user.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <span className="text-2xl font-bold text-primary-gradient">
                            {nickname.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">昵称 *</label>
                    <div className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-lg text-gray-700 cursor-not-allowed select-none">{nickname}</div>
                  </div>
                </div>

                {/* 个人简介 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 min-h-[100px] focus:ring-2 focus:ring-[var(--custom-primary)] focus:border-transparent transition-all duration-200 resize-none"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    maxLength={200}
                    placeholder="介绍一下自己..."
                  />
                  <div className="text-xs text-gray-400 mt-1 text-right">{bio.length}/200</div>
                </div>

                {/* 擅长领域 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    擅长领域
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      （以英文逗号分隔，例如：首尾帧,Midjourney绘图）
                    </span>
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[var(--custom-primary)] focus:border-transparent transition-all duration-200"
                    value={expertise}
                    onChange={e => setExpertise(e.target.value)}
                    maxLength={100}
                    placeholder="如：AI绘画、视频制作、音乐创作（用逗号分隔）"
                  />
                </div>
              </div>
            </div>

            {/* 作品展示卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">作品展示</h2>
              
              <div className="space-y-8">
                {/* 图片作品 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">图片作品</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{images.length}/30</span>
                  </div>
                  <Button 
                    onClick={() => setUploadType('image')}
                    disabled={images.length >= 30}
                    className="mb-4 btn-primary"
                  >
                    上传图片
                  </Button>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          {img.url && img.url.trim() !== '' ? (
                            <img src={img.url} alt={img.title || '图片'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <button
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                          onClick={() => handleDeleteWork('image', idx)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 视频作品 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">视频作品</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{videos.length}/5</span>
                  </div>
                  <Button 
                    onClick={() => setUploadType('video')}
                    disabled={videos.length >= 5}
                    className="mb-4 btn-secondary"
                  >
                    上传视频
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video, idx) => (
                      <div key={idx} className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                          {video.url && video.url.trim() !== '' ? (
                            <video src={video.url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <button
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                          onClick={() => handleDeleteWork('video', idx)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 音频作品 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">音频作品</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{audios.length}/5</span>
                  </div>
                  <Button 
                    onClick={() => setUploadType('audio')}
                    disabled={audios.length >= 5}
                    className="mb-4 bg-rainbow-gradient text-white border-0 hover:opacity-90 transition-opacity"
                  >
                    上传音频
                  </Button>
                  <div className="space-y-3">
                    {audios.map((audio, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg group">
                        {audio.url && audio.url.trim() !== '' ? (
                          <audio src={audio.url} controls className="flex-1" />
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-gray-400 py-4">
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            音频文件无效
                          </div>
                        )}
                        <button
                          className="w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                          onClick={() => handleDeleteWork('audio', idx)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-4 mt-8">
              <Button 
                variant="outline" 
                onClick={() => router.push('/creators')}
                className="px-8 py-2"
              >
                取消
              </Button>
              <Button 
                className="btn-primary px-8 py-2" 
                onClick={handleSave}
                disabled={loading || !nickname.trim()}
              >
                {loading ? '保存中...' : '保存'}
              </Button>
            </div>

            {/* 上传对话框 */}
            <UploadWorkDialog 
              open={!!uploadType} 
              onOpenChange={() => setUploadType(null)} 
              type={uploadType || 'image'} 
              maxSizeMB={uploadType === 'image' ? 5 : 50} 
              onSuccess={handleAddWork} 
            />
          </div>
        </div>
      </div>
    </div>
  );
} 