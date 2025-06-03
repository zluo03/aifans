'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  Bookmark, 
  Eye, 
  Calendar, 
  User, 
  ArrowLeft,
  Share2,
  Lock,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { processUploadImageUrl } from "@/lib/utils/image-url";

// 动态导入BlockNote查看器，禁用SSR
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

interface Resource {
  id: number;
  title: string;
  content: any;
  coverImageUrl?: string;
  likesCount: number;
  favoritesCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    nickname: string;
    avatarUrl?: string;
  };
  category: {
    id: number;
    name: string;
  };
}

interface UserInteractions {
  liked: boolean;
  favorited: boolean;
}

export default function ResourceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { token } = useAuthStore();
  const [resource, setResource] = useState<Resource | null>(null);
  const [interactions, setInteractions] = useState<UserInteractions>({
    liked: false,
    favorited: false,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  const resourceId = params?.id as string;

  useEffect(() => {
    console.log('=== 资源详情页面权限检查 ===');
    
    // 等待认证状态加载完成
    if (authLoading) {
      console.log('认证状态加载中，等待...');
      return;
    }

    // 检查用户是否登录
    if (!isAuthenticated || !user) {
      console.log('用户未登录，跳转到登录页面');
      toast.error('请先登录');
      router.push('/login');
      return;
    }

    console.log('当前用户信息:', { id: user.id, role: user.role, status: user.status });

    // 检查用户角色：普通用户无权访问
    if (user.role === 'NORMAL') {
      console.log('普通用户无权限访问资源详情');
      toast.error('此功能需要升级会员才能使用', {
        action: {
          label: '立即升级',
          onClick: () => {
            router.push('/membership');
          },
        },
      });
      router.push('/resources');
      return;
    }

    // 只有高级用户、终身会员和管理员可以访问
    console.log('用户有权限访问资源详情，开始获取资源数据');
    
    // 简化管理员检查
    setIsAdmin(user.role === 'ADMIN');
    
    // 获取资源数据
    fetchResource();
    fetchInteractions();
  }, [resourceId, user, authLoading, isAuthenticated, token]);

  // 定义一个处理API错误的通用函数
  const handleApiError = async (response: Response, errorMessage: string) => {
    if (response.status === 401) {
      console.error('认证失败，尝试刷新用户资料');
      
      // 尝试刷新用户资料
      const refreshSuccess = await useAuthStore.getState().forceRefreshUserProfile();
      
      if (refreshSuccess) {
        // 刷新成功，返回true表示可以重试
        return true;
      } else {
        // 刷新失败，提示用户重新登录
        console.error('用户资料刷新失败，需要重新登录');
        toast.error('认证已过期，请重新登录');
        router.push('/login');
        return false;
      }
    }
    
    // 其他错误
    console.error(`${errorMessage}，状态码:`, response.status);
    return false;
  };

  const fetchResource = async () => {
    try {
      setLoading(true);
      
      // 确保用户已登录且有token
      if (!user || !token) {
        console.error('获取资源失败: 用户未登录或无token');
        toast.error('请先登录');
        router.push('/login');
        return;
      }
      
      // 确保token格式正确
      const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      console.log('发送资源请求，使用token:', bearerToken ? '有效token' : '无效token');
      
      const response = await fetch(`/api/resources/${resourceId}`, {
        headers: {
          'Authorization': bearerToken,
          'Content-Type': 'application/json',
          // 添加防缓存头部
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        // 使用通用错误处理函数
        const shouldRetry = await handleApiError(response, '获取资源失败');
        if (shouldRetry) {
          // 如果需要重试，等待一小段时间后再次尝试
          setTimeout(() => {
            fetchResource();
          }, 500);
          return;
        }
        
        throw new Error('获取资源失败');
      }
      
      const data = await response.json();
      setResource(data);
    } catch (error) {
      console.error('获取资源失败:', error);
      toast.error('获取资源失败，请稍后重试');
      router.push('/resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async () => {
    if (!user || !token) return;
    
    try {
      // 确保token格式正确
      const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      const response = await fetch(`/api/resources/${resourceId}/interactions`, {
        headers: {
          'Authorization': bearerToken,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setInteractions(data);
      }
    } catch (error) {
      console.error('获取交互状态失败:', error);
    }
  };

  const handleLike = async () => {
    if (!user || !token) {
      toast.error('请先登录');
      return;
    }

    setActionLoading(true);
    try {
      // 确保token格式正确
      const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      const response = await fetch(`/api/resources/${resourceId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': bearerToken,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('点赞失败');
      }

      const data = await response.json();
      setInteractions(prev => ({ ...prev, liked: data.liked }));
      setResource(prev => prev ? {
        ...prev,
        likesCount: data.liked ? prev.likesCount + 1 : prev.likesCount - 1
      } : null);
      
      toast.success(data.liked ? '点赞成功' : '取消点赞');
    } catch (error) {
      console.error('点赞操作失败:', error);
      toast.error('点赞失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!user || !token) {
      toast.error('请先登录');
      return;
    }

    setActionLoading(true);
    try {
      // 确保token格式正确
      const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      const response = await fetch(`/api/resources/${resourceId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': bearerToken,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('收藏失败');
      }

      const data = await response.json();
      setInteractions(prev => ({ ...prev, favorited: data.favorited }));
      setResource(prev => prev ? {
        ...prev,
        favoritesCount: data.favorited ? prev.favoritesCount + 1 : prev.favoritesCount - 1
      } : null);
      
      toast.success(data.favorited ? '收藏成功' : '取消收藏');
    } catch (error) {
      console.error('收藏操作失败:', error);
      toast.error('收藏失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleEdit = () => {
    router.push(`/resources/${resourceId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个资源吗？此操作不可撤销。')) {
      return;
    }

    // 检查用户权限
    if (!user || !token || user.role !== 'ADMIN') {
      toast.error('只有管理员可以删除资源');
      return;
    }

    setActionLoading(true);
    try {
      // 确保token格式正确
      const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': bearerToken,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      toast.success('资源删除成功');
      router.push('/resources');
    } catch (error) {
      console.error('删除资源失败:', error);
      toast.error('删除失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderContent = (content: any) => {
    if (!content) return null;
    
    // 使用BlockNote查看器渲染内容
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    return <BlockNoteViewer content={contentString} />;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">资源不存在</h3>
          <p className="text-gray-500 mb-4">您访问的资源可能已被删除或不存在</p>
          <Button onClick={() => router.push('/resources')}>
            返回资源列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl hide-scrollbar">
      {/* 返回按钮 */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/resources')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回资源列表
      </Button>

      <Card>
        {/* 封面图片 */}
        {resource.coverImageUrl && (
          <div className="mb-6">
            <img
              src={processUploadImageUrl(resource.coverImageUrl)}
              alt={resource.title}
              className="w-full h-64 object-cover rounded-lg shadow-md"
            />
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-3">{resource.title}</CardTitle>
              
              {/* 作者信息 */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={resource.user.avatarUrl} />
                  <AvatarFallback>
                    {resource.user.nickname.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{resource.user.nickname}</p>
                  <p className="text-sm text-gray-500">
                    发布于 {formatDate(resource.createdAt)}
                  </p>
                </div>
              </div>

              {/* 分类和统计 */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <Badge variant="secondary">
                  {resource.category.name}
                </Badge>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{resource.viewsCount} 浏览</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{resource.likesCount} 点赞</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bookmark className="w-4 h-4" />
                  <span>{resource.favoritesCount} 收藏</span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button
                variant={interactions.liked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                disabled={actionLoading}
              >
                <Heart className={`w-4 h-4 mr-1 ${interactions.liked ? 'fill-current' : ''}`} />
                {interactions.liked ? '已赞' : '点赞'}
              </Button>
              
              <Button
                variant={interactions.favorited ? "default" : "outline"}
                size="sm"
                onClick={handleFavorite}
                disabled={actionLoading}
              >
                <Bookmark className={`w-4 h-4 mr-1 ${interactions.favorited ? 'fill-current' : ''}`} />
                {interactions.favorited ? '已藏' : '收藏'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-1" />
                分享
              </Button>

              {/* 管理员操作按钮 */}
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    disabled={actionLoading || checkingAdmin}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={actionLoading || checkingAdmin}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* 内容 */}
          <div className="max-w-none">
            {renderContent(resource.content)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 