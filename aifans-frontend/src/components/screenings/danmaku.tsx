'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface DanmakuComment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
}

interface DanmakuProps {
  comments: DanmakuComment[];
  isFullscreen?: boolean;
}

interface DanmakuItem {
  id: number;
  text: string;
  color: string;
  top: number;
  left: number;
  duration: number;
}

export function Danmaku({ comments, isFullscreen = false }: DanmakuProps) {
  const [visible, setVisible] = useState(true);
  const [danmakuItems, setDanmakuItems] = useState<DanmakuItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 随机颜色生成
  const getRandomColor = () => {
    const colors = [
      '#FFFFFF', '#FFE4E1', '#E0FFFF', '#F0FFF0', 
      '#FFF8DC', '#F5F5DC', '#FFFACD', '#FFE4B5'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  useEffect(() => {
    if (!comments || !visible || isFullscreen) {
      setDanmakuItems([]);
      return;
    }

    // 将评论转换为弹幕格式
    const items = comments.map((comment, index) => ({
      id: comment.id,
      text: comment.content,
      color: getRandomColor(),
      top: Math.floor(Math.random() * 70) + 10, // 随机垂直位置(10%-80%)
      left: 100, // 从右侧开始
      duration: 8 + Math.random() * 4, // 8-12秒的动画时间
    }));
    
    setDanmakuItems(items);
  }, [comments, visible, isFullscreen]);
  
  // 全屏时不显示弹幕
  if (isFullscreen) {
    return null;
  }
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="absolute top-2 right-2 z-20 bg-black/50 border-white/20 text-white hover:bg-black/70"
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        <span className="ml-1 text-xs">{visible ? '隐藏弹幕' : '显示弹幕'}</span>
      </Button>
      
      {visible && (
        <div 
          ref={containerRef}
          className="absolute inset-0 pointer-events-none overflow-hidden z-10"
        >
          {danmakuItems.map((item) => (
            <div
              key={item.id}
              className="absolute whitespace-nowrap text-sm font-medium animate-danmaku-move"
              style={{
                top: `${item.top}%`,
                left: `${item.left}%`,
                color: item.color,
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                animationDuration: `${item.duration}s`,
                animationTimingFunction: 'linear',
                animationFillMode: 'forwards',
              }}
            >
              {item.text}
            </div>
          ))}
        </div>
      )}
      
      <style jsx>{`
        @keyframes danmaku-move {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-120vw);
          }
        }
        
        .animate-danmaku-move {
          animation-name: danmaku-move;
        }
      `}</style>
    </>
  );
} 