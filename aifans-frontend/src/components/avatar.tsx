'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { processImageUrl } from '@/lib/utils/image-url';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export function Avatar({
  src,
  alt = '用户头像',
  size = 'md',
  className,
  onClick
}: AvatarProps) {
  const defaultAvatar = '/images/default-avatar.png';
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const [imgSrc, setImgSrc] = useState<string>(src ? processImageUrl(src) : defaultAvatar);
  const [imgError, setImgError] = useState<boolean>(false);
  
  // 根据size设置尺寸
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  // 处理图片加载错误
  const handleError = () => {
    if (!imgError) {
      console.log('头像加载失败，使用默认头像', {
        原始URL: src,
        处理后URL: imgSrc,
        时间戳: new Date().toISOString()
      });
      setImgSrc(defaultAvatar);
      setImgError(true);
    }
  };
  
  // 统一处理最终图片地址
  const realSrc = imgSrc && imgSrc.startsWith('/uploads/') ? `${baseUrl}${imgSrc}` : imgSrc;
  
  return (
    <div 
      className={cn(
        'rounded-full overflow-hidden bg-gray-200 flex items-center justify-center',
        sizeClasses[size],
        className,
        onClick ? 'cursor-pointer hover:opacity-90' : ''
      )}
      onClick={onClick}
    >
      <img
        src={realSrc}
        alt={alt}
        className="w-full h-full object-cover"
        onError={handleError}
      />
    </div>
  );
} 