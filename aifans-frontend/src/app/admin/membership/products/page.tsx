'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api/api';

// 会员产品类型定义
interface MembershipProduct {
  id: number;
  title: string;
  description: string | null;
  price: number;
  durationDays: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

// 表单验证模式
const productFormSchema = z.object({
  title: z.string().min(2, '标题至少需要2个字符'),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, '价格必须大于0'),
  durationDays: z.coerce.number().int('必须是整数').min(0, '不能为负数'),
  type: z.string().min(1, '请选择会员类型'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function MembershipProductsPage() {
  const [products, setProducts] = useState<MembershipProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<MembershipProduct | null>(null);
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      durationDays: 30,
      type: 'PREMIUM_MONTHLY',
    },
  });

  // 获取所有会员产品
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/membership/products');
      setProducts(response.data);
    } catch (error) {
      toast({
        title: '获取会员产品失败',
        description: '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 打开创建对话框
  const handleAddNew = () => {
    form.reset();
    setIsEditing(false);
    setCurrentProduct(null);
    setOpenDialog(true);
  };

  // 打开编辑对话框
  const handleEdit = (product: MembershipProduct) => {
    form.reset({
      title: product.title,
      description: product.description || '',
      price: product.price,
      durationDays: product.durationDays,
      type: product.type,
    });
    setIsEditing(true);
    setCurrentProduct(product);
    setOpenDialog(true);
  };

  // 删除产品
  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个会员产品吗？')) return;
    
    try {
      await api.delete(`/api/admin/membership/products/${id}`);
      toast({ title: '删除成功' });
      fetchProducts();
    } catch (error) {
      toast({
        title: '删除失败',
        description: '请稍后重试',
      });
    }
  };

  // 提交表单
  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (isEditing && currentProduct) {
        await api.patch(`/api/admin/membership/products/${currentProduct.id}`, data);
        toast({ title: '更新成功' });
      } else {
        await api.post('/api/admin/membership/products', data);
        toast({ title: '创建成功' });
      }
      setOpenDialog(false);
      fetchProducts();
    } catch (error) {
      toast({
        title: isEditing ? '更新失败' : '创建失败',
        description: '请稍后重试',
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">会员产品管理</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          添加产品
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>会员产品列表</CardTitle>
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
                  <TableHead>标题</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>有效期(天)</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      暂无会员产品
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.id}</TableCell>
                      <TableCell className="font-medium">{product.title}</TableCell>
                      <TableCell>¥{product.price}</TableCell>
                      <TableCell>
                        {product.durationDays === 0 ? '终身' : `${product.durationDays}天`}
                      </TableCell>
                      <TableCell>{product.type}</TableCell>
                      <TableCell>
                        {format(new Date(product.createdAt), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDelete(product.id)}
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

      {/* 添加/编辑对话框 */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? '编辑会员产品' : '创建会员产品'}</DialogTitle>
          </DialogHeader>
          <Form form={form} onSubmit={onSubmit}>
            <Controller
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标题</FormLabel>
                  <FormControl>
                    <Input placeholder="例：月度会员" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="会员权益说明"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>价格</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="29.90"
                      step="0.01" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="durationDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>有效期(天)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="30 (输入0代表终身会员)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>会员类型</FormLabel>
                  <FormControl>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      {...field}
                    >
                      <option value="PREMIUM_MONTHLY">月度会员</option>
                      <option value="PREMIUM_QUARTERLY">季度会员</option>
                      <option value="PREMIUM_ANNUAL">年度会员</option>
                      <option value="LIFETIME">终身会员</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? '保存修改' : '创建产品'}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 