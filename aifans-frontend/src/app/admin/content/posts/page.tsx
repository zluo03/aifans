'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/api';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Eye, EyeOff, Tag, Trash2 } from 'lucide-react';

// 灵贴类别接口
interface PostCategory {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

interface Post {
  id: number;
  title: string;
  content?: string;
  description?: string;
  status: 'VISIBLE' | 'HIDDEN' | 'ADMIN_DELETED';
  categoryId?: number;
  category?: PostCategory;
  createdAt: string;
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl?: string;
  };
  likesCount: number;
  favoritesCount: number;
  viewsCount: number;
}

export default function PostsAdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [postToSetCategory, setPostToSetCategory] = useState<Post | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  // 权限检查
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      toast.error('没有访问权限');
    }
  }, [user, router]);

  // 获取灵贴类别
  const fetchCategories = async () => {
    try {
      // 模拟类别数据，实际项目中应从API获取
      const mockCategories: PostCategory[] = [
        { id: 1, name: '创意分享', description: '用户原创创意内容', color: '#3B82F6' },
        { id: 2, name: '技术交流', description: '技术相关讨论', color: '#10B981' },
        { id: 3, name: '生活记录', description: '生活日常分享', color: '#F59E0B' },
        { id: 4, name: '问答求助', description: '问题求助与解答', color: '#EF4444' },
        { id: 5, name: '资源分享', description: '资源推荐分享', color: '#8B5CF6' },
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('获取类别失败:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = `/admin/inspirations?page=${page}&limit=${limit}`;
      if (userIdFilter) url += `&userId=${userIdFilter}`;
      if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (categoryFilter && categoryFilter !== 'all') url += `&categoryId=${categoryFilter}`;
      
      const response = await api.get(url);
      setPosts(response.data.items);
      setTotalItems(response.data.meta.total);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('获取灵贴列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchCategories();
      fetchPosts();
    }
  }, [page, userIdFilter, statusFilter, categoryFilter, user]);

  const handleUserIdFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserIdFilter(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handleUpdateVisibility = async (postId: number, status: string) => {
    try {
      await api.patch(`/admin/inspirations/${postId}/status`, { status });
      toast.success('灵贴状态已更新');
      
      // 更新本地数据
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId ? { ...post, status: status as Post['status'] } : post
      ));
    } catch (error) {
      console.error('Error updating post visibility:', error);
      toast.error('更新灵贴状态失败');
    }
  };

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    
    try {
      await api.delete(`/admin/inspirations/${postToDelete.id}`);
      toast.success('灵贴已删除');
      
      // 更新本地数据
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete.id));
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('删除灵贴失败');
    }
  };

  const handleSetCategoryClick = (post: Post) => {
    setPostToSetCategory(post);
    setSelectedCategoryId(post.categoryId?.toString() || '');
    setCategoryDialogOpen(true);
  };

  const handleConfirmSetCategory = async () => {
    if (!postToSetCategory) return;
    
    try {
      await api.patch(`/admin/inspirations/${postToSetCategory.id}/category`, {
        categoryId: selectedCategoryId ? parseInt(selectedCategoryId) : null
      });
      toast.success('灵贴类别已更新');
      
      // 更新本地数据
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postToSetCategory.id 
          ? { 
              ...post, 
              categoryId: selectedCategoryId ? parseInt(selectedCategoryId) : undefined,
              category: selectedCategoryId ? categories.find(c => c.id === parseInt(selectedCategoryId)) : undefined
            } 
          : post
      ));
      setCategoryDialogOpen(false);
      setPostToSetCategory(null);
      setSelectedCategoryId('');
    } catch (error) {
      console.error('Error setting post category:', error);
      toast.error('设置灵贴类别失败');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VISIBLE':
        return <Badge className="bg-green-500">已发布</Badge>;
      case 'HIDDEN':
        return <Badge className="bg-yellow-500">已隐藏</Badge>;
      case 'ADMIN_DELETED':
        return <Badge className="bg-red-500">已删除</Badge>;
      default:
        return null;
    }
  };

  const getCategoryBadge = (category?: PostCategory) => {
    if (!category) return <Badge variant="outline">未分类</Badge>;
    return (
      <Badge 
        style={{ backgroundColor: category.color }}
        className="text-white"
      >
        {category.name}
      </Badge>
    );
  };

  if (!user || user.role !== 'ADMIN') {
    return null; // 权限检查中，不渲染内容
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/admin/content">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回内容管理
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">灵贴管理</h1>
          <p className="text-muted-foreground">管理用户发布的灵贴，设置类别和可见性</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>灵贴列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="用户ID过滤"
                value={userIdFilter}
                onChange={handleUserIdFilterChange}
                type="number"
                className="max-w-[200px]"
              />
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="VISIBLE">已发布</SelectItem>
                  <SelectItem value="HIDDEN">已隐藏</SelectItem>
                  <SelectItem value="ADMIN_DELETED">已删除</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={categoryFilter}
                onValueChange={handleCategoryFilterChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="类别筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类别</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left font-medium">标题</th>
                  <th className="py-3 px-4 text-left font-medium">作者</th>
                  <th className="py-3 px-4 text-left font-medium">类别</th>
                  <th className="py-3 px-4 text-left font-medium">状态</th>
                  <th className="py-3 px-4 text-left font-medium">日期</th>
                  <th className="py-3 px-4 text-center font-medium">互动数据</th>
                  <th className="py-3 px-4 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center">加载中...</td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center">无数据</td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="max-w-[200px]">
                          <div className="font-medium truncate">{post.title}</div>
                          {post.content && (
                            <div className="text-xs text-muted-foreground truncate mt-1">
                              {post.content.substring(0, 50)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {post.user.avatarUrl && (
                            <Image
                              src={post.user.avatarUrl}
                              alt={post.user.nickname}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-medium">{post.user.nickname}</div>
                            <div className="text-xs text-muted-foreground">@{post.user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getCategoryBadge(post.category)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {format(new Date(post.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-3 text-xs">
                          <span>💖 {post.likesCount}</span>
                          <span>💬 {post.viewsCount}</span>
                          <span>⭐ {post.favoritesCount}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetCategoryClick(post)}
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            分类
                          </Button>
                          {post.status === 'VISIBLE' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateVisibility(post.id, 'HIDDEN')}
                            >
                              <EyeOff className="w-3 h-3 mr-1" />
                              隐藏
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateVisibility(post.id, 'VISIBLE')}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              显示
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(post)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalItems > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                共 {totalItems} 条记录，第 {page} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={posts.length < limit}
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除灵贴"{postToDelete?.title}"吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 设置类别对话框 */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置灵贴类别</DialogTitle>
            <DialogDescription>
              为灵贴"{postToSetCategory?.title}"设置合适的类别
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="选择类别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">无类别</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmSetCategory}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 