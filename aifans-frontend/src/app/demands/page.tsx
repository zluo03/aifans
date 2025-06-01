'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/api';
import { toast } from 'sonner';

interface RequestCategory {
  id: number;
  name: string;
  colorHex: string;
}

interface Request {
  id: number;
  title: string;
  content: string;
  categoryId: number;
  priority: string;
  status: string;
  budget?: number;
  createdAt: string;
  user: {
    id: number;
    nickname: string;
    username: string;
  };
}

export default function DemandsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [demands, setDemands] = useState<Request[]>([]);
  const [categories, setCategories] = useState<RequestCategory[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
    priority: 'NORMAL',
    budget: ''
  });

  useEffect(() => {
    const fetchDemands = async () => {
      try {
        const [demandsRes, categoriesRes] = await Promise.all([
          api.get('/requests'),
          api.get('/request-categories')
        ]);
        setDemands(demandsRes.data.requests || []);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error('Error fetching demands:', error);
        toast.error('获取需求数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchDemands();
  }, []);

  const handleSubmit = async () => {
    if (!user || !['PREMIUM', 'LIFETIME', 'ADMIN'].includes(user.role)) {
      toast.error('仅高级会员及以上可发布需求');
      return;
    }

    try {
      const payload = {
        ...formData,
        categoryId: parseInt(formData.categoryId),
        budget: formData.budget ? parseFloat(formData.budget) : undefined
      };
      
      await api.post('/requests', payload);
      toast.success('需求发布成功');
      setIsCreateOpen(false);
      
      // 重置表单
      setFormData({
        title: '',
        content: '',
        categoryId: '',
        priority: 'NORMAL',
        budget: ''
      });
      
      // 刷新需求列表
      const demandsRes = await api.get('/requests');
      setDemands(demandsRes.data.requests || []);
    } catch (error) {
      console.error('Error creating demand:', error);
      toast.error('发布需求失败');
    }
  };

  // 随机布局函数，生成便签风格的位置
  const getRandomPosition = (index: number) => {
    const baseAngle = (index % 10) * 2;
    return {
      transform: `rotate(${-5 + baseAngle}deg)`,
      marginTop: `${(index % 3) * 10}px`,
      marginLeft: `${(index % 5) * 5}px`,
      zIndex: 10 - (index % 10)
    };
  };

  // 高级会员及以上才能发布需求
  const canCreateDemand = user && ['PREMIUM', 'LIFETIME', 'ADMIN'].includes(user.role);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">需求墙</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canCreateDemand}>
              发布新需求
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>发布新需求</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">需求标题</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="简短描述您的需求"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">需求分类</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => setFormData({...formData, categoryId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="content">需求详情</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="详细描述您的需求"
                  rows={5}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">优先级</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData({...formData, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择优先级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">低</SelectItem>
                      <SelectItem value="NORMAL">中</SelectItem>
                      <SelectItem value="HIGH">高</SelectItem>
                      <SelectItem value="URGENT">紧急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="budget">预算(可选)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    placeholder="输入预算金额"
                  />
                </div>
              </div>
              <Button onClick={handleSubmit}>发布需求</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="py-16 text-center">加载中...</div>
      ) : demands.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="mb-4">暂无需求</p>
          {canCreateDemand && (
            <Button onClick={() => setIsCreateOpen(true)}>发布第一个需求</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {demands.map((demand, index) => {
            // 根据分类找到对应的颜色
            const category = categories.find(c => c.id === demand.categoryId);
            const bgColor = category?.colorHex || '#f8fafc';
            
            return (
              <div 
                key={demand.id}
                className="transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={getRandomPosition(index)}
              >
                <Card 
                  className="h-full overflow-hidden shadow-md cursor-pointer"
                  style={{ backgroundColor: bgColor, color: '#333' }}
                  onClick={() => router.push(`/demands/${demand.id}`)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 text-lg">{demand.title}</h3>
                    <p className="text-sm line-clamp-4 mb-3">{demand.content}</p>
                    <div className="flex justify-between items-center text-xs opacity-70">
                      <span>发布于 {new Date(demand.createdAt).toLocaleDateString()}</span>
                      <span>@{demand.user.nickname}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 