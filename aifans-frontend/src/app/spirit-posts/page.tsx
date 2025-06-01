'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { spiritPostsApi, SpiritPost } from '@/lib/api/spirit-posts';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, Bell, MessageSquare, Lock, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';
import { CreateSpiritPostDialog } from './components/create-spirit-post-dialog';
import { Badge } from '@/components/ui/badge';
import { MembershipExclusiveDialog } from '@/components/ui/membership-exclusive-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { useSpiritPostsStore } from '@/lib/store/spirit-posts-store';
import Link from 'next/link';

type FilterType = 'all' | 'my-posts' | 'my-claims';

// 游客访问限制组件
function GuestAccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
      <div className="text-center max-w-md">
        <FileQuestion className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">需要登录才能访问</h1>
        <p className="text-gray-600 mb-6">
          灵贴页面需要登录后才能浏览。请先登录或注册账号。
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

export default function SpiritPostsPage() {
  const [posts, setPosts] = useState<SpiritPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const permissions = usePermissions();
  const { unreadCount, fetchUnreadCount } = useSpiritPostsStore();

  // 获取灵贴列表
  useEffect(() => {
    // 只有在用户登录后才获取列表
    if (user && isAuthenticated) {
      fetchPosts();
    }
  }, [user, filter, isAuthenticated]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let data: SpiritPost[] = [];
      
      switch (filter) {
        case 'all':
          data = await spiritPostsApi.getAll();
          break;
        case 'my-posts':
          data = await spiritPostsApi.getMyPosts();
          break;
        case 'my-claims':
          data = await spiritPostsApi.getMyClaimedPosts();
          break;
      }
      
      setPosts(data);
      
      // 计算总未读消息数
      let unreadTotal = 0;
      data.forEach(post => {
        if (post.unreadCount && post.unreadCount > 0) {
          unreadTotal += post.unreadCount;
        }
      });
      setTotalUnreadCount(unreadTotal);
      
      // 更新全局未读消息数
      fetchUnreadCount();
    } catch (error) {
      console.error('获取灵贴列表失败:', error);
      toast.error('获取灵贴列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 检查是否可以创建灵贴
  const canCreatePost = permissions.canCreateSpiritPost();

  // 检查访问权限
  if (!isAuthenticated || !user) {
    return <GuestAccessDenied />;
  }

  // 生成随机位置和旋转角度
  const getRandomStyle = (index: number) => {
    // 计算网格位置
    const columns = 4; // 每行4个便签
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    // 基础位置（网格布局）
    const baseX = (col * 25) + 12.5; // 25%的宽度间隔，12.5%的起始偏移
    const baseY = (row * 25) + 10; // 25%的高度间隔，10%的起始偏移
    
    // 添加随机偏移
    const randomOffsetX = (Math.random() - 0.5) * 8; // ±4%的随机偏移
    const randomOffsetY = (Math.random() - 0.5) * 6; // ±3%的随机偏移
    
    // 最终位置
    const x = Math.max(5, Math.min(95, baseX + randomOffsetX)); // 确保在5%-95%范围内
    const y = Math.max(5, Math.min(95, baseY + randomOffsetY)); // 确保在5%-95%范围内
    
    // 随机旋转角度
    const rotation = (Math.random() - 0.5) * 12; // -6deg to 6deg
    
    // 便签纸颜色
    const colors = [
      'bg-yellow-200', // 黄色
      'bg-pink-200',   // 粉红色
      'bg-blue-200',   // 粉蓝色
    ];
    const color = colors[index % colors.length];

    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      backgroundColor: color,
    };
  };

  const handlePostClick = (postId: number) => {
    if (user?.role === 'NORMAL') {
      setShowMemberDialog(true);
      return;
    }
    router.push(`/spirit-posts/${postId}`);
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    fetchPosts();
    toast.success('灵贴创建成功');
  };

  return (
    <>
      <style jsx global>{`
        .sticky-note {
          position: absolute;
          width: 180px;
          min-height: 180px;
          padding: 16px;
          box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Comic Sans MS', cursive, sans-serif;
        }
        
        .sticky-note::before {
          content: '';
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 20px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          filter: blur(10px);
        }
        
        .sticky-note:hover {
          transform: translate(-50%, -50%) scale(1.05) rotate(0deg) !important;
          box-shadow: 4px 4px 20px rgba(0, 0, 0, 0.2);
          z-index: 10;
        }
        
        .sticky-note-yellow {
          background: linear-gradient(135deg, #fff9c4 0%, #ffeb3b 100%);
        }
        
        .sticky-note-pink {
          background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
        }
        
        .sticky-note-blue {
          background: linear-gradient(135deg, #e1f5fe 0%, #81d4fa 100%);
        }
        
        .spirit-posts-container {
          position: relative;
          width: 100%;
          min-height: calc(100vh - 172px - 110px); /* 减去导航栏+页脚(172px) + 工具栏下移距离(110px) */
          height: calc(100vh - 172px - 110px); /* 设置固定高度 */
          margin-top: 110px; /* 为工具栏留出空间（40px高度 + 70px下移） */
          overflow-y: auto;
          overflow-x: hidden;
          background: transparent; /* 使用透明背景，继承页面背景色 */
          padding-top: 30px; /* 恢复较小的顶部padding */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        /* Chrome, Safari and Opera */
        .spirit-posts-container::-webkit-scrollbar {
          display: none;
        }
        
        .spirit-posts-wrapper {
          position: relative;
          width: 100%;
          min-height: 100%;
          padding-bottom: 50px;
        }
        
        .toolbar {
          position: fixed;
          top: 134px; /* 导航栏高度64px + 下移70px = 134px */
          left: 0;
          right: 0;
          background: transparent; /* 透明背景，继承页面背景色 */
          backdrop-filter: none; /* 移除模糊效果 */
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          z-index: 40; /* 降低z-index，避免遮挡导航栏 */
          padding: 6px 24px; /* 进一步减少padding高度 */
          height: 40px; /* 设置固定高度为40px */
        }
        
        .dark .toolbar {
          background: transparent; /* 暗色模式也使用透明背景 */
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .unread-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>

      {/* 固定工具栏 */}
      <div className="toolbar">
        <div className="container mx-auto flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              全部灵贴
            </Button>
            <Button
              variant={filter === 'my-claims' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('my-claims')}
              className="relative"
            >
              我认领的
              {unreadCount.myClaims > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount.myClaims > 99 ? '99+' : unreadCount.myClaims}
                </span>
              )}
            </Button>
            <Button
              variant={filter === 'my-posts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('my-posts')}
              className="relative"
            >
              我发布的
              {unreadCount.myPosts > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount.myPosts > 99 ? '99+' : unreadCount.myPosts}
                </span>
              )}
            </Button>
          </div>
          
          {/* 发布按钮 */}
          {canCreatePost ? (
            <Button
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              发布灵贴
            </Button>
          ) : user && (
            <Button
              size="sm"
              disabled
              title={permissions.getPermissionDeniedMessage("发布灵贴")}
            >
              <Lock className="mr-2 h-4 w-4" />
              发布灵贴
            </Button>
          )}
        </div>
      </div>

      <div className="spirit-posts-container">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-xl">加载中...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-xl mb-4">
              {filter === 'my-posts' ? '您还没有发布过灵贴' :
               filter === 'my-claims' ? '您还没有认领过灵贴' :
               '暂无灵贴'}
            </p>
            {filter !== 'my-claims' && (
              canCreatePost ? (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  创建灵贴
                </Button>
              ) : user && (
                <Button 
                  disabled
                  title={permissions.getPermissionDeniedMessage("发布灵贴")}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  创建灵贴
                </Button>
              )
            )}
          </div>
        ) : (
          <div className="spirit-posts-wrapper">
            {posts.map((post, index) => {
              const style = getRandomStyle(index);
              const colorClass = style.backgroundColor === 'bg-yellow-200' ? 'sticky-note-yellow' :
                               style.backgroundColor === 'bg-pink-200' ? 'sticky-note-pink' :
                               'sticky-note-blue';
              
              return (
                <div
                  key={post.id}
                  className={`sticky-note ${colorClass}`}
                  style={{
                    left: style.left,
                    top: style.top,
                    transform: style.transform,
                  }}
                  onClick={() => handlePostClick(post.id)}
                >
                  {/* 未读消息提示 */}
                  {post.unreadCount > 0 && (
                    <div className="unread-badge">{post.unreadCount}</div>
                  )}
                  
                  <h3 className="text-lg font-bold mb-2 text-gray-800 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="truncate">{post.user.nickname || post.user.username}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                    {post._count && post._count.claims > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        <span>{post._count.claims} 人认领中</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateDialog && (
        <CreateSpiritPostDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleCreateSuccess}
        />
      )}

      <MembershipExclusiveDialog open={showMemberDialog} onOpenChange={setShowMemberDialog} />
    </>
  );
} 