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
import { api } from '@/lib/api/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import { NoteCategory } from '@/types';
import Link from 'next/link';
import { FileUpload } from '@/components/ui/file-upload';
import dynamic from 'next/dynamic';
import { usePermissions } from '@/hooks/use-permissions';
import { getUploadLimit } from "@/lib/utils/upload-limits";

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

      // 获取笔记模块的上传限制
      let maxSizeMB = 5; // 默认值
      try {
        const limit = await getUploadLimit('notes');
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
      
      // 从认证store获取token
      const { token } = useAuthStore.getState();
      console.log('Token存在:', !!token);

      if (!token) {
        toast.error('请先登录');
        return [{ url: '', key: '' }];
      }

      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'notes/covers');

      let response;
      let successfulUpload = false;
      
      // 尝试方法1：使用api实例上传
      try {
        console.log('尝试方法1：使用api实例上传');
        response = await api.post('/storage/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('方法1上传成功:', response.data);
        successfulUpload = true;
      } catch (uploadErr) {
        console.error('方法1上传失败:', uploadErr);
        
        // 尝试方法2：使用fetch直接上传
        try {
          console.log('尝试方法2：使用fetch直接上传');
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const fetchResponse = await fetch(`${baseUrl}/api/storage/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData,
            credentials: 'include'
          });
          
          console.log('fetch响应状态:', fetchResponse.status);
          const responseText = await fetchResponse.text();
          console.log('fetch响应内容:', responseText);
          
          if (fetchResponse.ok) {
            response = { data: JSON.parse(responseText) };
            console.log('方法2上传成功:', response.data);
            successfulUpload = true;
          } else {
            throw new Error(`Fetch上传失败: ${fetchResponse.status}, ${responseText}`);
          }
        } catch (fetchErr) {
          console.error('方法2上传失败:', fetchErr);
          
          // 尝试方法3：使用相对路径
          try {
            console.log('尝试方法3：使用相对路径');
            const fetchResponse = await fetch('/api/storage/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            });
            
            console.log('方法3响应状态:', fetchResponse.status);
            const responseText = await fetchResponse.text();
            console.log('方法3响应内容:', responseText);
            
            if (fetchResponse.ok) {
              response = { data: JSON.parse(responseText) };
              console.log('方法3上传成功:', response.data);
              successfulUpload = true;
            } else {
              throw new Error(`相对路径上传失败: ${fetchResponse.status}, ${responseText}`);
            }
          } catch (relativeErr) {
            console.error('方法3上传失败:', relativeErr);
            throw relativeErr; // 所有方法都失败，抛出最后一个错误
          }
        }
      }
      
      if (!successfulUpload || !response || !response.data) {
        throw new Error('所有上传尝试均失败');
      }
      
      // 设置封面URL
      setCoverImageUrl(response.data.url);
      toast.success(`封面图片上传成功`);
      return [response.data];
    } catch (error) {
      console.error('上传错误:', error);
      const errorMessage = error instanceof Error ? error.message : 
                          (typeof error === 'object' ? JSON.stringify(error) : String(error));
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