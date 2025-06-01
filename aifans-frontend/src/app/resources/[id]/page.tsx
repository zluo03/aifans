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
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuthStore();
  const [resource, setResource] = useState<Resource | null>(null);
  const [interactions, setInteractions] = useState<UserInteractions>({ liked: false, favorited: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const resourceId = params.id as string;

  useEffect(() => {
    console.log('=== 资源详情页面权限检查 ===');
    console.log('认证状态:', { authLoading, isAuthenticated, user: user ? { id: user.id, role: user.role } : null });
    
    // 等待认证状态加载完成
    if (authLoading) {
      console.log('认证状态加载中，等待...');
      return;
    }

    // 检查用户权限：需要登录且不能是普通用户
    if (!isAuthenticated) {
      console.log('用户未登录，跳转到登录页面');
      toast.error('请先登录');
      router.push('/login');
      return;
    }

    // 检查用户对象是否存在
    if (!user) {
      console.log('用户对象不存在，但认证状态为true，等待用户数据加载...');
      return;
    }

    console.log('当前用户信息:', { id: user.id, role: user.role, status: user.status });

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

    // 只有登录的非普通用户可以访问（高级会员、终身会员、管理员）
    console.log('用户有权限访问资源详情，开始获取资源数据');
    console.log('用户状态: 已登录 (' + user.role + ')');
    
    fetchResource();
    fetchInteractions();
  }, [resourceId, user, authLoading, isAuthenticated]);

  const fetchResource = async () => {
    try {
      // 获取认证token（必需）
      const { token: storeToken } = useAuthStore.getState();
      const localToken = localStorage.getItem('token');
      const token = storeToken || localToken;
      
      console.log('开始获取资源详情，资源ID:', resourceId);
      console.log('Token来源:', storeToken ? 'store' : 'localStorage');
      
      if (!token) {
        console.error('没有找到认证token');
        toast.error('请先登录');
        router.push('/login');
        return;
      }
      
      const response = await fetch(`/api/resources/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('获取资源详情响应状态:', response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('获取资源失败详情:', errorData);
        } catch (parseError) {
          console.error('解析错误响应失败:', parseError);
          errorData = { error: '服务器响应错误', details: `HTTP ${response.status}` };
        }
        
        // 根据状态码提供更具体的错误信息
        let errorMessage = '获取资源失败';
        if (response.status === 401) {
          errorMessage = '认证失败，请重新登录';
          useAuthStore.getState().logout();
          router.push('/login');
          return;
        } else if (response.status === 403) {
          errorMessage = '没有权限访问此资源';
        } else if (response.status === 404) {
          errorMessage = '资源不存在';
        } else {
          errorMessage = errorData.error || errorData.message || `获取资源失败 (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('获取资源详情成功:', { id: data.id, title: data.title });
      setResource(data);
    } catch (error) {
      console.error('获取资源失败:', error);
      const errorMessage = error instanceof Error ? error.message : '获取资源失败';
      toast.error(errorMessage);
      router.push('/resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async () => {
    if (!user) return;
    
    try {
      // 使用与fetchResource相同的token获取逻辑
      const { token: storeToken } = useAuthStore.getState();
      const localToken = localStorage.getItem('token');
      const token = storeToken || localToken;
      
      if (!token) {
        console.log('没有找到认证token，跳过获取交互状态');
        return;
      }

      console.log('开始获取交互状态，资源ID:', resourceId);
      console.log('Token来源:', storeToken ? 'store' : 'localStorage');

      const response = await fetch(`/api/resources/${resourceId}/interactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('获取交互状态响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('获取交互状态成功:', data);
        setInteractions(data);
      } else if (response.status === 401) {
        console.log('认证失败，可能token已过期');
        useAuthStore.getState().logout();
        // 不显示错误，静默处理
      } else {
        console.error('获取交互状态失败，状态码:', response.status);
      }
    } catch (error) {
      console.error('获取交互状态失败:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setActionLoading(true);
    try {
      // 使用store中的token，而不是localStorage
      const { token: storeToken } = useAuthStore.getState();
      const localToken = localStorage.getItem('token');
      const token = storeToken || localToken;
      
      if (!token) {
        toast.error('请先登录');
        return;
      }

      console.log('开始点赞操作，资源ID:', resourceId);
      console.log('用户信息:', { id: user.id, role: user.role });
      console.log('Token来源:', storeToken ? 'store' : 'localStorage');

      const response = await fetch(`/api/resources/${resourceId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('点赞响应状态:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('点赞失败详情:', errorData);
        } catch (parseError) {
          console.error('解析错误响应失败:', parseError);
          errorData = { error: '服务器响应错误', details: `HTTP ${response.status}` };
        }

        // 根据状态码提供更具体的错误信息
        let errorMessage = '点赞失败';
        if (response.status === 401) {
          errorMessage = '认证失败，请重新登录';
          useAuthStore.getState().logout();
        } else if (response.status === 403) {
          errorMessage = '没有权限进行此操作';
        } else if (response.status === 404) {
          errorMessage = '资源不存在';
        } else {
          errorMessage = errorData.error || errorData.message || `点赞失败 (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('点赞成功结果:', data);
      setInteractions(prev => ({ ...prev, liked: data.liked }));
      setResource(prev => prev ? {
        ...prev,
        likesCount: data.liked ? prev.likesCount + 1 : prev.likesCount - 1
      } : null);
      
      toast.success(data.liked ? '点赞成功' : '取消点赞');
    } catch (error) {
      console.error('点赞操作失败:', error);
      const errorMessage = error instanceof Error ? error.message : '点赞失败';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setActionLoading(true);
    try {
      // 使用store中的token，而不是localStorage
      const { token: storeToken } = useAuthStore.getState();
      const localToken = localStorage.getItem('token');
      const token = storeToken || localToken;
      
      if (!token) {
        toast.error('请先登录');
        return;
      }

      console.log('开始收藏操作，资源ID:', resourceId);
      console.log('用户信息:', { id: user.id, role: user.role });
      console.log('Token来源:', storeToken ? 'store' : 'localStorage');

      const response = await fetch(`/api/resources/${resourceId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('收藏响应状态:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('收藏失败详情:', errorData);
        } catch (parseError) {
          console.error('解析错误响应失败:', parseError);
          errorData = { error: '服务器响应错误', details: `HTTP ${response.status}` };
        }

        // 根据状态码提供更具体的错误信息
        let errorMessage = '收藏失败';
        if (response.status === 401) {
          errorMessage = '认证失败，请重新登录';
          useAuthStore.getState().logout();
        } else if (response.status === 403) {
          errorMessage = '没有权限进行此操作';
        } else if (response.status === 404) {
          errorMessage = '资源不存在';
        } else {
          errorMessage = errorData.error || errorData.message || `收藏失败 (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('收藏成功结果:', data);
      setInteractions(prev => ({ ...prev, favorited: data.favorited }));
      setResource(prev => prev ? {
        ...prev,
        favoritesCount: data.favorited ? prev.favoritesCount + 1 : prev.favoritesCount - 1
      } : null);
      
      toast.success(data.favorited ? '收藏成功' : '取消收藏');
    } catch (error) {
      console.error('收藏操作失败:', error);
      const errorMessage = error instanceof Error ? error.message : '收藏失败';
      toast.error(errorMessage);
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
    if (!user || user.role !== 'ADMIN') {
      toast.error('只有管理员可以删除资源');
      return;
    }

    setActionLoading(true);
    try {
      // 使用store中的token，而不是localStorage
      const { token: storeToken } = useAuthStore.getState();
      const localToken = localStorage.getItem('token');
      const token = storeToken || localToken;
      
      if (!token) {
        toast.error('请先登录');
        return;
      }

      console.log('开始删除资源，ID:', resourceId);
      console.log('用户信息:', { id: user.id, role: user.role });
      console.log('Token来源:', storeToken ? 'store' : 'localStorage');

      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('删除响应状态:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('删除失败详情:', errorData);
        } catch (parseError) {
          console.error('解析错误响应失败:', parseError);
          errorData = { error: '服务器响应错误', details: `HTTP ${response.status}` };
        }

        // 根据状态码提供更具体的错误信息
        let errorMessage = '删除失败';
        if (response.status === 401) {
          errorMessage = '认证失败，请重新登录';
          // 如果是认证失败，清除认证状态
          useAuthStore.getState().logout();
        } else if (response.status === 403) {
          errorMessage = '没有权限删除此资源';
        } else if (response.status === 404) {
          errorMessage = '资源不存在';
        } else {
          errorMessage = errorData.error || errorData.message || `删除失败 (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('删除成功结果:', data);
      toast.success('资源删除成功');
      router.push('/resources');
    } catch (error) {
      console.error('删除资源失败:', error);
      const errorMessage = error instanceof Error ? error.message : '删除失败';
      toast.error(`删除失败: ${errorMessage}`);
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
          <div className="aspect-[3/1] relative overflow-hidden rounded-t-lg">
            <img
              src={resource.coverImageUrl}
              alt={resource.title}
              className="w-full h-full object-cover"
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
              {user && user.role === 'ADMIN' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    disabled={actionLoading}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={actionLoading}
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