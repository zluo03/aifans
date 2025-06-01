'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeftIcon, DatabaseIcon, SettingsIcon, MailIcon } from 'lucide-react';

export default function AdminSettingsPage() {
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
        <h1 className="text-2xl font-bold">系统设置</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/settings/storage">
          <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <DatabaseIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>存储管理</CardTitle>
                <CardDescription>管理文件存储和上传设置</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                配置文件上传限制、存储路径和策略，管理系统资源的存储和分配。
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/settings/mail">
          <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <MailIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>邮件设置</CardTitle>
                <CardDescription>配置SMTP邮件服务</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                设置邮件发送服务器、账号和端口等信息，用于发送注册验证和密码重置邮件。
              </p>
            </CardContent>
          </Card>
        </Link>
        
        {/* 可以在此添加更多设置项，如系统参数、邮件设置等 */}
        <Link href="/admin/settings/general">
          <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <SettingsIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>基本设置</CardTitle>
                <CardDescription>管理系统基本参数和配置</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                配置站点名称、描述、联系方式等基本信息，以及系统运行的关键参数。
                <span className="block mt-2 text-xs text-amber-500">（功能开发中）</span>
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
} 