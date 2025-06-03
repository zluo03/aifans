'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload';
import dynamic from 'next/dynamic';
import { getUploadLimit } from "@/lib/utils/upload-limits";

// 动态导入BlockNote编辑器，禁用SSR
const BlockNoteEditor = dynamic(
  () => import('@/components/editor/block-note-editor'),
  { 
    ssr: false,
    loading: () => <div className="border rounded-lg p-4 min-h-[400px] flex items-center justify-center">加载编辑器...</div>
  }
);

interface Category {
  id: number;
  name: string;
}

export default function CreateResourcePage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 检查用户是否为管理员
  useEffect(() => {
    const checkAdminStatus = async () => {
      setCheckingAuth(true);
      
      // 如果没有token，直接重定向到首页
      if (!token) {
        toast.error('请先登录');
        router.push('/');
        return;
      }
      
      try {
        // 确保token格式正确
        const formattedToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        // 直接从用户对象判断是否为管理员
        const { user } = useAuthStore.getState();
        if (user && user.role === 'ADMIN') {
          setIsAdmin(true);
          setCheckingAuth(false);
          return;
        }
        
        const response = await fetch('/api/check-admin', {
          headers: {
            'Authorization': formattedToken
          },
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP错误 ${response.status}` }));
          throw new Error(errorData.error || '验证管理员权限失败');
        }
        
        const data = await response.json();
        
        if (!data.isAdmin) {
          toast.error('您没有权限访问此页面');
          router.push('/');
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '验证权限失败，请重新登录');
        router.push('/');
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkAdminStatus();
  }, [token, router]);

  // 内容变化处理函数
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleAutoSave = useCallback((content: string) => {
    // 可选：自动保存功能
  }, []);

  // 封面图片上传处理
  const handleCoverUpload = useCallback(async (files: File[]): Promise<Array<{ url: string; key: string }>> => {
    if (files.length === 0) {
      return [];
    }

    // 只处理第一个文件，确保只能上传一张图片
    const file = files[0];
    
    try {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        toast.error('只能上传图片文件');
        return [{ url: '', key: '' }];
      }

      // 获取资源模块的上传限制
      let maxSizeMB = 10; // 默认值
      try {
        const limit = await getUploadLimit('resources');
        if (limit && limit.imageMaxSizeMB) {
          maxSizeMB = limit.imageMaxSizeMB;
        }
      } catch (limitError) {
        // 使用默认值
      }

      // 验证文件大小
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`图片大小不能超过${maxSizeMB}MB`);
        return [{ url: '', key: '' }];
      }
      
      // 尝试从localStorage获取最新的token
      let authToken = token;
      
      try {
        if (typeof window !== 'undefined') {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const { state } = JSON.parse(authStorage);
            if (state?.token) {
              authToken = state.token;
            }
          }
        }
      } catch (error) {
        // 继续使用原始token
      }
      
      // 确保token格式正确
      authToken = authToken?.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      
      if (!authToken) {
        toast.error('请先登录');
        return [{ url: '', key: '' }];
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'resources/covers');

      // 上传文件
      try {
        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': authToken,
          },
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const result = await response.json();
          setCoverImageUrl(result.url);
          toast.success(`封面图片上传成功`);
          return [result];
        } else {
          throw new Error(`上传失败: HTTP ${response.status}`);
        }
      } catch (error) {
        // 尝试备用方法：使用代理API
        const proxyResponse = await fetch('/api/proxy/api/storage/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': authToken
          },
          cache: 'no-cache'
        });
        
        if (proxyResponse.ok) {
          const result = await proxyResponse.json();
          setCoverImageUrl(result.url);
          toast.success(`封面图片上传成功`);
          return [result];
        }
        
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 
                          (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast.error(`封面图片上传失败: ${errorMessage}`);
      return [{ url: '', key: '' }];
    }
  }, [token]);

  useEffect(() => {
    // 只有在确认为管理员后才获取分类
    if (isAdmin) {
      fetchCategories();
    }
  }, [isAdmin]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/resource-categories');
      if (!response.ok) {
        throw new Error('获取分类失败');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast.error('获取分类失败');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('请输入标题');
      return;
    }
    
    if (!content.trim()) {
      toast.error('请输入内容');
      return;
    }
    
    if (!categoryId) {
      toast.error('请选择分类');
      return;
    }

    setLoading(true);
    try {
      // 尝试从localStorage获取最新的token
      let authToken = token;
      
      try {
        if (typeof window !== 'undefined') {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const { state } = JSON.parse(authStorage);
            if (state?.token) {
              authToken = state.token;
            }
          }
        }
      } catch (error) {
        // 继续使用原始token
      }
      
      if (!authToken) {
        toast.error('请先登录');
        return;
      }
      
      // 确保token格式正确
      const formattedToken = authToken?.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': formattedToken,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          coverImageUrl: coverImageUrl.trim() || undefined,
          categoryId,
        }),
        cache: 'no-cache',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP错误 ${response.status}` }));
        throw new Error(errorData.message || '创建资源失败');
      }

      const data = await response.json();
      toast.success('资源创建成功');
      router.push(`/resources/${data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建资源失败');
    } finally {
      setLoading(false);
    }
  };

  // 如果正在检查权限，显示加载状态
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-172px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">正在验证权限...</p>
        </div>
      </div>
    );
  }

  // 如果不是管理员，不渲染页面内容（应该已经被重定向）
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden">
      {/* 头部区域 */}
      <div className="p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">创建资源</h1>
            <Button variant="outline" onClick={() => router.push('/resources')}>
              取消
            </Button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 content-scrollbar">
        <div className="max-w-4xl mx-auto pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {/* 标题 */}
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  placeholder="输入资源标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              {/* 分类 */}
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select
                  value={categoryId?.toString() || ''}
                  onValueChange={(value) => setCategoryId(parseInt(value))}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 封面图片 */}
              <div className="space-y-2">
                <Label>封面图片</Label>
                <FileUpload
                  onUpload={handleCoverUpload}
                  accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
                  maxFiles={1}
                  maxSize={5 * 1024 * 1024} // 5MB
                  placeholder="拖拽封面图片到此处或点击上传"
                  onUrlsChange={(urls) => {
                    if (urls.length > 0) {
                      setCoverImageUrl(urls[0]);
                    }
                  }}
                />
                {coverImageUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">封面预览：</p>
                    <img 
                      src={coverImageUrl} 
                      alt="封面预览" 
                      className="max-w-xs rounded-lg border"
                    />
                  </div>
                )}
              </div>

              {/* 内容 */}
              <div className="space-y-2">
                <Label>内容</Label>
                <div className="w-full">
                  <BlockNoteEditor
                    initialContent={content}
                    onChange={handleContentChange}
                    placeholder="开始编写你的资源内容..."
                    editable={true}
                    onSave={handleAutoSave}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    支持上传图片(最大5MB)、视频(最大50MB)、音频(最大20MB)和压缩文件(zip、7z、tar等)
                  </p>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? '创建中...' : '创建资源'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 