'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api/api';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';

interface DemandCategory {
  id: number;
  name: string;
  colorHex: string;
}

export default function DemandCategoriesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [categories, setCategories] = useState<DemandCategory[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', colorHex: '#3B82F6' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查用户是否为管理员
    if (!user || user.role !== 'ADMIN') {
      toast.error('你没有权限访问此页面');
      router.push('/');
      return;
    }

    fetchCategories();
  }, [user, router]);

  async function fetchCategories() {
    try {
      const { data } = await api.get('/admin/request-categories');
      setCategories(data);
    } catch (error) {
      toast.error('获取需求分类失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory() {
    if (!newCategory.name) {
      toast.error('请输入分类名称');
      return;
    }

    try {
      await api.post('/admin/request-categories', newCategory);
      toast.success('创建成功');
      setNewCategory({ name: '', colorHex: '#3B82F6' });
      fetchCategories();
    } catch (error) {
      toast.error('创建分类失败');
    }
  }

  async function handleDeleteCategory(id: number) {
    try {
      await api.delete(`/admin/request-categories/${id}`);
      toast.success('删除成功');
      fetchCategories();
    } catch (error) {
      toast.error('删除分类失败');
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">需求分类管理</h1>
        <p className="text-muted-foreground">管理需求墙的分类与颜色</p>
      </div>
      
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>添加新分类</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">分类名称</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="输入分类名称"
                />
              </div>
              <div>
                <Label htmlFor="color">分类颜色</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={newCategory.colorHex}
                    onChange={(e) => setNewCategory({...newCategory, colorHex: e.target.value})}
                    className="w-16"
                  />
                  <Input
                    value={newCategory.colorHex}
                    onChange={(e) => setNewCategory({...newCategory, colorHex: e.target.value})}
                    placeholder="#HEX颜色码"
                  />
                </div>
              </div>
              <Button className="md:col-span-2" onClick={handleAddCategory}>添加分类</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>需求分类列表</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">加载中...</div>
            ) : categories.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">暂无分类，请添加</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>颜色</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.id}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ backgroundColor: category.colorHex }}
                          />
                          {category.colorHex}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          删除
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 