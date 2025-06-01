'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { screeningsApi } from '@/lib/api';
import { Screening } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Send, Clock, Eye, User } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuthStore } from '@/lib/store/auth-store';
import { ScreeningComment } from '@/lib/api/screenings';
import { Separator } from '@/components/ui/separator';
import { Danmaku } from '@/components/screenings/danmaku';

export default function ScreeningDetailPage() {
  const [screening, setScreening] = useState<Screening | null>(null);
  const [comments, setComments] = useState<ScreeningComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const id = Number(params.id);

  useEffect(() => {
    const fetchScreening = async () => {
      setLoading(true);
      try {
        const data = await screeningsApi.getScreening(id);
        setScreening(data);
        setIsLiked(data.isLiked || false);
      } catch (error) {
        console.error('Error fetching screening:', error);
        toast.error('获取放映视频失败');
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        const data = await screeningsApi.getComments(id);
        setComments(data);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error('获取评论失败');
      } finally {
        setCommentsLoading(false);
      }
    };

    if (id && user) {
      fetchScreening();
      fetchComments();
    } else if (!user) {
      router.push('/signin');
    }
  }, [id, user, router]);

  const handleLike = async () => {
    if (!user) {
      toast.error('请先登录');
      router.push('/signin');
      return;
    }

    try {
      const result = await screeningsApi.toggleLike(id);
      setIsLiked(result.liked);
      
      // 更新点赞数
      if (screening) {
        setScreening({
          ...screening,
          likesCount: result.liked ? screening.likesCount + 1 : screening.likesCount - 1
        });
      }
      
      toast.success(result.liked ? '点赞成功' : '已取消点赞');
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('操作失败');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('评论内容不能为空');
      return;
    }
    
    if (!user) {
      toast.error('请先登录');
      router.push('/signin');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const comment = await screeningsApi.addComment(id, newComment);
      setComments([...comments, comment]);
      setNewComment('');
      
      // 滚动到评论区底部
      if (commentsContainerRef.current) {
        commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
      }
      
      toast.success('评论已发送');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('发送评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-[400px] w-full mb-6" />
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!screening) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-2">放映视频不存在</h1>
        <p className="text-muted-foreground mb-4">该视频可能已被删除或您没有权限查看</p>
        <Button asChild>
          <Link href="/screenings">返回放映列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link href="/screenings" className="text-sm text-muted-foreground hover:underline">
            ← 返回放映列表
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-4">{screening.title}</h1>
        
        <div className="mb-6">
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={screening.videoUrl}
              controls
              className="w-full"
              poster={screening.thumbnailUrl}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant={isLiked ? "secondary" : "outline"} 
              size="sm"
              onClick={handleLike}
              className={isLiked ? "bg-pink-100" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-pink-500 text-pink-500" : ""}`} />
              {screening.likesCount} 赞
            </Button>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Eye className="h-4 w-4 mr-1" />
              {screening.viewsCount} 次观看
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <Clock className="h-4 w-4 inline mr-1" />
            {formatDistanceToNow(new Date(screening.createdAt), { addSuffix: true, locale: zhCN })}
          </div>
        </div>
        
        {screening.description && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">视频描述</h2>
            <p className="text-muted-foreground whitespace-pre-line">{screening.description}</p>
          </div>
        )}
        
        <div className="flex items-center mb-6">
          <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2">
            <Image
              src={(screening as any).creator?.avatarUrl || '/images/default-avatar.png'}
              alt={(screening as any).creator?.nickname || '未知创作者'}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {(screening as any).creator?.nickname || '未知创作者'}
            </span>
            {(screening as any).creator && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                创作者
              </span>
            )}
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">评论区</h2>
          
          {commentsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div 
                ref={commentsContainerRef}
                className="space-y-4 max-h-[400px] overflow-y-auto mb-6"
              >
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="relative h-8 w-8 rounded-full overflow-hidden">
                        <Image
                          src={comment.user.avatarUrl || '/images/default-avatar.png'}
                          alt={comment.user.nickname}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{comment.user.nickname}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: zhCN })}
                          </span>
                        </div>
                        <p className="mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">暂无评论，快来发表第一条评论吧</p>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleAddComment} className="flex space-x-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="发表评论..."
                  className="flex-1"
                />
                <Button type="submit" disabled={submitting}>
                  {submitting ? '发送中...' : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 