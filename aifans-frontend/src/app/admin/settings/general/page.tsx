'use client';

import Link from 'next/link';
import { ArrowLeftIcon, AlertCircleIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GeneralSettingsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/admin/settings" 
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          返回设置
        </Link>
        <h1 className="text-2xl font-bold">基本设置</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircleIcon className="h-5 w-5 text-amber-500" />
            功能开发中
          </CardTitle>
          <CardDescription>
            系统基本设置功能正在开发中，敬请期待。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            此页面将提供系统基本参数配置功能，包括站点名称、描述、联系方式等信息设置。
          </p>
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-md">
            <p className="text-amber-600 dark:text-amber-400 text-sm">
              功能开发中，预计下一版本上线。如有紧急需求，请联系技术支持。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 