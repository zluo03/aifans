'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { AuthWrapper } from '@/components/auth-wrapper';
import { socialMediaApi } from '@/lib/api/social-media';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SocialMedia {
  id: number;
  name: string;
  logoUrl: string;
  qrCodeUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SocialMediaForm {
  name: string;
  sortOrder: number;
  isActive: boolean;
}

interface FileUpload {
  logo: File | null;
  qrCode: File | null;
}

export default function SocialMediaManagement() {
  const { token } = useAuthStore();
  const [socialMediaList, setSocialMediaList] = useState<SocialMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SocialMedia | null>(null);
  const [formData, setFormData] = useState<SocialMediaForm>({
    name: '',
    sortOrder: 0,
    isActive: true,
  });
  const [fileUploads, setFileUploads] = useState<FileUpload>({
    logo: null,
    qrCode: null,
  });

  // 获取社交媒体列表
  const fetchSocialMedia = async () => {
    if (!token) {
      console.error('未找到认证token');
      toast.error('请先登录');
      return;
    }

    try {
      setLoading(true);
      console.log('当前token:', token);
      
      // 确保token格式正确
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      console.log('认证头:', formattedToken);
      
      const response = await fetch('/api/social-media/admin', {
        headers: {
          'Authorization': formattedToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API错误响应:', {
          status: response.status,
          data: errorData,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`获取列表失败: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('获取到的社交媒体数据:', data);
      setSocialMediaList(data);
    } catch (error) {
      console.error('获取社交媒体列表失败:', error);
      toast.error(error instanceof Error ? error.message : '获取社交媒体列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialMedia();
  }, []);

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      sortOrder: 0,
      isActive: true,
    });
    setFileUploads({
      logo: null,
      qrCode: null,
    });
    setEditingItem(null);
  };

  // 打开创建对话框
  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (item: SocialMedia) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setFileUploads({
      logo: null,
      qrCode: null,
    });
    setIsDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('请先登录');
      return;
    }

    // 验证文件上传（创建时必须上传，编辑时可选）
    if (!editingItem && (!fileUploads.logo || !fileUploads.qrCode)) {
      toast.error('请上传logo和二维码图片');
      return;
    }

    try {
      const url = editingItem 
        ? `/api/social-media/${editingItem.id}`
        : '/api/social-media';
      
      const method = editingItem ? 'PATCH' : 'POST';

      // 使用FormData支持文件上传
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('sortOrder', formData.sortOrder.toString());
      formDataToSend.append('isActive', formData.isActive.toString());

      if (fileUploads.logo) {
        formDataToSend.append('logo', fileUploads.logo);
      }

      if (fileUploads.qrCode) {
        formDataToSend.append('qrCode', fileUploads.qrCode);
      }

      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': formattedToken
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${editingItem ? '更新失败' : '创建失败'}: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      toast.success(editingItem ? '更新成功' : '创建成功');
      setIsDialogOpen(false);
      resetForm();
      fetchSocialMedia();
    } catch (error) {
      console.error('操作失败:', error);
      toast.error(error instanceof Error ? error.message : (editingItem ? '更新失败' : '创建失败'));
    }
  };

  // 删除社交媒体
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个社交媒体吗？')) {
      return;
    }

    try {
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await fetch(`/api/social-media/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': formattedToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`删除失败: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      toast.success('删除成功');
      fetchSocialMedia();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  // 移动排序
  const moveItem = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = socialMediaList.findIndex(item => item.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= socialMediaList.length) return;

    const items = Array.from(socialMediaList);
    const [movedItem] = items.splice(currentIndex, 1);
    items.splice(newIndex, 0, movedItem);

    // 更新本地状态
    setSocialMediaList(items);

    // 更新排序
    const sortData = items.map((item, index) => ({
      id: item.id,
      sortOrder: index,
    }));

    try {
      // 使用正确的API路径
      const response = await fetch('/api/social-media/sort', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sortData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('更新排序失败:', response.status, errorData);
        throw new Error(`更新排序失败: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      toast.success('排序更新成功');
    } catch (error) {
      console.error('更新排序失败:', error);
      toast.error(error instanceof Error ? error.message : '更新排序失败');
      // 恢复原始排序
      fetchSocialMedia();
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <AuthWrapper requiredRole="ADMIN">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">社交媒体管理</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                添加社交媒体
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? '编辑社交媒体' : '添加社交媒体'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">名称</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="logo">Logo图片 (SVG/WebP/PNG)</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept=".svg,.webp,.png,image/svg+xml,image/webp,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFileUploads({ ...fileUploads, logo: file });
                    }}
                    required={!editingItem}
                  />
                  {fileUploads.logo && (
                    <p className="text-sm text-gray-600 mt-1">
                      已选择: {fileUploads.logo.name}
                    </p>
                  )}
                  {editingItem && editingItem.logoUrl && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">当前图片:</p>
                      <img 
                        src={editingItem.logoUrl.startsWith('http') ? editingItem.logoUrl : `${BACKEND_URL}${editingItem.logoUrl}`}
                        alt="当前logo"
                        className="w-16 h-16 object-contain border rounded"
                        onError={(e) => {
                          console.error('当前Logo预览加载失败:', editingItem.logoUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="qrCode">二维码图片 (SVG/WebP/PNG)</Label>
                  <Input
                    id="qrCode"
                    type="file"
                    accept=".svg,.webp,.png,image/svg+xml,image/webp,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFileUploads({ ...fileUploads, qrCode: file });
                    }}
                    required={!editingItem}
                  />
                  {fileUploads.qrCode && (
                    <p className="text-sm text-gray-600 mt-1">
                      已选择: {fileUploads.qrCode.name}
                    </p>
                  )}
                  {editingItem && editingItem.qrCodeUrl && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">当前图片:</p>
                      <img 
                        src={editingItem.qrCodeUrl.startsWith('http') ? editingItem.qrCodeUrl : `${BACKEND_URL}${editingItem.qrCodeUrl}`}
                        alt="当前二维码"
                        className="w-16 h-16 object-contain border rounded"
                        onError={(e) => {
                          console.error('当前二维码预览加载失败:', editingItem.qrCodeUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="sortOrder">排序顺序</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">启用</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit">
                    {editingItem ? '更新' : '创建'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>社交媒体列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>二维码</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {socialMediaList.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <img 
                        src={item.logoUrl.startsWith('http') ? item.logoUrl : `${BACKEND_URL}${item.logoUrl}`}
                        alt={item.name}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          console.error('Logo加载失败:', item.logoUrl);
                          e.currentTarget.src = '/images/placeholder.svg';
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <img 
                        src={item.qrCodeUrl.startsWith('http') ? item.qrCodeUrl : `${BACKEND_URL}${item.qrCodeUrl}`}
                        alt={`${item.name} 二维码`}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          console.error('二维码加载失败:', item.qrCodeUrl);
                          e.currentTarget.src = '/images/placeholder.svg';
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{item.sortOrder}</span>
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveItem(item.id, 'up')}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveItem(item.id, 'down')}
                            disabled={index === socialMediaList.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? '启用' : '禁用'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
} 