'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { requestsApi, requestCategoriesApi } from '@/lib/api';
import { 
  Request, 
  RequestCategory, 
  RequestPriority, 
  RequestStatus 
} from '@/types';
import { Heart, Clock, MessageSquare, DollarSign, Plus, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuthStore } from '@/lib/store/auth-store';
import Image from 'next/image';
import { UserCard } from '@/components/user-card';

// 加载状态UI
function RequestsPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">需求广场</h1>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        <Skeleton className="h-14 w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// 包含useSearchParams的组件
function RequestsContent() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [categories, setCategories] = useState<RequestCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  // 设置过滤条件
  const [filters, setFilters] = useState<RequestFilters>({
    category: searchParams?.get('category') || '',
    status: (searchParams?.get('status') as RequestStatus) || '',
    sort: (searchParams?.get('sort') as SortOrder) || 'newest',
    page: parseInt(searchParams?.get('page') || '1', 10),
    limit: parseInt(searchParams?.get('limit') || '10', 10),
  });

  useEffect(() => {
    // 从URL参数获取搜索条件
    const queryPage = searchParams.get('page');
    const queryCategory = searchParams.get('category');
    const queryStatus = searchParams.get('status');
    const queryPriority = searchParams.get('priority');
    const querySearch = searchParams.get('search');

    if (queryPage) setPage(parseInt(queryPage));
    if (queryCategory) setCategoryId(queryCategory);
    if (queryStatus) setStatus(queryStatus);
    if (queryPriority) setPriority(queryPriority);
    if (querySearch) setSearchTerm(querySearch);

    // 获取分类数据
    const fetchCategories = async () => {
      try {
        const categoriesData = await requestCategoriesApi.getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('获取分类失败');
      }
    };

    fetchCategories();
  }, [searchParams]);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const data = await requestsApi.getRequests(
          page,
          10,
          categoryId ? parseInt(categoryId) : undefined,
          status as RequestStatus,
          priority as RequestPriority,
          searchTerm || undefined
        );
        setRequests(data.requests);
        setTotalPages(data.meta.totalPages);
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast.error('获取需求列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [page, categoryId, status, priority, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateSearchParams();
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setPage(1);
    updateSearchParams({ category: value });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
    updateSearchParams({ status: value });
  };

  const handlePriorityChange = (value: string) => {
    setPriority(value);
    setPage(1);
    updateSearchParams({ priority: value });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      updateSearchParams({ page: newPage.toString() });
    }
  };

  const updateSearchParams = (params?: Record<string, string>) => {
    const newParams = new URLSearchParams();
    
    if (params?.page || page !== 1) newParams.set('page', params?.page || page.toString());
    if (params?.category || categoryId) newParams.set('category', params?.category || categoryId);
    if (params?.status || status) newParams.set('status', params?.status || status);
    if (params?.priority || priority) newParams.set('priority', params?.priority || priority);
    if (searchTerm) newParams.set('search', searchTerm);
    
    const queryString = newParams.toString();
    router.push(`/requests${queryString ? `?${queryString}` : ''}`);
  };

  const getPriorityBadge = (priority: RequestPriority) => {
    switch (priority) {
      case RequestPriority.URGENT:
        return <Badge className="bg-red-500">紧急</Badge>;
      case RequestPriority.HIGH:
        return <Badge className="bg-orange-500">高</Badge>;
      case RequestPriority.NORMAL:
        return <Badge className="bg-blue-500">中</Badge>;
      case RequestPriority.LOW:
        return <Badge className="bg-green-500">低</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.OPEN:
        return <Badge className="bg-green-500">开放中</Badge>;
      case RequestStatus.IN_PROGRESS:
        return <Badge className="bg-blue-500">进行中</Badge>;
      case RequestStatus.SOLVED:
        return <Badge className="bg-purple-500">已解决</Badge>;
      case RequestStatus.CLOSED:
        return <Badge className="bg-gray-500">已关闭</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return <RequestsPageSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">需求广场</h1>
        {user && (
          <Button asChild>
            <Link href="/requests/create">
              <Plus className="mr-2 h-4 w-4" /> 发布需求
            </Link>
          </Button>
        )}
      </div>

      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索需求..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">搜索</Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <div className="w-full md:w-auto">
            <Select value={categoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">所有分类</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="状态过滤" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">所有状态</SelectItem>
                <SelectItem value={RequestStatus.OPEN}>开放中</SelectItem>
                <SelectItem value={RequestStatus.IN_PROGRESS}>进行中</SelectItem>
                <SelectItem value={RequestStatus.SOLVED}>已解决</SelectItem>
                <SelectItem value={RequestStatus.CLOSED}>已关闭</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Select value={priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="优先级过滤" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">所有优先级</SelectItem>
                <SelectItem value={RequestPriority.URGENT}>紧急</SelectItem>
                <SelectItem value={RequestPriority.HIGH}>高</SelectItem>
                <SelectItem value={RequestPriority.NORMAL}>中</SelectItem>
                <SelectItem value={RequestPriority.LOW}>低</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {requests.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <Link key={request.id} href={`/requests/${request.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-1">{request.title}</CardTitle>
                      <div className="flex space-x-1">
                        {getPriorityBadge(request.priority)}
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCard 
                        user={request.user} 
                        size="sm" 
                        showName={true}
                        linkToProfile={true}
                      />
                    </div>
                    <div className="text-sm">
                      <Badge variant="outline">{request.category.name}</Badge>
                      {request.budget && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          <DollarSign className="inline h-3 w-3" /> {request.budget}
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 border-t">
                    <div className="flex justify-between w-full text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        <span>{request.likesCount}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span>{request.responseCount}</span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>

          {/* 分页控制 */}
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                上一页
              </Button>
              <div className="flex items-center px-4">
                {page} / {totalPages}
              </div>
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">暂无需求内容</p>
          {user && (
            <Button asChild>
              <Link href="/requests/create">发布第一个需求</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// 主组件
export default function RequestsPage() {
  return (
    <Suspense fallback={<RequestsPageSkeleton />}>
      <RequestsContent />
    </Suspense>
  );
} 