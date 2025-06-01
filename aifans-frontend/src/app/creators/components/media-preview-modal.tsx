import React, { useState, useEffect } from 'react';

interface MediaPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  title?: string;
}

export function MediaPreviewModal({ open, onOpenChange, mediaUrl, mediaType, title }: MediaPreviewModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      // 强制重绘后开始动画
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else if (isVisible) {
      setIsAnimating(false);
      // 等待动画完成后隐藏组件
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, isVisible]);

  const handleClose = () => {
    onOpenChange(false);
  };

  // 如果没有有效的媒体URL，不渲染组件
  if (!isVisible || !mediaUrl || mediaUrl.trim() === '') return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 毛玻璃背景遮罩 */}
      <div 
        className={`absolute inset-0 transition-all duration-300 ease-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          backdropFilter: isAnimating ? 'blur(20px)' : 'blur(0px)',
          backgroundColor: isAnimating ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0)',
          transitionProperty: 'opacity, backdrop-filter, background-color'
        }}
        onClick={handleClose}
      />
      
      {/* 弹框内容 */}
      <div className={`absolute inset-0 flex items-center justify-center p-8 transition-all duration-300 ease-out ${
        isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        {/* 媒体内容容器 - 相对定位用于关闭按钮定位 */}
        <div className="relative flex items-center justify-center w-full h-full">
          {mediaType === 'image' ? (
            <img
              src={mediaUrl}
              alt={title || '预览图片'}
              className="max-w-[calc(100vw-64px)] max-h-[calc(100vh-64px)] object-contain"
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              } as React.CSSProperties}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
          ) : (
            <video
              src={mediaUrl}
              controls
              className="max-w-[calc(100vw-64px)] max-h-[calc(100vh-64px)] object-contain"
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
              onContextMenu={(e) => e.preventDefault()}
              controlsList="nodownload nofullscreen noremoteplayback"
              disablePictureInPicture
              autoPlay={false}
            />
          )}
          
          {/* 关闭按钮 - 相对于媒体元素的右上角 */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 w-10 h-10 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm shadow-lg hover:scale-110 border-2 border-white/20 z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* 标题 */}
          {title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <h3 className="text-white text-lg font-medium text-center">{title}</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 