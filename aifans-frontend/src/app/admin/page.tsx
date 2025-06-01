"use client";

import { useAuthStore } from "@/lib/store/auth-store";
import Link from "next/link";
import { 
  Users, 
  FileText, 
  Server, 
  Crown, 
  Settings, 
  Shield,
  ArrowLeft,
  Star,
  Megaphone,
  Share2
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuthStore();
  
  const adminFeatures = [
    {
      title: "用户管理",
      description: "管理所有用户账号，包括封禁、审核和权限设置",
      href: "/admin/users",
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: "公告管理",
      description: "管理系统公告，包括创建、编辑和发布公告",
      href: "/admin/announcements",
      icon: <Megaphone className="w-6 h-6" />,
    },
    {
      title: "内容管理",
      description: "管理网站内容，包括放映、笔记、需求等",
      href: "/admin/content",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      title: "创作者积分管理",
      description: "管理创作者积分系统，查看排行榜和批量更新积分",
      href: "/admin/creators",
      icon: <Star className="w-6 h-6" />,
    },
    {
      title: "AI平台管理",
      description: "管理AI平台列表和相关设置",
      href: "/admin/ai-platforms",
      icon: <Server className="w-6 h-6" />,
    },
    {
      title: "会员管理",
      description: "管理会员计划和订阅设置",
      href: "/admin/membership",
      icon: <Crown className="w-6 h-6" />,
    },
    {
      title: "系统设置",
      description: "管理网站基本设置和系统配置",
      href: "/admin/settings",
      icon: <Settings className="w-6 h-6" />,
    },
    {
      title: "敏感词管理",
      description: "管理系统敏感词过滤设置",
      href: "/admin/sensitive-words",
      icon: <Shield className="w-6 h-6" />,
    },
    {
      title: "社交媒体管理",
      description: "管理页脚社交媒体图标和二维码",
      href: "/admin/social-media",
      icon: <Share2 className="w-6 h-6" />,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">管理后台</h1>
          <p className="text-muted-foreground mt-2">
            欢迎回来，{user?.nickname || user?.username}
          </p>
        </div>
        <Link 
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回前台</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature) => (
          <Link 
            key={feature.href} 
            href={feature.href}
            className="group block p-6 bg-card hover:bg-accent border border-border rounded-lg transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                {feature.icon}
              </div>
              <h2 className="text-xl font-semibold">{feature.title}</h2>
            </div>
            <p className="text-muted-foreground group-hover:text-foreground transition-colors">
              {feature.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
} 