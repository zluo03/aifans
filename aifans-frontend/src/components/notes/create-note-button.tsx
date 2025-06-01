'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';

interface CreateNoteButtonProps {
  className?: string;
}

export function CreateNoteButton({ className }: CreateNoteButtonProps) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // 阻止form提交
    e.stopPropagation(); // 阻止事件冒泡
    
    if (!user && !isLoading) {
      toast.error('请先登录');
      router.push('/login');
      return;
    }
    
    if (user && user.role === 'NORMAL') {
      toast.error('普通用户无法创建笔记');
      return;
    }
    
    router.push('/notes/create');
  };

  // 普通用户不显示创建按钮
  if (user && user.role === 'NORMAL') {
    return null;
  }

  return (
    <Button onClick={handleClick} type="button" className={className}>
      <PlusCircle className="h-4 w-4 mr-2" />
      创建笔记
    </Button>
  );
} 