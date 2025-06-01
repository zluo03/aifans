'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks';
import { api } from '@/lib/api/api';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface RequestDetail {
  id: number;
  title: string;
  content: string;
  categoryId: number;
  category: {
    id: number;
    name: string;
    colorHex: string;
  };
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl?: string;
  };
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'SOLVED' | 'CLOSED';
  budget?: number;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  favoritesCount: number;
  viewsCount: number;
  responseCount: number;
  isLiked: boolean;
  isFavorited: boolean;
}

interface RequestResponse {
  id: number;
  content: string;
  price?: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  user: {
    id: number;
    nickname: string;
    avatarUrl?: string;
  };
}

export default function DemandDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [responses, setResponses] = useState<RequestResponse[]>([]);
  const [responseContent, setResponseContent] = useState('');
  const [responsePrice, setResponsePrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [responsesLoading, setResponsesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const requestId = typeof id === 'string' ? parseInt(id) : Array.isArray(id) ? parseInt(id[0]) : 0;
  
  // 判断当前用户是否为需求发布者
  const isOwner = user && request && user.id === request.user.id;
  
  // 判断当前用户是否可以回复（高级会员及以上）
  const canRespond = user && ['PREMIUM', 'LIFETIME', 'ADMIN'].includes(user.role) && !isOwner;

  useEffect(() => {
    const fetchRequest = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/requests/${requestId}`);
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

  useEffect(() => {
    const fetchResponses = async () => {
      if (!isOwner) return; // 只有需求所有者可以查看回复
      
      setResponsesLoading(true);
      try {
        const { data } = await api.get(`/requests/${requestId}/responses`);
        setResponses(data.responses || []);
      } catch (error) {
        console.error('Error fetching responses:', error);
        toast.error('获取回复列表失败');
      } finally {
        setResponsesLoading(false);
      }
    };

    if (requestId && isOwner) {
      fetchResponses();
    }
  }, [requestId, isOwner]);

  const handleToggleLike = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    try {
      if (request?.isLiked) {
        await api.delete(`/requests/${requestId}/like`);
        setRequest({
          ...request,
          isLiked: false,
          likesCount: request.likesCount - 1
        });
        toast.success('已取消点赞');
      } else if (request) {
        await api.post(`/requests/${requestId}/like`);
        setRequest({
          ...request,
          isLiked: true,
          likesCount: request.likesCount + 1
        });
        toast.success('点赞成功');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('操作失败');
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    try {
      if (request?.isFavorited) {
        await api.delete(`/requests/${requestId}/favorite`);
        setRequest({
          ...request,
          isFavorited: false,
          favoritesCount: request.favoritesCount - 1
        });
        toast.success('已取消收藏');
      } else if (request) {
        await api.post(`/requests/${requestId}/favorite`);
        setRequest({
          ...request,
          isFavorited: true,
          favoritesCount: request.favoritesCount + 1
        });
        toast.success('收藏成功');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('操作失败');
    }
  };

  const handleMarkAsFulfilled = async () => {
    if (!isOwner) {
      toast.error('只有需求发布者可以执行此操作');
      return;
    }

    if (!confirm('确认将此需求标记为已完成？这将关闭该需求。')) {
      return;
    }

    try {
      await api.patch(`/requests/${requestId}/fulfill`);
      setRequest(request => request ? { ...request, status: 'SOLVED' } : null);
      toast.success('需求已标记为已完成');
    } catch (error) {
      console.error('Error marking request as fulfilled:', error);
      toast.error('操作失败');
    }
  };

  const handleSubmitResponse = async () => {
    if (!canRespond) {
      toast.error('只有高级会员及以上用户可以回复需求');
      return;
    }

    if (!responseContent.trim()) {
      toast.error('回复内容不能为空');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        content: responseContent,
        price: responsePrice ? parseFloat(responsePrice) : undefined
      };
      
      await api.post(`/requests/${requestId}/responses`, payload);
      setResponseContent('');
      setResponsePrice('');
      toast.success('回复已发送');
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('发送回复失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 获取优先级显示
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <Badge variant="outline" className="bg-green-100 text-green-800">低</Badge>;
      case 'NORMAL':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">中</Badge>;
      case 'HIGH':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">高</Badge>;
      case 'URGENT':
        return <Badge variant="outline" className="bg-red-100 text-red-800">紧急</Badge>;
      default:
        return null;
    }
  };

  // 获取状态显示
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-green-500">开放中</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500">进行中</Badge>;
      case 'SOLVED':
        return <Badge className="bg-purple-500">已解决</Badge>;
      case 'CLOSED':
        return <Badge className="bg-gray-500">已关闭</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p>加载中...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">需求不存在</h1>
        <p className="mb-6 text-muted-foreground">该需求可能已被删除或您没有权限查看</p>
        <Button asChild>
          <Link href="/demands">返回需求墙</Link>
        </Button>
      </div>
    );
  }

  const isClosed = ['SOLVED', 'CLOSED'].includes(request.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/demands" className="text-sm text-muted-foreground hover:underline">
          ← 返回需求墙
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        <div className="md:col-span-2 lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{request.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge style={{ backgroundColor: request.category.colorHex }}>
                      {request.category.name}
                    </Badge>
                    {getPriorityBadge(request.priority)}
                    {getStatusBadge(request.status)}
                  </div>
                </div>
                
                {isOwner && !isClosed && (
                  <Button
                    onClick={handleMarkAsFulfilled}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    标记为已完成
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative h-10 w-10 rounded-full overflow-hidden">
                  <Image 
                    src={request.user.avatarUrl || '/images/default-avatar.png'} 
                    alt={request.user.nickname} 
                    fill 
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">{request.user.nickname}</p>
                  <p className="text-xs text-muted-foreground">
                    发布于 {format(new Date(request.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </p>
                </div>
              </div>
              
              <div className="mb-8 whitespace-pre-line">{request.content}</div>
              
              <Separator className="my-6" />
              
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant={request.isLiked ? "default" : "outline"} 
                    size="sm"
                    onClick={handleToggleLike}
                  >
                    {request.isLiked ? '已点赞' : '点赞'} ({request.likesCount})
                  </Button>
                  
                  <Button 
                    variant={request.isFavorited ? "secondary" : "outline"} 
                    size="sm"
                    onClick={handleToggleFavorite}
                  >
                    {request.isFavorited ? '已收藏' : '收藏'} ({request.favoritesCount})
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  已有 {request.viewsCount} 次浏览 · {request.responseCount} 个回复
                </div>
              </div>
            </CardContent>
          </Card>
          
          {isOwner && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>回复列表</CardTitle>
              </CardHeader>
              <CardContent>
                {responsesLoading ? (
                  <div className="text-center py-6">加载中...</div>
                ) : responses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    暂时没有收到回复
                  </div>
                ) : (
                  <div className="space-y-6">
                    {responses.map(response => (
                      <div key={response.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative h-8 w-8 rounded-full overflow-hidden">
                            <Image 
                              src={response.user.avatarUrl || '/images/default-avatar.png'} 
                              alt={response.user.nickname} 
                              fill 
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{response.user.nickname}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(response.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                            </p>
                          </div>
                          
                          <Badge className={
                            response.status === 'ACCEPTED' ? 'bg-green-500 ml-auto' : 
                            response.status === 'REJECTED' ? 'bg-red-500 ml-auto' : 
                            'bg-yellow-500 ml-auto'
                          }>
                            {
                              response.status === 'ACCEPTED' ? '已接受' : 
                              response.status === 'REJECTED' ? '已拒绝' : 
                              '待处理'
                            }
                          </Badge>
                        </div>
                        
                        <div className="mb-3 whitespace-pre-line">{response.content}</div>
                        
                        {response.price && (
                          <div className="mb-4">
                            <Badge variant="outline" className="bg-blue-50">
                              报价: ¥{response.price}
                            </Badge>
                          </div>
                        )}
                        
                        {response.status === 'PENDING' && (
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" className="bg-green-500 hover:bg-green-600">
                              接受回复
                            </Button>
                            <Button size="sm" variant="destructive">
                              拒绝回复
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <div className="sticky top-4">
            {request.budget && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">参考预算</h3>
                  <p className="text-2xl font-bold">¥{request.budget}</p>
                </CardContent>
              </Card>
            )}
            
            {canRespond && !isClosed && (
              <Card>
                <CardHeader>
                  <CardTitle>回复此需求</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-medium">报价（可选）</p>
                      <Input
                        type="number"
                        placeholder="输入您的报价金额"
                        value={responsePrice}
                        onChange={(e) => setResponsePrice(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <p className="mb-2 text-sm font-medium">回复内容</p>
                      <Textarea
                        placeholder="详细描述您如何满足这个需求"
                        value={responseContent}
                        onChange={(e) => setResponseContent(e.target.value)}
                        rows={6}
                      />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleSubmitResponse}
                      disabled={submitting}
                    >
                      {submitting ? '发送中...' : '发送回复'}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground">
                      您的回复将只对需求发布者可见
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {isClosed && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6">
                    <p className="text-lg font-medium mb-2">此需求已关闭</p>
                    <p className="text-sm text-muted-foreground">不再接受新的回复</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 