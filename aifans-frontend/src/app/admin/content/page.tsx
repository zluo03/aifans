'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Image, ArrowLeft, Film, Video, Tag, Play, Archive } from 'lucide-react';
import { useAuth } from '@/hooks';
import { toast } from 'sonner';

export default function ContentAdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // 权限检查
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      toast.error('没有访问权限');
    }
  }, [user, router]);

  const contentFeatures = [
    {
      title: "笔记管理",
      description: "管理用户发布的学习笔记",
      href: "/admin/content/notes",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      title: "笔记类别管理",
      description: "管理笔记的分类，添加、编辑和删除类别",
      href: "/admin/content/note-categories",
      icon: <Tag className="w-6 h-6" />,
    },
    {
      title: "资源分类管理",
      description: "管理资源的分类标签，设置资源类别",
      href: "/admin/content/resource-categories",
      icon: <Archive className="w-6 h-6" />,
    },
    {
      title: "灵贴管理",
      description: "管理用户发布的AI作品灵贴",
      href: "/admin/content/posts",
      icon: <Image className="w-6 h-6" />,
    },
    {
      title: "灵感管理",
      description: "管理灵感模块中的图片与视频内容",
      href: "/admin/content/inspirations",
      icon: <Film className="w-6 h-6" />,
    },
    {
      title: "影院管理",
      description: "管理影院模块中的视频内容和权限",
      href: "/admin/content/screenings",
      icon: <Video className="w-6 h-6" />,
    },
    {
      title: "上传管理",
      description: "管理各模块的文件上传限制和配置",
      href: "/admin/content/videos",
      icon: <Play className="w-6 h-6" />,
    },
  ];

  if (!user || user.role !== 'ADMIN') {
    return null; // 权限检查中，不渲染内容
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>内容管理</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              管理网站上的笔记、帖子、素材和影片内容
            </p>
          </div>
          <Link 
            href="/admin"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回管理首页</span>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {contentFeatures.map((feature) => (
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
        </CardContent>
      </Card>
    </div>
  );
} 