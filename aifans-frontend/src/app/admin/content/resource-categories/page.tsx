'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';

interface ResourceCategory {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    resources: number;
  };
}

export default function ResourceCategoriesPage() {
  const { token } = useAuthStore();
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ResourceCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    if (!token) {
      toast.error('请先登录');
      return;
    }

    try {
      setLoading(true);
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await fetch('/api/resource-categories', {
        headers: {
          'Authorization': formattedToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '获取分类失败');
      }

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('获取分类失败:', error);
      toast.error(error instanceof Error ? error.message : '获取分类失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }

    if (!token) {
      toast.error('请先登录');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingCategory 
        ? `/api/resource-categories/${editingCategory.id}`
        : '/api/resource-categories';
      
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await fetch(url, {
        method: editingCategory ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': formattedToken,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '操作失败');
      }

      toast.success(editingCategory ? '分类更新成功' : '分类创建成功');
      setDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('操作失败:', error);
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: ResourceCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (category: ResourceCategory) => {
    if (category._count.resources > 0) {
      toast.error(`无法删除分类，还有 ${category._count.resources} 个资源正在使用此分类`);
      return;
    }

    if (!confirm(`确定要删除分类"${category.name}"吗？`)) {
      return;
    }

    if (!token) {
      toast.error('请先登录');
      return;
    }

    try {
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await fetch(`/api/resource-categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': formattedToken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '删除失败');
      }

      toast.success('分类删除成功');
      fetchCategories();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingCategory(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Archive className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">资源分类管理</h1>
            <p className="text-gray-500">管理资源的分类标签</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新建分类
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? '编辑分类' : '新建分类'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">分类名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入分类名称"
                  maxLength={50}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">分类描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入分类描述（可选）"
                  maxLength={200}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? '保存中...' : '保存'}
                </Button>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  取消
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>分类列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无分类</h3>
              <p className="text-gray-500 mb-4">还没有创建任何资源分类</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                创建第一个分类
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>分类名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>资源数量</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {category.description || '无描述'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {category._count.resources} 个资源
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(category.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category)}
                          disabled={category._count.resources > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 