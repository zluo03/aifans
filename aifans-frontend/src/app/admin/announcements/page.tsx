'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api/api';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import debounce from 'lodash/debounce';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Trash2, 
  Edit, 
  Eye, 
  Plus,
  Calendar,
  Users,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface Announcement {
  id: number;
  title: string;
  summary?: string;
  imageUrl?: string;
  linkUrl?: string;
  showImage: boolean;
  showSummary: boolean;
  showLink: boolean;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    viewRecords: number;
  };
}

interface AnnouncementsResponse {
  items: Announcement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AnnouncementAdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<Announcement | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // 权限检查
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      toast.error('没有访问权限');
    }
  }, [user, router]);

  // 构建查询键
  const queryKey = useMemo(() => ['admin-announcements', page, limit, search, statusFilter], 
    [page, limit, search, statusFilter]
  );

  // 使用 React Query 获取公告数据
  const { data, isLoading, error } = useQuery<AnnouncementsResponse>({
    queryKey,
    queryFn: async () => {
      let url = `admin/announcements?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter && statusFilter !== 'all') url += `&isActive=${statusFilter === 'active'}`;
      
      const response = await api.get<AnnouncementsResponse>(url);
      return response.data;
    },
    staleTime: 30000,
    gcTime: 300000,
    enabled: true,
  });

  // 防抖搜索
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
    }, 500),
    []
  );

  // 处理搜索输入
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch((e.target as HTMLFormElement).querySelector('input')?.value || '');
    setPage(1);
  };

  // 处理状态筛选变更
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  // 处理删除公告
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个公告吗？此操作不可恢复。')) {
      return;
    }
    
    try {
      await api.delete(`admin/announcements/${id}`);
      
      toast.success('公告已删除');
      
      // 刷新数据
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  // 打开预览对话框
  const handlePreview = (item: Announcement) => {
    setSelectedItem(item);
    setIsPreviewOpen(true);
  };

  const getStatusBadge = (announcement: Announcement) => {
    const now = new Date();
    const startDate = new Date(announcement.startDate);
    const endDate = new Date(announcement.endDate);
    
    if (!announcement.isActive) {
      return <Badge variant="secondary">已禁用</Badge>;
    }
    
    if (now < startDate) {
      return <Badge className="bg-blue-500">待生效</Badge>;
    }
    
    if (now > endDate) {
      return <Badge className="bg-gray-500">已过期</Badge>;
    }
    
    return <Badge className="bg-green-500">生效中</Badge>;
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 10) {
      return <Badge className="bg-red-500">高优先级</Badge>;
    } else if (priority >= 5) {
      return <Badge className="bg-yellow-500">中优先级</Badge>;
    } else {
      return <Badge className="bg-gray-500">低优先级</Badge>;
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>公告管理</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              管理系统公告，设置显示内容和生效时间
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/announcements/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新建公告
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <Input
                placeholder="搜索标题或简介"
                defaultValue={search}
                onChange={handleSearchInput}
                className="flex-1"
              />
              <Button type="submit">搜索</Button>
            </form>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">已启用</SelectItem>
                  <SelectItem value="inactive">已禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card shadow-sm p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
                  </div>
                </div>
              ))
            ) : !data || data.items.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                未找到匹配的公告
              </div>
            ) : (
              data?.items.map((item) => (
                <div key={item.id} className="rounded-lg border bg-card shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        {getStatusBadge(item)}
                        {getPriorityBadge(item.priority)}
                      </div>
                      
                      {item.summary && (
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(item.startDate), 'yyyy-MM-dd', { locale: zhCN })} 
                            {' - '}
                            {format(new Date(item.endDate), 'yyyy-MM-dd', { locale: zhCN })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{item._count.viewRecords} 次查看</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          <span>优先级 {item.priority}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        {item.showImage && item.imageUrl && (
                          <Badge variant="outline">显示图片</Badge>
                        )}
                        {item.showSummary && item.summary && (
                          <Badge variant="outline">显示简介</Badge>
                        )}
                        {item.showLink && item.linkUrl && (
                          <Badge variant="outline">显示链接</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button variant="ghost" size="icon" onClick={() => handlePreview(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Link href={`/admin/announcements/${item.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700" 
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              总计 {data?.meta.total || 0} 个公告
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data?.meta?.totalPages || page >= data?.meta?.totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              公告预览
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {selectedItem?.showImage && selectedItem?.imageUrl && (
              <div className="w-full">
                <img 
                  src={selectedItem.imageUrl} 
                  alt={selectedItem.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            
            {selectedItem?.showSummary && selectedItem?.summary && (
              <div>
                <h4 className="font-medium mb-2">简介</h4>
                <p className="text-muted-foreground">{selectedItem.summary}</p>
              </div>
            )}
            
            {selectedItem?.showLink && selectedItem?.linkUrl && (
              <div>
                <h4 className="font-medium mb-2">链接</h4>
                <a 
                  href={selectedItem.linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {selectedItem.linkUrl}
                </a>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">生效时间：</span>
                <br />
                {selectedItem && format(new Date(selectedItem.startDate), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
              </div>
              <div>
                <span className="font-medium">结束时间：</span>
                <br />
                {selectedItem && format(new Date(selectedItem.endDate), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              关闭
            </Button>
            {selectedItem && (
              <Link href={`/admin/announcements/${selectedItem.id}/edit`}>
                <Button>编辑公告</Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 