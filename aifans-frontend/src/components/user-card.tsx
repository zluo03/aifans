'use client';

import { Avatar } from './avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UserCardProps {
  user: {
    id: string | number;
    username?: string;
    nickname?: string;
    role?: string;
    avatarUrl?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  linkToProfile?: boolean;
  className?: string;
}

export function UserCard({
  user,
  size = 'md',
  showName = true,
  linkToProfile = true,
  className
}: UserCardProps) {
  const displayName = user.nickname || user.username || '用户';
  
  // 根据角色设置边框颜色
  const getBorderColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'ring-cyan-400'; // 管理员：青色
      case 'LIFETIME':
        return 'ring-pink-400'; // 永久用户：粉色
      case 'PREMIUM':
        return 'ring-yellow-400'; // 高级用户：金色
      default:
        return 'ring-white/80'; // 普通用户：白色
    }
  };
  
  // 根据大小设置样式
  const avatarSize = size === 'sm' ? 'xs' : size === 'lg' ? 'lg' : 'md';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  
  // 头像组件
  const avatarComponent = (
    <div className={cn('rounded-full ring-2', getBorderColor(user.role))}>
      <Avatar 
        alt={displayName} 
        size={avatarSize} 
        src={user.avatarUrl}
      />
    </div>
  );
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {linkToProfile ? (
        <Link href={`/creators/${user.id}`} className="hover:opacity-90">
          {avatarComponent}
        </Link>
      ) : (
        avatarComponent
      )}
      
      {showName && (
        <div className="flex flex-col">
          {linkToProfile ? (
            <Link 
              href={`/creators/${user.id}`} 
              className={cn('font-medium hover:underline', textSize)}
            >
              {displayName}
            </Link>
          ) : (
            <span className={cn('font-medium', textSize)}>
              {displayName}
            </span>
          )}
        </div>
      )}
    </div>
  );
} 