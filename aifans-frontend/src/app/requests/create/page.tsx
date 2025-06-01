'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Separator } from '@/components/ui/separator';
import { requestsApi, requestCategoriesApi } from '@/lib/api';
import { RequestCategory, RequestPriority } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';
import Link from 'next/link';

export default function CreateRequestPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState(RequestPriority.NORMAL);
  const [budget, setBudget] = useState('');
  const [categories, setCategories] = useState<RequestCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 如果用户未登录，重定向到登录页
    if (!user && !isLoading) {
      router.push('/login');
    }

    // 获取分类数据
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const categoriesData = await requestCategoriesApi.getAllCategories();
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setCategoryId(categoriesData[0].id.toString());
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('获取分类失败');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [router, user, isLoading]);

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

      const newRequest = await requestsApi.createRequest(payload);
      toast.success('需求发布成功');
      router.push(`/requests/${newRequest.id}`);
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('发布需求失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">发布需求</h1>
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
        <h1 className="text-3xl font-bold mb-6">发布需求</h1>
        
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
                  <Select value={priority} onValueChange={(val) => setPriority(val as RequestPriority)}>
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
              <Button variant="outline" asChild>
                <Link href="/requests">取消</Link>
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '提交中...' : '发布需求'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 