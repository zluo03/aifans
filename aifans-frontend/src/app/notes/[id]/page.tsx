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
import { AuthWrapper } from '@/components/auth-wrapper';

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

// 笔记详情内容组件
function NoteDetailContent() {
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
    if (user && user.role === 'NORMAL') {
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
            {/* 返回按钮 */}
            <div className="mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/notes')}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                返回笔记列表
              </Button>
            </div>
            
            {/* 标题和作者信息 */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{note.title}</h1>
              <div className="flex items-center text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-muted overflow-hidden mr-2">
                    {note.user.avatarUrl ? (
                      <Image
                        src={note.user.avatarUrl}
                        alt={note.user.nickname || note.user.username}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {(note.user.nickname || note.user.username)[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span>{note.user.nickname || note.user.username}</span>
                </div>
                <span className="mx-2">•</span>
                <span>
                  {formatDistanceToNow(new Date(note.createdAt), {
                    addSuffix: true,
                    locale: zhCN
                  })}
                </span>
                {note.category && (
                  <>
                    <span className="mx-2">•</span>
                    <Badge variant="outline" className="text-xs">
                      {note.category.name}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            {/* 封面图片 */}
            {note.coverImageUrl && (
              <div className="mb-6">
                <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
                  <Image
                    src={note.coverImageUrl}
                    alt={note.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* 笔记内容 */}
            <div className="prose prose-sm md:prose-base max-w-none mb-8">
              {note.content ? (
                <BlockNoteViewer content={note.content} />
              ) : (
                <p className="text-muted-foreground">此笔记没有内容</p>
              )}
            </div>
            
            {/* 交互按钮 */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className="flex items-center gap-2"
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                {isLiked ? '已点赞' : '点赞'} ({note.likesCount || 0})
              </Button>
              
              <Button
                variant={isFavorited ? "default" : "outline"}
                size="sm"
                onClick={handleFavorite}
                className="flex items-center gap-2"
              >
                <BookmarkIcon className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                {isFavorited ? '已收藏' : '收藏'} ({note.favoritesCount || 0})
              </Button>
              
              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    编辑
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 笔记详情页面组件
export default function NoteDetailPage() {
  return (
    <AuthWrapper 
      requiredRole="PREMIUM" 
      showToast={false}
      loadingFallback={
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
      }
    >
      <NoteDetailContent />
    </AuthWrapper>
  );
} 