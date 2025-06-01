'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notesApi } from '@/lib/api';
import { Note, NoteStatus } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Heart, BookmarkIcon, Eye, Edit, Trash2, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuthStore } from '@/lib/store/auth-store';
import dynamic from 'next/dynamic';

// 使用优化的BlockNote查看器
const BlockNoteViewer = dynamic(
  () => import('@/components/editor/block-note-viewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    )
  }
);

export default function NoteDetailPage() {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const id = Number(params.id);

  // 权限检查
  useEffect(() => {
    if (!user) {
      toast.error('请先登录');
      router.push('/login');
      return;
    }

    if (user.role === 'NORMAL') {
      toast.error('普通用户无法查看笔记详情');
      router.push('/notes');
      return;
    }
  }, [user, router]);

  // 获取笔记数据
  useEffect(() => {
    const fetchNote = async () => {
      setLoading(true);
      try {
        const data = await notesApi.getNote(id);
        console.log('获取到的笔记数据:', {
          id: data.id,
          title: data.title,
          content: data.content,
          contentType: typeof data.content,
          contentLength: data.content ? data.content.length : 0,
          coverImageUrl: data.coverImageUrl
        });
        setNote(data);
        setIsLiked(data.isLiked || false);
        setIsFavorited(data.isFavorited || false);
      } catch (error) {
        console.error('Error fetching note:', error);
        toast.error('获取笔记失败');
      } finally {
        setLoading(false);
      }
    };

    // 只有非普通用户才能获取笔记详情
    if (id && user && user.role !== 'NORMAL') {
      fetchNote();
    }
  }, [id, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error('请先登录');
      router.push('/signin');
      return;
    }

    try {
      const result = await notesApi.toggleLike(id);
      setIsLiked(result.liked);
      
      // 更新点赞数
      if (note) {
        setNote({
          ...note,
          likesCount: result.liked ? note.likesCount + 1 : note.likesCount - 1
        });
      }
      
      toast.success(result.liked ? '点赞成功' : '已取消点赞');
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('操作失败');
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      toast.error('请先登录');
      router.push('/signin');
      return;
    }

    try {
      const result = await notesApi.toggleFavorite(id);
      setIsFavorited(result.favorited);
      
      // 更新收藏数
      if (note) {
        setNote({
          ...note,
          favoritesCount: result.favorited ? note.favoritesCount + 1 : note.favoritesCount - 1
        });
      }
      
      toast.success(result.favorited ? '收藏成功' : '已取消收藏');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('操作失败');
    }
  };

  const handleEdit = () => {
    router.push(`/notes/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这篇笔记吗？')) {
      return;
    }

    try {
      await notesApi.deleteNote(id);
      toast.success('笔记删除成功');
      router.push('/notes');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">笔记不存在</h1>
          <p className="text-muted-foreground mb-6">您要查看的笔记可能已被删除或不存在。</p>
          <Button onClick={() => router.push('/notes')}>
            返回笔记列表
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === note.userId;

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
                onClick={() => router.push('/notes')}
                className="flex items-center gap-2 hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" />
                返回笔记列表
              </Button>
            </div>

            {/* 封面图片 - 完全无边框，独立显示 */}
            {note.coverImageUrl && (
              <div className="relative w-full h-64 mb-8 rounded-lg overflow-hidden">
                <Image
                  src={note.coverImageUrl}
                  alt={note.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* 内容区域 - 背景色与页面相同 */}
            <div className="space-y-8">
              {/* 标题和元信息 */}
              <div>
                <h1 className="text-3xl font-bold mb-4">{note.title}</h1>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>作者：{note.user.nickname || note.user.username}</span>
                  </div>
                  {note.category && (
                    <Badge variant="outline" className="text-xs">
                      {note.category.name}
                    </Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <span>发布于：{formatDistanceToNow(new Date(note.createdAt), { locale: zhCN, addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{note.viewsCount || 0}</span>
                  </div>
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-1 hover:scale-110 transition-transform duration-200"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        isLiked 
                          ? 'fill-red-500 text-red-500' 
                          : 'fill-none text-muted-foreground hover:text-red-400'
                      }`}
                    />
                    <span className={`transition-colors ${
                      isLiked 
                        ? 'text-red-500' 
                        : 'text-muted-foreground hover:text-red-400'
                    }`}>
                      {note.likesCount || 0}
                    </span>
                  </button>
                  <button
                    onClick={handleFavorite}
                    className="flex items-center gap-1 hover:scale-110 transition-transform duration-200"
                  >
                    <BookmarkIcon
                      className={`h-4 w-4 transition-colors ${
                        isFavorited 
                          ? 'fill-yellow-500 text-yellow-500' 
                          : 'fill-none text-muted-foreground hover:text-yellow-400'
                      }`}
                    />
                    <span className={`transition-colors ${
                      isFavorited 
                        ? 'text-yellow-500' 
                        : 'text-muted-foreground hover:text-yellow-400'
                    }`}>
                      {note.favoritesCount || 0}
                    </span>
                  </button>
                </div>
              </div>

              {/* 笔记内容 */}
              <div>
                <BlockNoteViewer content={note.content} />
              </div>

              {/* 操作按钮区域 */}
              <div className="flex justify-between items-center p-6 border-t bg-card/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/notes')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    返回列表
                  </Button>
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                      className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                      编辑
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      className="flex items-center gap-2 bg-red-400 hover:bg-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      删除
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 