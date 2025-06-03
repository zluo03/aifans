'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

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
}

interface AnnouncementModalProps {
  onClose?: () => void;
}

export default function AnnouncementModal({ onClose }: AnnouncementModalProps) {
  const { user, token } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewedAnnouncements, setViewedAnnouncements] = useState<Set<number>>(new Set());

  // 获取有效公告
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        
        // 构建请求头，如果用户已登录则传递认证信息
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (user && token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // 直接使用fetch API来避免axios的复杂配置问题
        const response = await fetch('/api/announcements', {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const activeAnnouncements = await response.json();
        
        if (activeAnnouncements && activeAnnouncements.length > 0) {
          setAnnouncements(activeAnnouncements);
          setIsOpen(true);
        }
      } catch (error) {
        // 静默失败，不显示错误提示
      } finally {
        setIsLoading(false);
      }
    };

    // 获取公告（对所有用户可见，包括游客）
    fetchAnnouncements();
  }, [user, token]);



  // 记录用户查看公告
  const markAnnouncementAsViewed = async (announcementId: number) => {
    if (!user || !token) return; // 游客不记录查看状态
    if (viewedAnnouncements.has(announcementId)) return; // 避免重复记录
    
    try {
      // 先标记为已查看，避免重复请求
      setViewedAnnouncements(prev => new Set(prev).add(announcementId));
      
      await fetch(`/api/announcements/${announcementId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      // 如果请求失败，移除标记
      setViewedAnnouncements(prev => {
        const newSet = new Set(prev);
        newSet.delete(announcementId);
        return newSet;
      });
      // 静默失败，不影响用户体验
    }
  };

  // 关闭弹框
  const handleClose = async () => {
    // 如果用户已登录，记录当前显示的公告为已查看
    if (user && announcements.length > 0) {
      const currentAnnouncement = announcements[currentIndex];
      if (currentAnnouncement) {
        await markAnnouncementAsViewed(currentAnnouncement.id);
      }
    }
    
    setIsOpen(false);
    onClose?.();
  };

  // 切换到指定索引的公告（带动画）
  const switchToIndex = (newIndex: number) => {
    if (newIndex === currentIndex || isAnimating) return;
    
    setIsAnimating(true);
    setCurrentIndex(newIndex);
    
    // 动画完成后重置状态
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  // 上一个公告
  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : announcements.length - 1;
    switchToIndex(newIndex);
  };

  // 下一个公告
  const handleNext = () => {
    const newIndex = currentIndex < announcements.length - 1 ? currentIndex + 1 : 0;
    switchToIndex(newIndex);
  };

  // 跳转到详情页
  const handleViewDetail = async () => {
    const announcement = announcements[currentIndex];
    if (announcement) {
      // 如果用户已登录，记录公告为已查看
      if (user) {
        await markAnnouncementAsViewed(announcement.id);
      }
      
      setIsOpen(false);
      onClose?.();
      
      // 直接跳转到公告详情页
      window.location.href = `/announcements/${announcement.id}`;
    }
  };

  // 如果正在加载或没有公告，不显示弹框
  if (isLoading || announcements.length === 0) {
    return null;
  }

  // 处理Dialog的onOpenChange事件（点击空白区域关闭）
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      onClose?.();
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTitle className="sr-only">公告</DialogTitle>
      <DialogContent 
        className="w-full p-0 overflow-hidden [&>button]:hidden"
        style={{ 
          height: '50vh',
          width: 'calc(50vh * 16 / 9)',
          maxWidth: '90vw'
        }}
      >
        <div className="relative w-full h-full bg-background overflow-hidden">
          {/* 关闭按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 text-white border-0 rounded-full backdrop-blur-sm"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* 左右滑动按钮 - 只有多个公告时显示 */}
          {announcements.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white border-0 rounded-full backdrop-blur-sm disabled:opacity-50"
                onClick={handlePrevious}
                disabled={isAnimating}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-16 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white border-0 rounded-full backdrop-blur-sm disabled:opacity-50"
                onClick={handleNext}
                disabled={isAnimating}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* 公告图片容器 - 支持滑动动画 */}
          <div className="w-full h-full relative overflow-hidden">
            <div 
              className="flex h-full transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {announcements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  className="w-full h-full flex-shrink-0 relative overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={index === currentIndex ? handleViewDetail : undefined}
                >
                  {announcement.imageUrl ? (
                    <img
                      src={announcement.imageUrl}
                      alt={announcement.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                      <div className="text-center">
                        <div className="text-lg font-medium">{announcement.title}</div>
                        <div className="text-sm">暂无图片</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 导航指示器 - 只有多个公告时显示 */}
          {announcements.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {announcements.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-white scale-110' 
                      : 'bg-white/50 hover:bg-white/70 hover:scale-105'
                  } ${isAnimating ? 'pointer-events-none' : ''}`}
                  onClick={() => switchToIndex(index)}
                  disabled={isAnimating}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 