'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, isValid, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { noteCategoriesApi } from '@/lib/api';
import { NoteCategory } from '@/types';

// 安全的日期格式化函数
const safeDateFormat = (dateString: string | undefined | null, formatStr: string = 'yyyy-MM-dd HH:mm'): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isValid(date)) {
      return format(date, formatStr);
    }
    return '-';
  } catch (error) {
    console.warn('Invalid date format:', dateString);
    return '-';
  }
};

export default function AdminNoteCategoriesPage() {
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // 获取类别列表
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await noteCategoriesApi.admin.getAllCategories();
      setCategories(data);
    } catch (error) {
      toast.error('获取类别列表失败', {
        description: '请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 处理创建类别
  const handleCreate = () => {
    setFormData({ name: '', description: '' });
    setShowCreateDialog(true);
  };

  // 处理编辑类别
  const handleEdit = (category: NoteCategory) => {
    setSelectedCategory(category);
    setFormData({ 
      name: category.name, 
      description: category.description || '' 
    });
    setShowEditDialog(true);
  };

  // 处理删除类别
  const handleDelete = (category: NoteCategory) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  // 提交创建表单
  const submitCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入类别名称');
      return;
    }

    setSubmitting(true);
    try {
      await noteCategoriesApi.admin.createCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
      
      toast.success('类别创建成功');
      setShowCreateDialog(false);
      fetchCategories();
    } catch (error: any) {
      toast.error('创建类别失败', {
        description: error.response?.data?.message || '请稍后重试'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 提交编辑表单
  const submitEdit = async () => {
    if (!selectedCategory || !formData.name.trim()) {
      toast.error('请输入类别名称');
      return;
    }

    setSubmitting(true);
    try {
      await noteCategoriesApi.admin.updateCategory(selectedCategory.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
      
      toast.success('类别更新成功');
      setShowEditDialog(false);
      fetchCategories();
    } catch (error: any) {
      toast.error('更新类别失败', {
        description: error.response?.data?.message || '请稍后重试'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 确认删除类别
  const confirmDelete = async () => {
    if (!selectedCategory) return;

    setSubmitting(true);
    try {
      await noteCategoriesApi.admin.deleteCategory(selectedCategory.id);
      
      toast.success('类别删除成功');
      setShowDeleteDialog(false);
      fetchCategories();
    } catch (error: any) {
      toast.error('删除类别失败', {
        description: error.response?.data?.message || '请稍后重试'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">笔记类别管理</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          添加类别
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>类别列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      暂无类别
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.id}</TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell>
                        {safeDateFormat(category.createdAt)}
                      </TableCell>
                      <TableCell>
                        {safeDateFormat(category.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 创建类别对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>添加笔记类别</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">类别名称 *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入类别名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">描述</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入类别描述（可选）"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={submitCreate} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑类别对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑笔记类别</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">类别名称 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入类别名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入类别描述（可选）"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={submitEdit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>确定要删除类别 "<strong>{selectedCategory?.name}</strong>" 吗？</p>
            <p className="text-sm text-muted-foreground mt-2">
              注意：删除类别可能会影响使用该类别的笔记，请谨慎操作。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 