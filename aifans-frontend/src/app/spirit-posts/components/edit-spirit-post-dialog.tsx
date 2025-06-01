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
import { spiritPostsApi, SpiritPost, UpdateSpiritPostDto } from '@/lib/api/spirit-posts';
import { toast } from 'sonner';

interface EditSpiritPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: SpiritPost;
  onSuccess: () => void;
}

export function EditSpiritPostDialog({
  open,
  onOpenChange,
  post,
  onSuccess,
}: EditSpiritPostDialogProps) {
  const [formData, setFormData] = useState<UpdateSpiritPostDto>({
    title: post.title,
    content: post.content,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast.error('请输入标题');
      return;
    }

    if (!formData.content?.trim()) {
      toast.error('请输入内容');
      return;
    }

    try {
      setLoading(true);
      await spiritPostsApi.update(post.id, formData);
      onSuccess();
    } catch (error: any) {
      console.error('更新灵贴失败:', error);
      toast.error(error.response?.data?.message || '更新灵贴失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>编辑灵贴</DialogTitle>
            <DialogDescription>
              修改灵贴的标题和内容
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                placeholder="请输入灵贴标题"
                value={formData.title || ''}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                maxLength={200}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground text-right">
                {(formData.title || '').length}/200
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">内容</Label>
              <Textarea
                id="content"
                placeholder="请输入灵贴内容"
                value={formData.content || ''}
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
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 