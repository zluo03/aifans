"use client";

import React, { ReactNode, useRef, WheelEvent, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface HorizontalScrollLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  showArrows?: boolean;
  className?: string;
}

export function HorizontalScrollLayout({
  children,
  header,
  showArrows = true,
  className = "",
}: HorizontalScrollLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 处理鼠标滚轮事件 - 增强版
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    // 阻止默认滚动行为
    e.preventDefault();
    
    // 垂直滚动转为水平滚动，增加滚动速度
    const scrollAmount = e.deltaY * 2;
    
    containerRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'auto' // 使用'auto'获得更自然的滚动感
    });
  };

  // 滚动处理
  const scrollGallery = (direction: 'left' | 'right', amount: number = 400) => {
    if (!containerRef.current) return;
    
    const currentScroll = containerRef.current.scrollLeft;
    
    containerRef.current.scrollTo({
      left: direction === 'left' ? currentScroll - amount : currentScroll + amount,
      behavior: 'smooth'
    });
  };

  // 确保内容区域可见并且底部不被裁剪
  useEffect(() => {
    if (containerRef.current) {
      // 检查是否需要添加额外的底部空间
      const ensureBottomSpace = () => {
        if (containerRef.current) {
          // 确保有足够的底部空间来显示卡片的圆角和边框
          containerRef.current.style.paddingBottom = '12px';
        }
      };
      
      ensureBottomSpace();
      
      // 窗口大小改变时重新调整
      window.addEventListener('resize', ensureBottomSpace);
      
      return () => {
        window.removeEventListener('resize', ensureBottomSpace);
      };
    }
  }, [children]);

  return (
    <div className={`flex flex-col w-full h-full overflow-hidden ${className}`}>
      {/* 头部内容 (如过滤器、按钮等) */}
      {header && (
        <div className="py-1.5 px-4">
          {header}
        </div>
      )}

      {/* 横向滚动区域 */}
      <div 
        ref={scrollAreaRef}
        className="relative flex-1 overflow-visible" 
        onWheel={handleWheel}
      >
        {/* 滚动箭头按钮 */}
        {showArrows && (
          <>
            <button 
              onClick={() => scrollGallery('left')} 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-all duration-200"
              aria-label="向左滚动"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            
            <button 
              onClick={() => scrollGallery('right')} 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-all duration-200"
              aria-label="向右滚动"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </>
        )}

        {/* 内容区域 - 只允许水平滚动，禁用垂直滚动 */}
        <div 
          ref={containerRef}
          className="overflow-x-auto overflow-y-visible hide-scrollbar h-full py-0 px-0"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            paddingBottom: '12px' // 确保底部有足够空间显示圆角和边框
          }}
          onWheel={handleWheel}
        >
          {children}
        </div>
      </div>
    </div>
  );
} 