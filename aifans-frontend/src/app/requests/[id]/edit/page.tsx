'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { requestsApi, requestCategoriesApi } from '@/lib/api';
import { RequestCategory, RequestPriority, RequestStatus } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';
import Link from 'next/link';

export default function EditRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<RequestPriority>(RequestPriority.NORMAL);
  const [budget, setBudget] = useState<string>('');
  const [categories, setCategories] = useState<RequestCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const requestId = parseInt(params.id as string);

  useEffect(() => {
    // 获取分类和需求数据
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // 获取分类数据
        const categoriesData = await requestCategoriesApi.getAllCategories();
        setCategories(categoriesData);
        
        // 获取需求数据
        const requestData = await requestsApi.getRequest(requestId);
        
        // 验证是否是自己的需求
        if (user && user.id !== requestData.user.id) {
          toast.error('您无权编辑此需求');
          router.push(`/requests/${requestId}`);
          return;
        }
        
        // 填充表单
        setTitle(requestData.title);
        setContent(requestData.content);
        setCategoryId(requestData.categoryId.toString());
        setPriority(requestData.priority);
        setBudget(requestData.budget ? requestData.budget.toString() : '');
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('获取数据失败');
        router.push('/requests');
      } finally {
        setLoading(false);
      }
    };

    if (requestId && user) {
      fetchData();
    } else if (!user) {
      router.push('/login');
    }
  }, [requestId, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('请输入标题');
      return;
    }

    if (!content.trim()) {
      toast.error('请输入详细描述');
      return;
    }

    if (!categoryId) {
      toast.error('请选择分类');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        categoryId: parseInt(categoryId),
        priority,
        budget: budget ? parseFloat(budget) : undefined,
      };

      await requestsApi.updateRequest(requestId, payload);
      toast.success('需求更新成功');
      router.push(`/requests/${requestId}`);
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('更新需求失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    
    try {
      await requestsApi.deleteRequest(requestId);
      toast.success('需求已删除');
      router.push('/requests');
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('删除需求失败');
    } finally {
      setDeleteLoading(false);
      // 关闭对话框
      const el = document.querySelector('[data-state="open"][role="dialog"]');
      if (el) (el as HTMLElement).dataset.state = 'closed';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">编辑需求</h1>
          <Card className="animate-pulse">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="h-10 bg-muted rounded w-full" />
                <div className="h-40 bg-muted rounded w-full" />
                <div className="h-10 bg-muted rounded w-full" />
                <div className="h-10 bg-muted rounded w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">编辑需求</h1>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">删除需求</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认删除</DialogTitle>
              </DialogHeader>
              <p className="py-4">确定要删除此需求吗？此操作无法撤销。</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  const el = document.querySelector('[data-state="open"][role="dialog"]');
                  if (el) (el as HTMLElement).dataset.state = 'closed';
                }}>
                  取消
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? '删除中...' : '确认删除'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>需求信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">需求标题</Label>
                <Input
                  id="title"
                  placeholder="输入简短明了的标题..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">详细描述</Label>
                <Textarea
                  id="content"
                  placeholder="详细描述您的需求，包括具体要求、预期结果等..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px]"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">需求分类</Label>
                  <Select value={categoryId} onValueChange={setCategoryId} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">优先级</Label>
                  <Select 
                    value={priority} 
                    onValueChange={(val) => setPriority(val as RequestPriority)}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="选择优先级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RequestPriority.LOW}>低</SelectItem>
                      <SelectItem value={RequestPriority.NORMAL}>中</SelectItem>
                      <SelectItem value={RequestPriority.HIGH}>高</SelectItem>
                      <SelectItem value={RequestPriority.URGENT}>紧急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget">预算 (可选)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="您愿意为此需求支付的金额"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <p className="text-sm text-muted-foreground">
                  设置预算可以帮助您获得更精准的响应
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                asChild
              >
                <Link href={`/requests/${requestId}`}>取消</Link>
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
              >
                {submitting ? '保存中...' : '保存修改'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 