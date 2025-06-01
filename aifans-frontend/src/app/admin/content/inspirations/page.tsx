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
import Image from 'next/image';
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
  Play, 
  Pause, 
  Eye, 
  ArrowLeft, 
  Film,
  Image as ImageIcon 
} from 'lucide-react';
import Link from 'next/link';
import { processImageUrl } from '@/lib/utils/image-url';

interface Inspiration {
  id: number;
  title: string;
  description?: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  status: 'ACTIVE' | 'PENDING' | 'REJECTED';
  createdAt: string;
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl?: string;
  };
}

interface InspirationsResponse {
  items: Inspiration[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function InspirationAdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<Inspiration | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // 权限检查
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      toast.error('没有访问权限');
    }
  }, [user, router]);

  // 构建查询键
  const queryKey = useMemo(() => ['inspirations', page, limit, search, mediaTypeFilter, statusFilter], 
    [page, limit, search, mediaTypeFilter, statusFilter]
  );

  // 使用 React Query 获取灵感素材数据
  const { data, isLoading, error } = useQuery<InspirationsResponse>({
    queryKey,
    queryFn: async () => {
      let url = `admin/inspirations?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (mediaTypeFilter && mediaTypeFilter !== 'all') url += `&mediaType=${mediaTypeFilter}`;
      if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`;
      
      const response = await api.get<InspirationsResponse>(url);
      return response.data;
    },
    staleTime: 30000, // 数据30秒内认为是新鲜的
    gcTime: 300000, // 缓存5分钟
    enabled: true, // 启用API调用
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
    // 立即触发搜索，不使用防抖
    setSearch((e.target as HTMLFormElement).querySelector('input')?.value || '');
    setPage(1);
  };

  // 处理媒体类型筛选变更
  const handleMediaTypeFilterChange = (value: string) => {
    setMediaTypeFilter(value);
    setPage(1);
  };

  // 处理状态筛选变更
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  // 处理审核通过
  const handleApprove = async (id: number) => {
    try {
      await api.patch(`admin/inspirations/${id}`, { status: 'VISIBLE' });
      
      toast.success('素材已通过审核');
      
      // 刷新数据
      queryClient.invalidateQueries({ queryKey: ['inspirations'] });
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    }
  };

  // 处理审核拒绝
  const handleReject = async (id: number) => {
    try {
      await api.patch(`admin/inspirations/${id}`, { status: 'HIDDEN' });
      
      toast.success('素材已拒绝');
      
      // 刷新数据
      queryClient.invalidateQueries({ queryKey: ['inspirations'] });
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    }
  };

  // 处理删除素材
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个素材吗？此操作不可恢复。')) {
      return;
    }
    
    try {
      await api.delete(`admin/inspirations/${id}`);
      
      toast.success('素材已删除');
      
      // 刷新数据
      queryClient.invalidateQueries({ queryKey: ['inspirations'] });
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  // 打开预览对话框
  const handlePreview = (item: Inspiration) => {
    setSelectedItem(item);
    setIsPreviewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">已通过</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500">待审核</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500">已拒绝</Badge>;
      default:
        return null;
    }
  };

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'IMAGE':
        return <ImageIcon className="w-4 h-4" />;
      case 'VIDEO':
        return <Film className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null; // 权限检查中，不渲染内容
  }

  // 使用真实数据
  const displayData = data;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>灵感管理</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              管理灵感模块中的图片与视频内容
            </p>
          </div>
          <Link 
            href="/admin/content"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回内容管理</span>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <Input
                placeholder="搜索标题或描述"
                defaultValue={search}
                onChange={handleSearchInput}
                className="flex-1"
              />
              <Button type="submit">搜索</Button>
            </form>
            <div className="flex gap-2">
              <Select
                value={mediaTypeFilter}
                onValueChange={handleMediaTypeFilterChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="媒体类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="IMAGE">图片</SelectItem>
                  <SelectItem value="VIDEO">视频</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="ACTIVE">已通过</SelectItem>
                  <SelectItem value="PENDING">待审核</SelectItem>
                  <SelectItem value="REJECTED">已拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card shadow-sm">
                  <div className="aspect-video w-full bg-muted animate-pulse rounded-t-lg"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : !displayData || displayData.items.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                未找到匹配的素材
              </div>
            ) : (
              displayData?.items.map((item) => (
                <div key={item.id} className="rounded-lg border bg-card shadow-sm overflow-hidden">
                  <div className="relative aspect-video w-full bg-muted">
                    {item.mediaType === 'IMAGE' ? (
                      <Image
                        src={item.mediaUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Film className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getMediaTypeIcon(item.mediaType)}
                        {item.mediaType === 'IMAGE' ? '图片' : '视频'}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium line-clamp-1 text-sm">{item.title}</h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative h-6 w-6 rounded-full overflow-hidden">
                        <Image
                          src={processImageUrl(item.user.avatarUrl)}
                          alt={item.user.nickname}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.user.nickname}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handlePreview(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {item.status === 'PENDING' && (
                          <>
                            <Button variant="ghost" size="icon" className="text-green-500" onClick={() => handleApprove(item.id)}>
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleReject(item.id)}>
                              <Pause className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              总计 {displayData?.meta.total || 0} 个素材
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
                disabled={!displayData?.meta?.totalPages || page >= displayData?.meta?.totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              {selectedItem?.description || '无描述'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedItem?.mediaType === 'IMAGE' ? (
              <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src={selectedItem?.mediaUrl || ''}
                  alt={selectedItem?.title || ''}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <video 
                src={selectedItem?.mediaUrl} 
                controls 
                className="w-full rounded-lg"
              />
            )}
          </div>
          
          <DialogFooter className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 rounded-full overflow-hidden">
                <Image
                  src={processImageUrl(selectedItem?.user.avatarUrl)}
                  alt={selectedItem?.user.nickname || ''}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="text-sm font-medium">{selectedItem?.user.nickname}</div>
                <div className="text-xs text-muted-foreground">@{selectedItem?.user.username}</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {selectedItem?.status === 'PENDING' && (
                <>
                  <Button variant="default" onClick={() => selectedItem && handleApprove(selectedItem.id)}>
                    通过
                  </Button>
                  <Button variant="outline" onClick={() => selectedItem && handleReject(selectedItem.id)}>
                    拒绝
                  </Button>
                </>
              )}
              <Button variant="destructive" onClick={() => selectedItem && handleDelete(selectedItem.id)}>
                删除
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 