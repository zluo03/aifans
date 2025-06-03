import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface MediaPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  title?: string;
}

export function MediaPreviewModal({
  open,
  onOpenChange,
  mediaUrl,
  mediaType,
  title
}: MediaPreviewModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // 点击内容外部关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      onOpenChange(false);
    }
  };

  // 按ESC关闭
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [open, onOpenChange]);

  if (!open || !mediaUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        ref={contentRef}
        className="relative max-w-[90vw] max-h-[70vh] rounded-lg overflow-hidden"
      >
        {mediaType === 'image' && (
          <img 
            src={mediaUrl} 
            alt={title || '作品预览'} 
            className="max-w-full max-h-[70vh] object-contain"
          />
        )}
        
        {mediaType === 'video' && (
          <video 
            src={mediaUrl} 
            controls 
            autoPlay
            className="max-w-full max-h-[70vh]"
            controlsList="nodownload"
          />
        )}
        
        {mediaType === 'audio' && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <audio 
              src={mediaUrl} 
              controls 
              autoPlay 
              className="w-full" 
              controlsList="nodownload"
            />
          </div>
        )}
        
        {title && mediaType !== 'audio' && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3">
            <h3 className="text-base font-medium truncate">{title}</h3>
          </div>
        )}
        
        {/* 关闭按钮 */}
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
} 