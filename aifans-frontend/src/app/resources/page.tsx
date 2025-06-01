'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Heart, Bookmark, Eye, Calendar, Archive, Lock, Search } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import { MembershipExclusiveDialog } from '@/components/ui/membership-exclusive-dialog';

// 游客访问限制组件
function GuestAccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
      <div className="text-center max-w-md">
        <Archive className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">需要登录才能访问</h1>
        <p className="text-gray-600 mb-6">
          资源页面需要登录后才能浏览。请先登录或注册账号。
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

interface Resource {
  id: number;
  title: string;
  content: any;
  coverImageUrl?: string;
  likesCount: number;
  favoritesCount: number;
  viewsCount: number;
  createdAt: string;
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

interface ResourceCategory {
  id: number;
  name: string;
  description?: string;
}

interface ResourcesResponse {
  resources: Resource[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ResourcesContent组件，用于处理searchParams逻辑
function ResourcesContent() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFavorited, setShowFavorited] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMemberDialog, setShowMemberDialog] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  
  const pageParam = searchParams.get('page');
  const queryParam = searchParams.get('query');
  const categoryParam = searchParams.get('category');
  const favoritedParam = searchParams.get('favorited');

  useEffect(() => {
    setCurrentPage(pageParam ? parseInt(pageParam) : 1);
    setSearchQuery(queryParam || '');
    setSelectedCategory(categoryParam || '');
    setShowFavorited(favoritedParam === 'true');
  }, [pageParam, queryParam, categoryParam, favoritedParam]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/resource-categories');
        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const fetchResources = async (pageNum: number = 1, query: string = '', categoryId: string = '', favorited: boolean = false) => {
    try {
      setLoading(true);
      
      if (favorited && user) {
        // 获取收藏的资源
        const { token: storeToken } = useAuthStore.getState();
        const localToken = localStorage.getItem('token');
        const token = storeToken || localToken;
        
        if (!token) {
          console.error('获取收藏资源失败: 没有认证token');
          toast.error('请先登录');
          return;
        }

        console.log('开始获取收藏资源，页码:', pageNum);
        console.log('用户信息:', { id: user.id, role: user.role });
        console.log('Token来源:', storeToken ? 'store' : 'localStorage');

        const response = await fetch(`/api/resources/favorited?page=${pageNum}&limit=12`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('收藏资源响应状态:', response.status);
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
            console.error('获取收藏资源失败详情:', errorData);
          } catch (parseError) {
            console.error('解析错误响应失败:', parseError);
            errorData = { error: '服务器响应错误', details: `HTTP ${response.status}` };
          }

          // 根据状态码提供更具体的错误信息
          let errorMessage = '获取收藏资源失败';
          if (response.status === 401) {
            errorMessage = '认证失败，请重新登录';
            useAuthStore.getState().logout();
          } else if (response.status === 403) {
            errorMessage = '没有权限访问收藏资源';
          } else {
            errorMessage = errorData.error || errorData.message || `获取收藏资源失败 (${response.status})`;
          }
          
          throw new Error(errorMessage);
        }
        
        const data: ResourcesResponse = await response.json();
        console.log('收藏资源获取成功:', { total: data.total, count: data.resources.length });
        setResources(data.resources);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
      } else {
        // 获取所有资源
        console.log('开始获取所有资源，页码:', pageNum, '查询:', query, '分类:', categoryId);
        const params = new URLSearchParams();
        params.set('page', pageNum.toString());
        params.set('limit', '12');
        if (query) params.set('query', query);
        if (categoryId && categoryId !== 'all') params.set('categoryId', categoryId);

        const response = await fetch(`/api/resources?${params.toString()}`);
        console.log('所有资源响应状态:', response.status);
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
            console.error('获取资源失败详情:', errorData);
          } catch (parseError) {
            errorData = { error: '服务器响应错误', details: `HTTP ${response.status}` };
          }
          
          const errorMessage = errorData.error || errorData.message || '获取资源失败';
          throw new Error(errorMessage);
        }
        
        const data: ResourcesResponse = await response.json();
        console.log('所有资源获取成功:', { total: data.total, count: data.resources.length });
        setResources(data.resources);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
      }
    } catch (error) {
      console.error('获取资源失败:', error);
      const errorMessage = error instanceof Error ? error.message : '获取资源失败';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(currentPage, searchQuery, selectedCategory, showFavorited);
  }, [currentPage, searchQuery, selectedCategory, showFavorited, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    params.set('page', '1');
    if (searchQuery) params.set('query', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (showFavorited) params.set('favorited', 'true');
    
    router.push(`/resources?${params.toString()}`);
  };

  const handleToggleFavorited = (checked: boolean) => {
    setShowFavorited(checked);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (checked) {
      params.set('favorited', 'true');
    } else {
      params.delete('favorited');
    }
    router.push(`/resources?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/resources?${params.toString()}`);
  };

  const handleResourceClick = (resourceId: number) => {
    console.log('点击资源卡片，资源ID:', resourceId);
    console.log('当前用户状态:', { user: user ? { id: user.id, role: user.role } : null });
    
    // 检查用户权限：需要登录且不能是普通用户
    if (!user) {
      console.log('用户未登录，跳转到登录页面');
      toast.error('请先登录');
      router.push('/login');
      return;
    }

    if (user.role === 'NORMAL') {
      console.log('普通用户无权限访问资源详情，显示升级弹框');
      setShowMemberDialog(true);
      return;
    }
    
    // 只有登录的非普通用户可以访问（高级会员、终身会员、管理员）
    console.log('用户有权限访问资源详情，使用客户端路由跳转');
    console.log('用户状态: 已登录 (' + user.role + ')');
    router.push(`/resources/${resourceId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 检查访问权限：所有登录用户都可以查看资源列表
  if (!isAuthenticated) {
    return <GuestAccessDenied />;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden">
      {/* 头部区域 */}
      <div className="flex-shrink-0 bg-white border-b px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Archive className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">资源中心</h1>
                <p className="text-gray-500 mt-1">精选优质资源，助力创作提升</p>
              </div>
            </div>
            
            {/* 管理员创建按钮 */}
            {user && user.role === 'ADMIN' && (
              <Button onClick={() => router.push('/resources/create')}>
                <Archive className="w-4 h-4 mr-2" />
                创建资源
              </Button>
            )}
          </div>
          


          {/* 搜索和筛选栏 */}
          <div className="mb-2">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="全部分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-1 gap-2">
                <Input
                  placeholder="搜索资源..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
                
                {/* 筛选开关 */}
                <div className="flex items-center space-x-2 whitespace-nowrap">
                  <Switch
                    id="favorited"
                    checked={showFavorited}
                    onCheckedChange={handleToggleFavorited}
                    disabled={!user}
                  />
                  <Label htmlFor="favorited" className={`text-sm ${!user ? 'text-gray-400' : ''}`}>
                    我的收藏
                  </Label>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 content-scrollbar">
        <div className="max-w-7xl mx-auto pb-6">
          {resources.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无资源</h3>
          <p className="text-gray-500">
            {searchQuery || selectedCategory ? '没有找到符合条件的资源，请尝试其他搜索条件' : '管理员还没有发布任何资源'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource) => (
              <div 
                key={resource.id} 
                className="floating-card cursor-pointer overflow-hidden bg-white rounded-lg shadow-sm h-48"
                onClick={() => handleResourceClick(resource.id)}
              >
                {/* 上下结构：封面图片占上方2/3，内容占下方1/3 */}
                <div className="flex flex-col h-full">
                  {/* 封面图片区域 - 占2/3高度 */}
                  <div className="h-2/3 relative overflow-hidden">
                    {resource.coverImageUrl ? (
                      <img
                        src={resource.coverImageUrl}
                        alt={resource.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Archive className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* 分类标签 - 右上角 */}
                    <div className="absolute top-2 right-2">
                      <Badge className="text-xs bg-[var(--custom-secondary)] text-white">
                        {resource.category.name}
                      </Badge>
                    </div>
                    
                    {/* 权限锁定图标 */}
                    {(!user || user.role === 'NORMAL') && (
                      <div className="absolute top-2 left-2">
                        <Lock className="w-4 h-4 text-white bg-black bg-opacity-50 rounded p-0.5" />
                      </div>
                    )}
                  </div>
                  
                  {/* 内容区域 - 占1/3高度 */}
                  <div className="h-1/3 p-3 flex flex-col justify-between">
                    {/* 标题 - 加粗字体，只显示一行 */}
                    <h3 className="font-bold text-sm truncate leading-tight">
                      {resource.title}
                    </h3>
                    
                    {/* 统计信息与日期在一行显示 */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {resource.viewsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {resource.likesCount}
                        </span>
                      </div>
                      <span>{formatDate(resource.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  上一页
                </Button>
                
                <span className="text-sm text-gray-500">
                  第 {currentPage} 页，共 {totalPages} 页
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </>
      )}
        </div>
      </div>
      <MembershipExclusiveDialog open={showMemberDialog} onOpenChange={setShowMemberDialog} />
    </div>
  );
}

// 主页组件
export default function ResourcesPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    }>
      <ResourcesContent />
    </Suspense>
  );
} 