'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Archive, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Resource {
  id: number;
  title: string;
  description: string;
  coverImageUrl: string | null;
  likesCount: number;
  favoritesCount: number;
  viewsCount: number;
  createdAt: string;
  category: {
    id: number;
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function ResourcesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('query') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('category') || '');
  const [showFavorited, setShowFavorited] = useState(searchParams?.get('favorited') === 'true');
  const [currentPage, setCurrentPage] = useState(Number(searchParams?.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);

  // 获取资源列表
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        // 构建查询参数
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        if (searchQuery) params.set('query', searchQuery);
        if (selectedCategory) params.set('category', selectedCategory);
        if (showFavorited) params.set('favorited', 'true');

        const response = await fetch(`/api/resources?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // 验证响应数据的结构
        if (!data || !Array.isArray(data.items)) {
          console.warn('资源数据格式不正确:', data);
          setResources([]);
          setTotalPages(1);
          return;
        }

        setResources(data.items);
        
        // 安全地访问meta数据
        if (data.meta && typeof data.meta.total === 'number' && typeof data.meta.limit === 'number') {
          setTotalPages(Math.ceil(data.meta.total / data.meta.limit));
        } else {
          console.warn('分页元数据格式不正确:', data.meta);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('获取资源列表失败:', error);
        toast.error('获取资源列表失败，请稍后重试');
        setResources([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [currentPage, searchQuery, selectedCategory, showFavorited]);

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/resource-categories');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          console.warn('分类数据格式不正确:', data);
          setCategories([]);
          return;
        }
        
        setCategories(data);
      } catch (error) {
        console.error('获取分类列表失败:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

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
    
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', '1');
    if (checked) {
      params.set('favorited', 'true');
    } else {
      params.delete('favorited');
    }
    router.push(`/resources?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', page.toString());
    router.push(`/resources?${params.toString()}`);
  };

  const handleResourceClick = (resourceId: number) => {
    // 检查用户权限：需要登录且不能是普通用户
    if (!user) {
      toast.error('请先登录');
      router.push('/login');
      return;
    }

    if (user.role === 'NORMAL') {
      setShowMemberDialog(true);
      return;
    }
    
    // 只有登录的非普通用户可以访问（高级会员、终身会员、管理员）
    router.push(`/resources/${resourceId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

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
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="搜索资源..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">全部分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Button type="submit">搜索</Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 资源列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : resources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无资源</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-[1.02]"
                  onClick={() => handleResourceClick(resource.id)}
                >
                  {/* 资源封面 */}
                  <div className="relative h-48">
                    {resource.coverImageUrl ? (
                      <img
                        src={resource.coverImageUrl}
                        alt={resource.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Archive className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {/* 分类标签 */}
                    <Badge className="absolute top-2 right-2">
                      {resource.category.name}
                    </Badge>
                  </div>

                  {/* 资源信息 */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      {resource.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {resource.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>发布于 {formatDate(resource.createdAt)}</span>
                      <div className="flex items-center gap-4">
                        <span>{resource.viewsCount} 浏览</span>
                        <span>{resource.likesCount} 点赞</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {!loading && resources.length > 0 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 会员提示对话框 */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>需要升级会员</DialogTitle>
            <p className="text-gray-600">
              该资源仅对高级会员和终身会员开放，请升级会员后继续访问。
            </p>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowMemberDialog(false)}>
              取消
            </Button>
            <Button onClick={() => router.push('/membership')}>
              <Lock className="w-4 h-4 mr-2" />
              升级会员
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 