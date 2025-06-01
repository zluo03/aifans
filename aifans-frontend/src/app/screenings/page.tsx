"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Danmaku } from '@/components/screenings/danmaku';
import { Film, Heart, MessageCircle, Play, User, Calendar, Eye } from 'lucide-react';
import Link from 'next/link';
import './screenings.css';

interface Screening {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  duration?: number;
  viewCount: number;
  likeCount: number;
  isLiked: boolean;
  adminUploader?: {
    username: string;
  };
  creator?: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: number;
  content: string;
  timestamp?: number;
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

// 游客访问提示组件
function GuestAccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
      <div className="text-center max-w-md">
        <Film className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">需要登录才能访问</h1>
        <p className="text-gray-600 mb-6">
          影院功能需要登录后才能使用，请先登录或注册账号。
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/login">登录</Link>
          </Button>
          <Button asChild>
            <Link href="/register">注册</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ScreeningsPage() {
  const { isAuthenticated, token } = useAuthStore();
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [currentScreening, setCurrentScreening] = useState<Screening | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 简单的认证检查 - 给一点时间让认证状态稳定
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
    }, 500); // 给更多时间让认证状态稳定
    
    return () => clearTimeout(timer);
  }, []);

  // 获取影院列表
  useEffect(() => {
    if (authChecked && isAuthenticated) {
      fetchScreenings();
    }
  }, [authChecked, isAuthenticated]);

  const fetchScreenings = async () => {
    try {
      // 构建请求头
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // 如果有token，添加Authorization header
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/screenings', {
        method: 'GET',
        credentials: 'include', // 确保携带cookies
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        // API返回的数据结构是 { screenings: [...], meta: {...} }
        const screeningsList = Array.isArray(data.screenings) ? data.screenings : [];
        setScreenings(screeningsList);
        if (screeningsList.length > 0) {
          setCurrentScreening(screeningsList[0]);
          // 获取第一个影片的评论
          fetchComments(screeningsList[0].id);
        }
      } else {
        const errorData = await response.json();
        console.error('获取影院列表失败:', response.status, response.statusText, errorData);
        setScreenings([]);
      }
    } catch (error) {
      console.error('获取影院列表失败:', error);
      setScreenings([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取评论
  const fetchComments = async (screeningId: string) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/screenings/${screeningId}/comments`, {
        credentials: 'include',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('获取评论失败:', error);
    }
  };

  // 切换影片
  const handleScreeningSelect = (screening: Screening) => {
    setCurrentScreening(screening);
    fetchComments(screening.id);
  };

  // 点赞功能
  const handleLike = async (screeningId: string) => {
    try {
      console.log('=== 前端点赞调试信息 ===');
      console.log('当前token:', token ? token.substring(0, 50) + '...' : 'null');
      console.log('isAuthenticated:', isAuthenticated);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('设置Authorization头:', `Bearer ${token.substring(0, 50)}...`);
      } else {
        console.log('没有token，无法设置Authorization头');
      }
      
      const response = await fetch(`/api/screenings/${screeningId}/like`, {
        method: 'POST',
        credentials: 'include',
        headers
      });
      if (response.ok) {
        // 更新当前影片的点赞状态
        if (currentScreening?.id === screeningId) {
          setCurrentScreening(prev => prev ? {
            ...prev,
            isLiked: !prev.isLiked,
            likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1
          } : null);
        }
        // 更新列表中的点赞状态
        setScreenings(prev => prev.map(s => 
          s.id === screeningId 
            ? { ...s, isLiked: !s.isLiked, likeCount: s.isLiked ? s.likeCount - 1 : s.likeCount + 1 }
            : s
        ));
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // 发送弹幕
  const handleSendComment = async () => {
    if (!newComment.trim() || !currentScreening) return;

    try {
      console.log('=== 前端弹幕调试信息 ===');
      console.log('当前token:', token ? token.substring(0, 50) + '...' : 'null');
      console.log('isAuthenticated:', isAuthenticated);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('设置Authorization头:', `Bearer ${token.substring(0, 50)}...`);
      } else {
        console.log('没有token，无法设置Authorization头');
      }
      
      const response = await fetch(`/api/screenings/${currentScreening.id}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          content: newComment,
          timestamp: videoRef.current?.currentTime || 0,
        }),
      });

      if (response.ok) {
        setNewComment('');
        fetchComments(currentScreening.id);
      }
    } catch (error) {
      console.error('发送弹幕失败:', error);
    }
  };

  // 所有hooks调用完成后，再进行条件渲染
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Film className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果用户未登录，显示访问提示
  if (!isAuthenticated) {
    return <GuestAccessDenied />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Film className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] bg-white overflow-hidden">
      <div className="flex flex-col h-full p-6 space-y-6">
        {/* 上方：播放器和影片列表 */}
        <div className="flex space-x-6 h-3/4">
          {/* 左侧：播放器区域 */}
          <div className="flex-1">
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative h-full shadow-lg">
              {currentScreening ? (
                <>
                  <video
                    ref={videoRef}
                    src={currentScreening.videoUrl}
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-full object-contain"
                    poster={currentScreening.thumbnailUrl || undefined}
                  />
                  <Danmaku
                    comments={comments}
                    isFullscreen={isFullscreen}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>选择一个影片开始观看</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：影片列表 */}
          <div className="w-[480px] bg-gradient-to-br from-indigo-100 to-pink-100 rounded-xl relative overflow-hidden shadow-lg">
            {/* 上方渐变和滚动按钮 */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-indigo-100 to-transparent rounded-t-xl z-10 pointer-events-none"></div>
            <button 
              onClick={() => {
                const container = document.getElementById('screenings-list');
                if (container) container.scrollBy({ top: -200, behavior: 'smooth' });
              }}
              className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            
            {/* 下方渐变和滚动按钮 */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-pink-100 to-transparent rounded-b-xl z-10 pointer-events-none"></div>
            <button 
              onClick={() => {
                const container = document.getElementById('screenings-list');
                if (container) container.scrollBy({ top: 200, behavior: 'smooth' });
              }}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div id="screenings-list" className="grid grid-cols-2 overflow-y-auto h-full p-4 scrollbar-hide" style={{ gap: '12px', gridAutoRows: 'min-content' }}>
              {screenings.filter(screening => screening.id !== currentScreening?.id).map((screening) => (
                <div
                  key={screening.id}
                  className="bg-gray-200 relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105"
                  style={{ 
                    margin: 0, 
                    padding: 0, 
                    aspectRatio: '16/9',
                    width: '100%'
                  }}
                  onClick={() => handleScreeningSelect(screening)}
                >
                  {screening.thumbnailUrl ? (
                    <img
                      src={screening.thumbnailUrl}
                      alt={screening.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Film className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  {/* 影片名称覆盖在图片上 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <h3 className="text-white text-sm font-medium line-clamp-2">
                      {screening.title}
                    </h3>
                  </div>
                </div>
              ))}
              
              {screenings.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-500">
                  <Film className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>暂无影片</p>
                  <p className="text-sm mt-2">管理员可在后台上传影片</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 下方：影片信息和弹幕输入区域 */}
        <div className="flex-1 min-h-0">
          {currentScreening ? (
            <div className="w-full bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200 rounded-lg p-4 h-full overflow-y-auto shadow-lg">
              <div className="space-y-3">
                {/* 标题和信息在一行 */}
                <div className="flex items-end justify-between">
                  <h1 className="text-xl font-bold text-gray-900 flex-1 mr-4">
                    {currentScreening.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{currentScreening.creator?.nickname || currentScreening.adminUploader?.username || '管理员'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(currentScreening.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{currentScreening.viewCount} 次观看</span>
                    </div>
                    <Button
                      variant={currentScreening.isLiked ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleLike(currentScreening.id)}
                      className="flex items-center gap-2"
                    >
                      <Heart className={`h-4 w-4 ${currentScreening.isLiked ? 'fill-current' : ''}`} />
                      <span>{currentScreening.likeCount}</span>
                    </Button>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {comments.length} 条弹幕
                    </Badge>
                  </div>
                </div>

                {/* 描述 */}
                {currentScreening.description && (
                  <p className="text-gray-700 text-sm">{currentScreening.description}</p>
                )}

                {/* 弹幕输入 */}
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="发送弹幕..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                    className="flex-[5]"
                  />
                  <Button 
                    onClick={handleSendComment} 
                    disabled={!newComment.trim()}
                    className="flex-[2] bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    发送弹幕
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200 rounded-lg p-4 h-full flex items-center justify-center shadow-lg">
              <div className="text-center text-gray-500">
                <Film className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>选择影片查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}