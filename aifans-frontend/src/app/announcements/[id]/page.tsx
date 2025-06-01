'use client';

import { useParams } from 'next/navigation';
import { api } from '@/lib/api/api';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

// 动态导入BlockNote查看器，禁用SSR
const BlockNoteViewer = dynamic(
  () => import('@/components/editor/block-note-viewer'),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-[400px]">加载中...</div>
  }
);

interface Announcement {
  id: number;
  title: string;
  content: any;
  imageUrl?: string;
  summary?: string;
  linkUrl?: string;
  showImage: boolean;
  showSummary: boolean;
  showLink: boolean;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export default function AnnouncementDetailPage() {
  const params = useParams();
  const announcementId = params.id as string;

  // 获取公告详情
  const { data: announcement, isLoading, error } = useQuery<Announcement>({
    queryKey: ['announcement', announcementId],
    queryFn: async () => {
      const response = await api.get<Announcement>(`announcements/${announcementId}`);
      return response.data;
    },
    enabled: !!announcementId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">加载公告内容中...</p>
        </div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">公告不存在</h1>
          <p className="text-muted-foreground">您访问的公告可能已被删除或不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 公告内容 - 使用BlockNote查看器 */}
          {announcement.content && (
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <BlockNoteViewer 
                content={JSON.stringify(announcement.content)}
                className="min-h-[400px]"
              />
            </div>
          )}
          
          {/* 如果没有内容，显示提示 */}
          {!announcement.content && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">此公告暂无内容</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 