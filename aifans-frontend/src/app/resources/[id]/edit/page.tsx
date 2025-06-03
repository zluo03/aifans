'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ArrowLeft } from 'lucide-react';
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

interface Resource {
  id: number;
  title: string;
  content: any;
  coverImageUrl?: string;
  categoryId: number;
  category: {
    id: number;
    name: string;
  };
}

interface ResourceEditPageProps {
  params: {
    id?: string;
  };
}

export default function ResourceEditPage({ params }: ResourceEditPageProps) {
  const router = useRouter();
  const { token } = useAuthStore();
  const [resource, setResource] = useState<Resource | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const resourceId = params?.id as string;

  // 检查用户是否为管理员
  useEffect(() => {
    const checkAdminStatus = async () => {
      setCheckingAuth(true);
      console.log('开始验证管理员权限...');
      
      // 如果没有token，直接重定向到首页
      if (!token) {
        console.log('未找到认证令牌，重定向到首页');
        toast.error('请先登录');
        router.push('/');
        return;
      }
      
      try {
        // 确保token格式正确
        const formattedToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`;
        console.log('认证令牌状态:', !!formattedToken);
        
        // 直接从用户对象判断是否为管理员
        const { user } = useAuthStore.getState();
        if (user && user.role === 'ADMIN') {
          console.log('用户已是管理员，跳过API验证');
          setIsAdmin(true);
          setCheckingAuth(false);
          return;
        }
        
        console.log('调用API验证管理员权限...');
        const response = await fetch('/api/check-admin', {
          headers: {
            'Authorization': formattedToken
          },
          cache: 'no-cache'
        });
        
        console.log('API响应状态:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP错误 ${response.status}` }));
          console.error('验证失败详情:', errorData);
          throw new Error(errorData.error || '验证管理员权限失败');
        }
        
        const data = await response.json();
        console.log('验证结果:', data);
        
        if (!data.isAdmin) {
          console.log('用户不是管理员，重定向到首页');
          toast.error('您没有权限访问此页面');
          router.push('/');
          return;
        }
        
        console.log('验证成功，用户是管理员');
        setIsAdmin(true);
      } catch (error) {
        console.error('验证管理员权限失败:', error);
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
    console.log('自动保存内容:', content);
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
        console.warn('获取上传限制失败，使用默认值', limitError);
      }

      // 验证文件大小
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`图片大小不能超过${maxSizeMB}MB`);
        return [{ url: '', key: '' }];
      }

      console.log('准备上传文件:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'resources/covers');

      if (!token) {
        toast.error('请先登录');
        return [{ url: '', key: '' }];
      }

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('响应状态:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: '服务器响应错误', details: `HTTP ${response.status}` };
        }
        console.error('上传失败详情:', errorData);
        const errorMessage = errorData.error || '未知错误';
        const errorDetails = errorData.details ? ` (${errorData.details})` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      const result = await response.json();
      console.log('上传成功结果:', result);
      
      // 设置封面URL
      setCoverImageUrl(result.url);
      toast.success(`封面图片上传成功`);
      return [result];
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error(`封面图片上传失败: ${errorMessage}`);
      return [{ url: '', key: '' }];
    }
  }, [token]);

  useEffect(() => {
    // 只有在确认为管理员后才获取分类和资源数据
    if (isAdmin && resourceId) {
      fetchCategories();
      fetchResource();
    }
  }, [isAdmin, resourceId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/resource-categories');
      if (!response.ok) {
        throw new Error('获取分类失败');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('获取分类失败:', error);
      toast.error('获取分类失败');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchResource = async () => {
    try {
      const response = await fetch(`/api/resources/${resourceId}`);
      if (!response.ok) {
        throw new Error('获取资源失败');
      }
      const data = await response.json();
      setResource(data);
      
      // 填充表单数据
      setTitle(data.title);
      setContent(typeof data.content === 'string' ? data.content : JSON.stringify(data.content));
      setCoverImageUrl(data.coverImageUrl || '');
      setCategoryId(data.category.id);
    } catch (error) {
      console.error('获取资源失败:', error);
      toast.error('获取资源失败');
      router.push('/resources');
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
        console.error('获取localStorage中的token失败:', error);
      }
      
      if (!authToken) {
        toast.error('请先登录');
        return;
      }
      
      // 确保token格式正确
      const formattedToken = authToken?.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'PUT',
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
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP错误 ${response.status}` }));
        throw new Error(errorData.message || '更新资源失败');
      }

      toast.success('资源更新成功');
      router.push(`/resources/${resourceId}`);
    } catch (error) {
      console.error('更新资源失败:', error);
      toast.error(error instanceof Error ? error.message : '更新资源失败');
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
      {/* 滚动内容区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden content-scrollbar">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* 顶部返回按钮 */}
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/resources/${resourceId}`)}
                className="flex items-center gap-2 hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" />
                返回资源详情
              </Button>
            </div>

            {/* 页面标题 */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold">编辑资源</h1>
              <p className="text-gray-500 mt-2">修改资源信息和内容</p>
            </div>

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                {/* 标题 */}
                <div className="space-y-2">
                  <Label htmlFor="title">标题 *</Label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入资源标题"
                    required
                    className="text-base"
                  />
                </div>

                {/* 分类 */}
                <div className="space-y-2">
                  <Label>分类 *</Label>
                  <Select 
                    value={categoryId?.toString() || ''} 
                    onValueChange={(value) => setCategoryId(parseInt(value))}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={categoriesLoading ? "加载中..." : "选择分类"} />
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
                      <p className="text-sm text-muted-foreground mb-2">当前封面：</p>
                      <img 
                        src={coverImageUrl} 
                        alt="封面预览" 
                        className="max-w-xs rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                {/* 内容编辑器 */}
                <div className="space-y-2">
                  <Label>内容 *</Label>
                  <BlockNoteEditor
                    initialContent={content}
                    onChange={handleContentChange}
                    placeholder="开始编写资源内容..."
                    editable={true}
                    onSave={handleAutoSave}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    支持上传图片(最大5MB)、视频(最大50MB)、音频(最大20MB)和压缩文件(zip、7z、tar等)
                  </p>
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/resources/${resourceId}`)}
                    disabled={loading}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? '保存中...' : '保存更改'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 