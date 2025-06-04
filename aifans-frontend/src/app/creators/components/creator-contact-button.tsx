import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { CreatorContactDialog } from './creator-contact-dialog';
import { api } from '@/lib/api/api';
import { toast } from 'sonner';

interface CreatorContactButtonProps {
  creatorId: number;
  userId?: number;
  isSelf?: boolean;
}

export function CreatorContactButton({ creatorId, userId, isSelf = false }: CreatorContactButtonProps) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 获取未读消息数
  useEffect(() => {
    if (isSelf) {
      fetchUnreadCount();
    }
  }, [isSelf]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/users/messages/unread-count');
      setUnreadCount(response.data.total || 0);
    } catch (error) {
      console.error('获取未读消息数失败', error);
    }
  };

  const handleContactClick = async () => {
    if (isSelf) {
      // 如果是自己的主页，直接打开消息列表
      setOpen(true);
    } else {
      // 如果是别人的主页，首先创建联系人关系
      try {
        setLoading(true);
        // 创建联系人关系，确保对方在聊天列表中
        await api.post(`/users/contacts/create/${creatorId}`);
        setOpen(true);
      } catch (error: any) {
        toast.error(error.response?.data?.message || '创建联系失败');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Button
        onClick={handleContactClick}
        className="flex items-center gap-2 rounded-full bg-primary text-white hover:bg-primary/90"
        disabled={loading}
      >
        <MessageCircle className="h-4 w-4" />
        <span>{loading ? '处理中...' : '联络'}</span>
        {isSelf && unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </Button>
      
      <CreatorContactDialog 
        open={open} 
        onOpenChange={setOpen}
        creatorId={creatorId}
        unreadCount={unreadCount}
      />
    </>
  );
} 