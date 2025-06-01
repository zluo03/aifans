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
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { Loader2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// 订单状态对应的Badge
const OrderStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'PENDING':
      return <Badge variant="secondary">待支付</Badge>;
    case 'SUCCESS':
      return <Badge variant="success">支付成功</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">支付失败</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

// 支付订单接口
interface PaymentOrder {
  id: number;
  userId: number;
  productId: number;
  amount: number;
  status: string;
  alipayTradeNo: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    nickname: string | null;
    email: string;
  };
  product: {
    id: number;
    title: string;
    price: number;
    type: string;
  };
}

export default function PaymentOrdersPage() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const { toast } = useToast();

  // 获取所有支付订单
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/membership/orders');
      setOrders(response.data);
    } catch (error) {
      toast({
        title: '获取订单失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 查看订单详情
  const handleViewOrder = (order: PaymentOrder) => {
    setSelectedOrder(order);
    setShowDetailDialog(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">支付订单管理</h1>
        <Button onClick={fetchOrders} variant="outline">
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>支付订单列表</CardTitle>
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
                  <TableHead>订单ID</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>产品</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      暂无订单记录
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>
                        {order.user.nickname || order.user.username}
                        <div className="text-xs text-muted-foreground">
                          ID: {order.user.id}
                        </div>
                      </TableCell>
                      <TableCell>{order.product.title}</TableCell>
                      <TableCell>¥{order.amount}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 订单详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">订单ID</p>
                  <p>{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">状态</p>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">用户信息</p>
                <p>ID: {selectedOrder.user.id}</p>
                <p>用户名: {selectedOrder.user.username}</p>
                <p>昵称: {selectedOrder.user.nickname || '-'}</p>
                <p>邮箱: {selectedOrder.user.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">产品信息</p>
                <p>名称: {selectedOrder.product.title}</p>
                <p>价格: ¥{selectedOrder.product.price}</p>
                <p>类型: {selectedOrder.product.type}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">支付信息</p>
                <p>支付金额: ¥{selectedOrder.amount}</p>
                <p>支付宝交易号: {selectedOrder.alipayTradeNo || '-'}</p>
                <p>创建时间: {format(new Date(selectedOrder.createdAt), 'yyyy-MM-dd HH:mm:ss')}</p>
                <p>更新时间: {format(new Date(selectedOrder.updatedAt), 'yyyy-MM-dd HH:mm:ss')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 