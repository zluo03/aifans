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
    // 直接获取分类，不进行严格的权限检查
    // 因为创建按钮本身就有权限控制，只有管理员才能看到
    fetchCategories();
  }, []);

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
      
      const response = await fetch('/api/resources', {
        method: 'POST',
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
        throw new Error(errorData.message || '创建资源失败');
      }

      const data = await response.json();
      toast.success('资源创建成功');
      router.push(`/resources/${data.id}`);
    } catch (error) {
      console.error('创建资源失败:', error);
      toast.error(error instanceof Error ? error.message : '创建资源失败');
    } finally {
      setLoading(false);
    }
  };

  // 移除严格的权限检查，因为创建按钮本身就有权限控制

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