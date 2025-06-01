'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/lib/store/auth-store';
import { membershipApi, MembershipProduct } from '@/lib/api/membership';
import { Loader2, Crown, Check, Star } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
const QrcodeWrapper = dynamic(() => import('@/components/ui/QrcodeWrapper'), { ssr: false });
import axios from 'axios';

export default function MembershipPage() {
  const [products, setProducts] = useState<MembershipProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payQrUrl, setPayQrUrl] = useState('');
  const [payOrderId, setPayOrderId] = useState<number|null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payPolling, setPayPolling] = useState(false);
  const [payStatus, setPayStatus] = useState<'PENDING'|'SUCCESS'|'FAILED'|null>(null);
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await membershipApi.user.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('获取会员产品失败:', error);
      toast({
        title: '获取会员产品失败',
        description: '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (product: MembershipProduct) => {
    if (!isAuthenticated) {
      toast({
        title: '请先登录',
        description: '购买会员需要先登录账户',
      });
      return;
    }
    setPayLoading(true);
    setPayStatus(null);
    try {
      const res = await axios.post('/api/payments/create-order', { productId: product.id });
      setPayQrUrl(res.data.paymentUrl);
      setPayOrderId(res.data.orderId);
      setPayDialogOpen(true);
      setPayPolling(true);
    } catch (e: any) {
      toast({ title: '下单失败', description: e?.response?.data?.message || e.message });
    } finally {
      setPayLoading(false);
    }
  };

  // 轮询订单状态
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (payPolling && payOrderId) {
      const poll = async () => {
        try {
          const res = await axios.get(`/api/payments/order-status/${payOrderId}`);
          if (res.data.status === 'SUCCESS') {
            setPayStatus('SUCCESS');
            setPayPolling(false);
            toast({ title: '支付成功', description: '会员已自动升级' });
            setTimeout(() => {
              setPayDialogOpen(false);
              window.location.reload();
            }, 1500);
            return;
          } else if (res.data.status === 'FAILED') {
            setPayStatus('FAILED');
            setPayPolling(false);
            toast({ title: '支付失败', description: '订单已关闭或失败' });
            return;
          }
        } catch {}
        timer = setTimeout(poll, 2000);
      };
      poll();
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [payPolling, payOrderId]);

  const formatDuration = (days: number) => {
    if (days === 0) return '终身';
    if (days >= 365) {
      const years = Math.floor(days / 365);
      return `${years}年`;
    } else if (days >= 30) {
      const months = Math.floor(days / 30);
      return `${months}个月`;
    } else {
      return `${days}天`;
    }
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'LIFETIME':
        return <Star className="h-6 w-6 text-yellow-500" />;
      default:
        return <Crown className="h-6 w-6 text-blue-500" />;
    }
  };

  const getProductBadgeVariant = (type: string) => {
    switch (type) {
      case 'LIFETIME':
        return 'destructive';
      case 'PREMIUM_ANNUAL':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getProductTypeText = (type: string) => {
    switch (type) {
      case 'PREMIUM_MONTHLY':
        return '月度会员';
      case 'PREMIUM_QUARTERLY':
        return '季度会员';
      case 'PREMIUM_ANNUAL':
        return '年度会员';
      case 'LIFETIME':
        return '终身会员';
      default:
        return type;
    }
  };

  const getCurrentMembershipStatus = () => {
    if (!user) return null;
    
    if (user.role === 'LIFETIME') {
      return {
        type: '终身会员',
        status: '永久有效',
        variant: 'destructive' as const,
      };
    } else if (user.role === 'PREMIUM') {
      const expiryDate = user.premiumExpiryDate ? new Date(user.premiumExpiryDate) : null;
      const isExpired = expiryDate && expiryDate < new Date();
      
      return {
        type: '高级会员',
        status: isExpired ? '已过期' : expiryDate ? `到期时间：${expiryDate.toLocaleDateString()}` : '有效',
        variant: isExpired ? 'secondary' as const : 'default' as const,
      };
    }
    
    return null;
  };

  const membershipStatus = getCurrentMembershipStatus();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Crown className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">会员服务</h1>
          <p className="text-muted-foreground mb-6">
            请先登录以查看和购买会员服务
          </p>
          <Link href="/login">
            <Button>立即登录</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Crown className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">会员服务</h1>
        <p className="text-muted-foreground">
          升级会员，享受更多专属权益和功能
        </p>
      </div>

      {/* 当前会员状态 */}
      {membershipStatus && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              当前会员状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={membershipStatus.variant}>
                  {membershipStatus.type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {membershipStatus.status}
                </span>
              </div>
              {user.role !== 'LIFETIME' && (
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm">
                    使用兑换码
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 会员权益说明 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>会员权益</CardTitle>
          <CardDescription>升级会员后您将享受以下专属权益</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">访问灵贴功能</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">高级资源下载</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">专属客服支持</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">无广告体验</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">优先功能体验</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">会员专属内容</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 会员产品列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">暂无会员产品</p>
          </div>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="relative">
              {product.type === 'LIFETIME' && (
                <div className="absolute -top-2 -right-2">
                  <Badge variant="destructive" className="rounded-full">
                    推荐
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  {getProductIcon(product.type)}
                </div>
                <CardTitle>{product.title}</CardTitle>
                <CardDescription>
                  <Badge variant={getProductBadgeVariant(product.type)}>
                    {getProductTypeText(product.type)}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-primary">
                    ¥{product.price}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    有效期：{formatDuration(product.durationDays)}
                  </div>
                </div>
                
                {product.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {product.description}
                  </p>
                )}

                <Button 
                  className="w-full" 
                  onClick={() => handlePurchase(product)}
                  disabled={user?.role === 'LIFETIME' || payLoading}
                >
                  {payLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {user?.role === 'LIFETIME' ? '已是终身会员' : '立即购买'}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 购买说明 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>购买说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 会员服务自购买成功后立即生效</p>
            <p>• 会员时长可累加，不会覆盖现有会员时间</p>
            <p>• 终身会员享受永久服务，无需续费</p>
            <p>• 如有问题请联系客服获得帮助</p>
          </div>
        </CardContent>
      </Card>

      {/* 支付二维码弹窗 */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>支付宝扫码支付</DialogTitle>
          </DialogHeader>
          {payQrUrl ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <QrcodeWrapper value={payQrUrl} size={200} />
              <div className="text-sm text-muted-foreground">请使用支付宝App扫码完成支付</div>
              {payStatus === 'SUCCESS' && <div className="text-green-600 font-bold">支付成功，会员已升级！</div>}
              {payStatus === 'FAILED' && <div className="text-red-600 font-bold">支付失败，请重试</div>}
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 