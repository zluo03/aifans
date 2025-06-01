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

export default function EditResourcePage() {
  const router = useRouter();
  const params = useParams();
  const { user, token, isLoading: authLoading } = useAuthStore();
  const [resource, setResource] = useState<Resource | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const resourceId = params.id as string;

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

      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片大小不能超过5MB');
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
    // 直接获取资源和分类，不进行严格的权限检查
    // 因为编辑按钮本身就有权限控制，只有管理员才能看到
    fetchResource();
    fetchCategories();
  }, [resourceId]);

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
    } finally {
      setPageLoading(false);
    }
  };

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
      if (!token) {
        toast.error('请先登录');
        return;
      }
      
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          coverImageUrl: coverImageUrl.trim() || undefined,
          categoryId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新资源失败');
      }

      const data = await response.json();
      toast.success('资源更新成功');
      router.push(`/resources/${data.id}`);
    } catch (error) {
      console.error('更新资源失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error(`更新资源失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 移除严格的权限检查，因为编辑按钮本身就有权限控制

  if (pageLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden content-scrollbar">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden content-scrollbar">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">资源不存在</h3>
                <p className="text-gray-500 mb-4">您要编辑的资源可能已被删除或不存在</p>
                <Button onClick={() => router.push('/resources')}>
                  返回资源列表
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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