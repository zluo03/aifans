'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { Button } from './button';
import { Crown } from 'lucide-react';
import Link from 'next/link';

interface MembershipExclusiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export function MembershipExclusiveDialog({ open, onOpenChange, feature }: MembershipExclusiveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Crown className="text-yellow-500" />
            <DialogTitle>会员专享</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-3 py-2 text-base">
          {feature && (
            <p className="font-medium mb-2">
              {feature}需要升级为高级会员才能使用
            </p>
          )}
          <ul className="list-disc pl-5 space-y-1">
            <li>会员可以分享灵感，下载优秀灵感作品，复制提示词；</li>
            <li>通过丰富的笔记学习各种AI技巧与工具使用；</li>
            <li>发布与认领灵贴，让你的AI技能拥有更多施展的舞台；</li>
            <li>创建个人主页，让更多人发现你的才华；</li>
          </ul>
        </div>
        <DialogFooter>
          <Button asChild className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
            <Link href="/membership">立即升级会员</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 