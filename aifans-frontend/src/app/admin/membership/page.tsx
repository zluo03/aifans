'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { 
  PackageIcon, 
  ShoppingCartIcon, 
  ArrowLeftIcon, 
  UsersIcon, 
  GiftIcon, 
  SettingsIcon 
} from 'lucide-react';

export default function MembershipDashboardPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/admin" 
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          返回
        </Link>
        <h1 className="text-2xl font-bold">会员管理</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/membership/members">
          <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-md bg-yellow-500/10 text-yellow-600">
                <UsersIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>会员管理</CardTitle>
                <CardDescription>查看和管理所有会员用户</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                查看高级会员和终身会员列表，管理会员状态和到期时间，支持搜索和筛选功能。
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/membership/products">
          <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <PackageIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>会员产品管理</CardTitle>
                <CardDescription>管理会员产品、价格和服务周期</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                创建和管理会员产品套餐，设置价格、服务周期和产品描述，为用户提供多样化的会员选择。
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/membership/redemption-codes">
          <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-md bg-blue-500/10 text-blue-600">
                <GiftIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>兑换码管理</CardTitle>
                <CardDescription>生成和管理会员兑换码</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                生成会员兑换码，设置有效期和使用次数，查看兑换记录和使用状态，方便推广和用户激励。
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/membership/orders">
          <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-md bg-green-500/10 text-green-600">
                <ShoppingCartIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>会员订单管理</CardTitle>
                <CardDescription>查看和管理用户会员订单</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                查看所有会员订单的支付状态、交易记录和详情，跟踪会员订阅的情况，方便财务管理和数据分析。
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/membership/payment-settings">
          <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-md bg-purple-500/10 text-purple-600">
                <SettingsIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>支付管理</CardTitle>
                <CardDescription>配置支付宝等支付方式</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                配置支付宝支付参数，设置应用密钥和网关地址，测试支付功能，确保支付流程正常运行。
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
} 