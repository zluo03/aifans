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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { spiritPostsApi, CreateSpiritPostDto } from '@/lib/api/spirit-posts';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';

interface CreateSpiritPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateSpiritPostDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSpiritPostDialogProps) {
  const [formData, setFormData] = useState<CreateSpiritPostDto>({
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const permissions = usePermissions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 权限检查
    if (!permissions.canCreateSpiritPost()) {
      toast.error(permissions.getPermissionDeniedMessage("发布灵贴"));
      return;
    }

    if (!formData.title.trim()) {
      toast.error('请输入标题');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('请输入内容');
      return;
    }

    try {
      setLoading(true);
      await spiritPostsApi.create(formData);
      toast.success('灵贴发布成功');
      onSuccess();
      // 重置表单
      setFormData({ title: '', content: '' });
    } catch (error: any) {
      console.error('创建灵贴失败:', error);
      
      // 更详细的错误处理
      let errorMessage = '创建灵贴失败';
      
      if (error.response) {
        // 服务器返回了错误响应
        const { status, data } = error.response;
        
        if (status === 403) {
          errorMessage = data?.message || '您已被禁言，无法发布灵贴';
        } else if (status === 401) {
          errorMessage = '请先登录';
        } else if (data?.message) {
          errorMessage = data.message;
        } else {
          errorMessage = `服务器错误 (${status})`;
        }
      } else if (error.request) {
        // 请求发出但没有收到响应
        errorMessage = '网络连接失败，请检查网络';
      } else if (error.message) {
        // 其他错误
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>发布灵贴</DialogTitle>
            <DialogDescription>
              发布您的灵贴，等待其他用户认领
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                placeholder="请输入灵贴标题"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                maxLength={200}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.title.length}/200
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">内容</Label>
              <Textarea
                id="content"
                placeholder="请输入灵贴内容"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={6}
                disabled={loading}
                className="resize-none"
              />
            </div>
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
            <Button type="submit" disabled={loading}>
              {loading ? '发布中...' : '发布'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 