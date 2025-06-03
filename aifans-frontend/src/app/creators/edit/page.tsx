"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
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
  
  // 使用useRef替代对话框
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
    } else if (work.type === 'video' && videos.length < 12) {
      setVideos(prev => [...prev, fixedWork]);
    } else if (work.type === 'audio' && audios.length < 12) {
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

  // 直接处理文件上传
  const handleFileUpload = async (file: File, type: 'image' | 'video' | 'audio') => {
    if (!file) return;
    
    // 获取文件类型限制
    let maxSizeMB = type === 'image' ? 5 : type === 'video' ? 50 : 20;
    
    try {
      // 从公共API获取上传限制
      const limitResponse = await fetch('/api/public/settings/upload-limits/creator');
      if (limitResponse.ok) {
        const limits = await limitResponse.json();
        if (type === 'image' && limits.imageMaxSizeMB) {
          maxSizeMB = limits.imageMaxSizeMB;
        } else if (type === 'video' && limits.videoMaxSizeMB) {
          maxSizeMB = limits.videoMaxSizeMB;
        } else if (type === 'audio' && limits.audioMaxSizeMB) {
          maxSizeMB = limits.audioMaxSizeMB;
        }
        console.log(`获取到${type}类型的上传限制: ${maxSizeMB}MB`);
      }
    } catch (error) {
      console.warn('获取上传限制失败，使用默认值', error);
    }
    
    // 检查文件大小
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`文件大小超过限制 (${maxSizeMB}MB)`);
      return;
    }
    
    // 文件类型检查
    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    } else if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error('请上传视频文件');
      return;
    } else if (type === 'audio' && !file.type.startsWith('audio/')) {
      toast.error('请上传音频文件');
      return;
    }
    
    // 检查上传数量限制
    if (type === 'image' && images.length >= 30) {
      toast.error('图片作品最多上传30个');
      return;
    } else if (type === 'video' && videos.length >= 12) {
      toast.error('视频作品最多上传12个');
      return;
    } else if (type === 'audio' && audios.length >= 12) {
      toast.error('音频作品最多上传12个');
      return;
    }
    
    setUploading(true);
    
    // 准备上传数据
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', type === 'image' ? 'creators/images' : 
                           type === 'video' ? 'creators/videos' : 
                           'creators/audios');
    
    try {
      // 尝试从localStorage获取最新的token
      let authToken = token || '';
      
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const { state } = JSON.parse(authStorage);
          if (state?.token) {
            authToken = state.token;
          }
        }
      } catch (error) {
        console.error('获取localStorage中的token失败:', error);
      }
      
      // 确保token格式正确
      authToken = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      
      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': authToken,
        },
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: '服务器响应错误' };
        }
        toast.error(errorData.error || '上传失败');
        return;
      }
      
      const result = await response.json();
      
      // 添加到作品列表
      const work = {
        url: result.url,
        key: result.key,
        title: '',
        desc: '',
        type
      };
      
      handleAddWork(work);
      toast.success('上传成功');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 处理输入框变化事件
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], type);
    }
    // 重置input以便可以再次选择同一文件
    e.target.value = '';
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
      // 尝试从localStorage获取最新的token
      let authToken = token || '';
      
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const { state } = JSON.parse(authStorage);
          if (state?.token) {
            authToken = state.token;
            console.log('从localStorage获取到token:', authToken.substring(0, 15) + '...');
          }
        }
      } catch (error) {
        console.error('获取localStorage中的token失败:', error);
      }
      
      // 确保token格式正确
      authToken = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      
      console.log('准备发送请求, 用户信息:', {
        nickname: payload.nickname,
        hasImages: payload.images.length > 0,
        hasVideos: payload.videos.length > 0,
        hasAudios: payload.audios.length > 0
      });

      const response = await fetch('/api/creators', {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        cache: 'no-cache' // 禁用缓存
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('保存失败，响应:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        let errorMessage = '保存失败';
        try {
          if (errorText && errorText.trim()) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorData.details || '保存失败';
          }
        } catch (e) {
          errorMessage = `保存失败 (${response.status}: ${response.statusText})`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      toast.success('保存成功');
      router.push(`/creators/${user?.id}`);
    } catch (error: any) {
      console.error('保存创作者信息失败:', error);
      toast.error(typeof error === 'object' ? (error.message || '保存失败') : String(error));
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
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={(e) => handleFileInputChange(e, 'image')}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button 
                    onClick={() => imageInputRef.current?.click()}
                    disabled={images.length >= 30 || uploading}
                    className="mb-4 btn-primary"
                  >
                    {uploading ? '上传中...' : '上传图片'}
                  </Button>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{videos.length}/12</span>
                  </div>
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={(e) => handleFileInputChange(e, 'video')}
                    accept="video/*"
                    className="hidden"
                  />
                  <Button 
                    onClick={() => videoInputRef.current?.click()}
                    disabled={videos.length >= 12 || uploading}
                    className="mb-4 btn-secondary"
                  >
                    {uploading ? '上传中...' : '上传视频'}
                  </Button>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {videos.map((video, idx) => (
                      <div key={idx} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          {video.url && video.url.trim() !== '' ? (
                            <div className="w-full h-full bg-black flex items-center justify-center">
                              <video src={video.url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{audios.length}/12</span>
                  </div>
                  <input
                    type="file"
                    ref={audioInputRef}
                    onChange={(e) => handleFileInputChange(e, 'audio')}
                    accept="audio/*"
                    className="hidden"
                  />
                  <Button 
                    onClick={() => audioInputRef.current?.click()}
                    disabled={audios.length >= 12 || uploading}
                    className="mb-4 btn-tertiary"
                  >
                    {uploading ? '上传中...' : '上传音频'}
                  </Button>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {audios.map((audio, idx) => {
                      // 从URL中提取文件名
                      const filename = audio.url ? audio.url.split('/').pop()?.split('?')[0] || `音频 ${idx+1}` : `音频 ${idx+1}`;
                      
                      return (
                        <div key={idx} className="relative group">
                          <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                            <div className="aspect-video bg-gradient-to-r from-[var(--custom-primary-light)] to-[var(--custom-secondary-light)] p-3 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--custom-primary)] to-[var(--custom-secondary)] flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                              </div>
                            </div>
                            <div className="p-3">
                              <p className="text-sm text-gray-700 truncate font-medium mb-2">{filename}</p>
                              {audio.url && (
                                <audio 
                                  src={audio.url} 
                                  controls 
                                  className="w-full h-8" 
                                  controlsList="nodownload"
                                />
                              )}
                            </div>
                          </div>
                          <button
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                            onClick={() => handleDeleteWork('audio', idx)}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
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
          </div>
        </div>
      </div>
    </div>
  );
} 