'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  MessageSquare, 
  DollarSign, 
  Clock, 
  Calendar, 
  Bookmark, 
  Send, 
  Eye, 
  UserCheck, 
  AlertCircle, 
  X, 
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuthStore } from '@/lib/store/auth-store';
import Link from 'next/link';
import Image from 'next/image';
import { requestsApi } from '@/lib/api';
import { Request, RequestPriority, RequestStatus, RequestResponse, ResponseStatus } from '@/types';

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseContent, setResponseContent] = useState('');
  const [responsePrice, setResponsePrice] = useState<string>('');
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const requestId = parseInt(params.id as string);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const data = await requestsApi.getRequest(requestId);
        setRequest(data);
      } catch (error) {
        console.error('Error fetching request:', error);
        toast.error('获取需求详情失败');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  const handleLike = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    try {
      const result = await requestsApi.toggleLike(requestId);
      setRequest((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isLiked: result.liked,
          likesCount: result.liked ? prev.likesCount + 1 : prev.likesCount - 1,
        };
      });
      toast.success(result.liked ? '点赞成功' : '已取消点赞');
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('操作失败');
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    try {
      const result = await requestsApi.toggleFavorite(requestId);
      setRequest((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isFavorited: result.favorited,
          favoritesCount: result.favorited ? prev.favoritesCount + 1 : prev.favoritesCount - 1,
        };
      });
      toast.success(result.favorited ? '收藏成功' : '已取消收藏');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('操作失败');
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('请先登录');
      return;
    }
    
    if (!responseContent.trim()) {
      toast.error('请输入响应内容');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const payload = {
        content: responseContent,
        price: responsePrice ? parseFloat(responsePrice) : undefined,
        isPublic,
      };
      
      const newResponse = await requestsApi.createResponse(requestId, payload);
      
      toast.success('响应已提交');
      setResponseContent('');
      setResponsePrice('');
      setIsPublic(false);
      
      // 更新需求数据，添加新响应
      setRequest((prev) => {
        if (!prev) return null;
        const responses = prev.responses || [];
        return {
          ...prev,
          responseCount: prev.responseCount + 1,
          responses: [newResponse, ...responses],
        };
      });
      
      setActiveTab('responses');
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('提交响应失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateResponseStatus = async (responseId: number, status: ResponseStatus) => {
    try {
      const updatedResponse = await requestsApi.updateResponseStatus(responseId, status);
      
      // 更新响应状态
      setRequest((prev) => {
        if (!prev || !prev.responses) return prev;
        
        const updatedResponses = prev.responses.map(response => 
          response.id === responseId ? { ...response, status } : response
        );
        
        // 如果接受了响应，同时更新需求状态
        let updatedStatus = prev.status;
        if (status === ResponseStatus.ACCEPTED) {
          updatedStatus = RequestStatus.IN_PROGRESS;
        }
        
        return {
          ...prev,
          status: updatedStatus,
          responses: updatedResponses,
        };
      });
      
      toast.success(status === ResponseStatus.ACCEPTED ? '已接受响应' : '已拒绝响应');
    } catch (error) {
      console.error('Error updating response status:', error);
      toast.error('更新响应状态失败');
    }
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

  const getResponseStatusBadge = (status: ResponseStatus) => {
    switch (status) {
      case ResponseStatus.PENDING:
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">待处理</Badge>;
      case ResponseStatus.ACCEPTED:
        return <Badge variant="outline" className="text-green-500 border-green-500">已接受</Badge>;
      case ResponseStatus.REJECTED:
        return <Badge variant="outline" className="text-red-500 border-red-500">已拒绝</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <div className="flex items-center mb-6">
            <Skeleton className="h-8 w-16 mr-2" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-40 w-full mb-8" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">需求不存在</h1>
        <p className="text-muted-foreground mb-6">该需求可能已被删除或您没有权限查看</p>
        <Button asChild>
          <Link href="/requests">返回需求列表</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user && user.id === request.user.id;
  const canRespond = user && !isOwner && request.status === RequestStatus.OPEN;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold break-words">{request.title}</h1>
            <div className="flex space-x-2 flex-shrink-0">
              {getPriorityBadge(request.priority)}
              {getStatusBadge(request.status)}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
                  <Image 
                    src={request.user.avatarUrl || '/images/default-avatar.png'} 
                    alt={request.user.nickname}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">{request.user.nickname}</p>
                  <p className="text-sm text-muted-foreground">@{request.user.username}</p>
                </div>
              </div>
              <div className="ml-auto flex space-x-3 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(request.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                </span>
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {request.viewsCount}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">{request.category.name}</Badge>
              {request.budget && (
                <Badge variant="outline" className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  预算: {request.budget}
                </Badge>
              )}
            </div>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap break-words">
                  {request.content}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLike}
                  className={request.isLiked ? "text-red-500" : ""}
                >
                  <Heart className={`h-4 w-4 mr-2 ${request.isLiked ? "fill-current" : ""}`} />
                  {request.likesCount}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleFavorite}
                  className={request.isFavorited ? "text-yellow-500" : ""}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${request.isFavorited ? "fill-current" : ""}`} />
                  {request.favoritesCount}
                </Button>
              </div>

              {isOwner && (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                  >
                    <Link href={`/requests/${request.id}/edit`}>
                      编辑
                    </Link>
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        关闭需求
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>确认关闭需求</DialogTitle>
                      </DialogHeader>
                      <p className="py-4">关闭后需求将不再接受新的响应。您确定要关闭此需求吗？</p>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          const el = document.querySelector('[data-state="open"][role="dialog"]');
                          if (el) (el as HTMLElement).dataset.state = 'closed';
                        }}>
                          取消
                        </Button>
                        <Button variant="destructive" onClick={async () => {
                          try {
                            await requestsApi.updateRequest(request.id, { status: RequestStatus.CLOSED });
                            setRequest(prev => prev ? { ...prev, status: RequestStatus.CLOSED } : null);
                            toast.success('需求已关闭');
                            const el = document.querySelector('[data-state="open"][role="dialog"]');
                            if (el) (el as HTMLElement).dataset.state = 'closed';
                          } catch (error) {
                            console.error('Error closing request:', error);
                            toast.error('关闭需求失败');
                          }
                        }}>
                          确认关闭
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">
              需求详情
            </TabsTrigger>
            <TabsTrigger value="responses" className="relative">
              响应
              {request.responseCount > 0 && (
                <Badge className="ml-2 bg-primary text-white">{request.responseCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-6">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <h3 className="text-xl font-semibold mb-4">需求详情</h3>
              <p className="whitespace-pre-wrap break-words">{request.content}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="responses" className="mt-6">
            {canRespond && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>提交响应</CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmitResponse}>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Textarea
                          placeholder="输入您的响应内容..."
                          value={responseContent}
                          onChange={(e) => setResponseContent(e.target.value)}
                          className="min-h-[150px]"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            报价 (可选)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="您的报价"
                              value={responsePrice}
                              onChange={(e) => setResponsePrice(e.target.value)}
                              className="pl-10"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div className="flex items-center h-full pt-6">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isPublic}
                              onChange={(e) => setIsPublic(e.target.checked)}
                              className="mr-2 h-4 w-4"
                            />
                            <span className="text-sm">公开显示给所有人</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <p className="text-sm text-muted-foreground">
                      默认情况下，您的响应仅对需求发布者可见
                    </p>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? '提交中...' : '提交响应'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}

            {request.responses && request.responses.length > 0 ? (
              <div className="space-y-6">
                {request.responses.map((response) => (
                  <Card key={response.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2">
                            <Image 
                              src={response.user.avatarUrl || '/images/default-avatar.png'} 
                              alt={response.user.nickname}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{response.user.nickname}</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true, locale: zhCN })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {getResponseStatusBadge(response.status)}
                          {isOwner && response.status === ResponseStatus.PENDING && (
                            <div className="flex ml-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-green-500 hover:text-green-700"
                                onClick={() => handleUpdateResponseStatus(response.id, ResponseStatus.ACCEPTED)}
                                title="接受"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-red-500 hover:text-red-700"
                                onClick={() => handleUpdateResponseStatus(response.id, ResponseStatus.REJECTED)}
                                title="拒绝"
                              >
                                <X className="h-5 w-5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap break-words">{response.content}</p>
                      {response.price && (
                        <div className="mt-2 text-sm">
                          <Badge variant="outline" className="flex items-center w-fit">
                            <DollarSign className="h-3 w-3 mr-1" />
                            报价: {response.price}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                    {!response.isPublic && !isOwner && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                        <div className="text-center p-4">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">该响应已设为私密，仅需求发布者可见</p>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-4">暂无响应</p>
                {canRespond && (
                  <Button onClick={() => document.querySelector('textarea')?.focus()}>
                    发表第一个响应
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 