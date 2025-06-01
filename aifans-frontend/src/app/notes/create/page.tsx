'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notesApi } from '@/lib/api';
import { noteCategoriesApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import { NoteCategory } from '@/types';
import Link from 'next/link';
import { FileUpload } from '@/components/ui/file-upload';
import dynamic from 'next/dynamic';
import { usePermissions } from '@/hooks/use-permissions';

// 动态导入BlockNote编辑器，禁用SSR
const BlockNoteEditor = dynamic(
  () => import('@/components/editor/block-note-editor'),
  { 
    ssr: false,
    loading: () => <div className="border rounded-lg p-4 min-h-[400px] flex items-center justify-center">加载编辑器...</div>
  }
);

export default function CreateNotePage() {
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  
  const { user } = useAuthStore();
  const router = useRouter();
  const permissions = usePermissions();

  // 将useCallback移到组件顶层
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleAutoSave = useCallback((content: string) => {
    // 可选：自动保存功能
    console.log('自动保存内容:', content);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await noteCategoriesApi.getAllCategories();
        setCategories(categoriesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('获取分类失败');
        setLoading(false);
      }
    };

    if (!user) {
      router.push('/login');
      return;
    }

    if (!permissions.canCreateNote()) {
      toast.error(permissions.getPermissionDeniedMessage("创建笔记"));
      router.push('/notes');
      return;
    }

    fetchCategories();
  }, [user, router]);

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
        formData.append('folder', 'notes/covers');

      // 从认证store获取token
      const { token } = useAuthStore.getState();
        console.log('Token存在:', !!token);

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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 权限检查
    if (!permissions.canCreateNote()) {
      toast.error(permissions.getPermissionDeniedMessage("创建笔记"));
      return;
    }
    
    if (!title.trim()) {
      toast.error('请输入标题');
      return;
    }
    
    if (!categoryId) {
      toast.error('请选择分类');
      return;
    }
    
    // 添加调试日志
    console.log('提交时的内容:', {
      title,
      content,
      contentLength: content.length,
      categoryId: parseInt(categoryId),
      coverImageUrl
    });
    
    setLoadingAction(true);
    
    try {
      const payload = {
        title,
        content,
        categoryId: parseInt(categoryId),
        coverImageUrl: coverImageUrl || undefined
      };
      
      console.log('发送的payload:', payload);
      
      const newNote = await notesApi.createNote(payload);
      toast.success('笔记已创建');
      router.push(`/notes/${newNote.id}`);
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('创建笔记失败');
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden">
        <div className="p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-6" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 content-scrollbar">
          <div className="max-w-4xl mx-auto pb-6">
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-[300px] w-full" />
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden">
      {/* 头部区域 */}
      <div className="p-4 flex-shrink-0">
      <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">创建笔记</h1>
          <Button variant="outline" asChild>
            <Link href="/notes">取消</Link>
          </Button>
          </div>
        </div>
        </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 content-scrollbar">
        <div className="max-w-4xl mx-auto pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                placeholder="输入笔记标题"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
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

            <div className="space-y-2">
              <Label>内容</Label>
                <div className="w-full">
                  <BlockNoteEditor
                    initialContent={content}
                    onChange={handleContentChange}
                    placeholder="开始编写你的笔记..."
                    editable={true}
                    onSave={handleAutoSave}
              />
                </div>
            </div>

              <div className="flex justify-end gap-4 pt-6">
              <Button
                type="submit"
                disabled={loadingAction}
              >
                {loadingAction ? '创建中...' : '创建笔记'}
              </Button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
} 