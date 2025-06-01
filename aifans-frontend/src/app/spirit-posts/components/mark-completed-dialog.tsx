'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { spiritPostsApi } from '@/lib/api/spirit-posts';
import { toast } from 'sonner';

interface MarkCompletedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
  conversations: {
    user: {
      id: number;
      username: string;
      nickname: string;
      avatarUrl: string | null;
    };
    messages: any[];
    hasConversation: boolean;
  }[];
  onSuccess: () => void;
}

export function MarkCompletedDialog({
  open,
  onOpenChange,
  postId,
  conversations,
  onSuccess,
}: MarkCompletedDialogProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('请至少选择一个认领者');
      return;
    }

    try {
      setLoading(true);
      await spiritPostsApi.markCompleted(postId, {
        claimerIds: selectedUserIds,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('标记失败:', error);
      toast.error(error.response?.data?.message || '标记失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>标记已认领</DialogTitle>
          <DialogDescription>
            选择已完成任务的认领者（只显示已产生双向对话的用户）
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {conversations.length === 0 ? (
            <p className="text-center text-muted-foreground">
              暂无可选择的认领者
            </p>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <div
                  key={conv.user.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => handleToggleUser(conv.user.id)}
                >
                  <Checkbox
                    checked={selectedUserIds.includes(conv.user.id)}
                    onCheckedChange={() => handleToggleUser(conv.user.id)}
                  />
                  <Label className="flex-1 cursor-pointer">
                    <div className="font-medium">
                      {conv.user.nickname || conv.user.username}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {conv.messages.length} 条消息
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedUserIds.length === 0}
          >
            {loading ? '标记中...' : '确认标记'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 