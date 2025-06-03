"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { Heart, Bookmark } from "lucide-react";
import { processPostImageUrl, processUploadImageUrl } from "@/lib/utils/image-url";
import { getVideoCategoryText } from "@/lib/utils/video-category";
import { usePermissions } from "@/hooks/use-permissions";
import './media-protection.css';
import Image from "next/image";
import { cn } from '@/lib/utils';

interface Post {
  id: number;
  type: "IMAGE" | "VIDEO";
  title?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  aiPlatform: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  likesCount: number;
  favoritesCount: number;
  viewsCount: number;
  prompt: string;
  modelUsed: string;
  videoCategory?: string;
  allowDownload: boolean;
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl?: string;
  };
  hasLiked?: boolean;
  hasFavorited?: boolean;
}

interface PostCardProps {
  post: Post;
  onClick: () => void;
  onLike: () => void;
  onFavorite: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
  userRole: string;
  currentUser: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl?: string;
  };
  className?: string;
  onMediaDimensionChange?: (postId: number, aspectRatio: number | null) => void;
}

// 使用memo优化组件重渲染
export default memo(function PostCard({ 
  post, 
  onClick, 
  onLike, 
  onFavorite, 
  onDownload,
  onEdit,
  onDelete,
  userRole,
  currentUser,
  className = '',
  onMediaDimensionChange
}: PostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState(false);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 权限检查
  const permissions = usePermissions();
  
  // 使用IntersectionObserver优化可见性检测
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px 0px',
        threshold: 0.1
      }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // 更新媒体尺寸信息
  const updateDimensions = useCallback((width: number, height: number) => {
    if (onMediaDimensionChange) {
      if (width > 0 && height > 0) {
        const aspectRatio = width / height;
        onMediaDimensionChange(post.id, aspectRatio);
      } else {
        onMediaDimensionChange(post.id, null); // Pass null if dimensions are invalid
      }
    }
  }, [post.id, onMediaDimensionChange]);

  // 处理图片加载
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      updateDimensions(img.naturalWidth, img.naturalHeight);
      
      // 不再强制设置卡片高度，让图片保持自然尺寸比例
      if (cardRef.current) {
        // 只设置宽高比，不设置实际高度
        cardRef.current.style.aspectRatio = `${img.naturalWidth / img.naturalHeight}`;
      }
      
      // 使用requestAnimationFrame避免闪烁
      requestAnimationFrame(() => {
        setImageLoaded(true);
      });
    }
  }, [updateDimensions]);

  // 处理视频加载
  const handleVideoLoad = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.videoWidth && video.videoHeight) {
      updateDimensions(video.videoWidth, video.videoHeight);
      
      // 不再强制设置卡片高度，让视频保持自然尺寸比例
      if (cardRef.current) {
        // 只设置宽高比，不设置实际高度
        cardRef.current.style.aspectRatio = `${video.videoWidth / video.videoHeight}`;
      }
      
      // 使用requestAnimationFrame避免闪烁
      requestAnimationFrame(() => {
        setImageLoaded(true);
      });
    }
  }, [updateDimensions]);

  // 禁用右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  // 实现悬停时视频播放
  useEffect(() => {
    if (post.type !== "VIDEO" || !mediaRef.current) return;
    
    const video = mediaRef.current as HTMLVideoElement;
    const card = cardRef.current;
    
    if (!card) return;
    
    function handleMouseEnter() {
      try {
        // 确保视频有效后再播放
        if (video.readyState >= 2) {
          video.play().catch(e => {
            // 静默失败，不显示错误
          });
        }
      } catch (err) {
        // 静默失败，不显示错误
      }
    }
    
    function handleMouseLeave() {
      try {
        video.pause();
      } catch (err) {
        // 静默失败，不显示错误
      }
    }
    
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [post.type, isVisible]);

  // 处理图片URL
  const fileUrl = processPostImageUrl(post.fileUrl);
  const thumbnailUrl = post.thumbnailUrl ? processPostImageUrl(post.thumbnailUrl) : undefined;
  const platformLogoUrl = post.aiPlatform.logoUrl ? processPostImageUrl(post.aiPlatform.logoUrl) : undefined;

  // 使用代理URL处理视频，避免CORS问题
  const getProxiedVideoUrl = (url: string) => {
    // 如果URL包含阿里云OSS域名，使用代理
    if (url.includes('oss-cn-beijing.aliyuncs.com')) {
      // 从原始URL中提取key部分
      const key = url.split('aliyuncs.com/')[1]?.split('?')[0];
      if (key) {
        return `/api/storage/proxy/video/${encodeURIComponent(key)}`;
      }
    }
    return url;
  };

  // 渲染媒体内容
  const renderMedia = () => {
    if (post.type === 'IMAGE') {
      // 使用processUploadImageUrl添加时间戳防止缓存问题
      const imageUrl = processUploadImageUrl(post.fileUrl);
      return (
        <Image
          ref={mediaRef as React.Ref<HTMLImageElement>}
          src={imageUrl}
          alt={post.title || '作品图片'}
          width={400}
          height={400}
          className={cn(
            "w-full h-full object-contain transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleImageLoad}
          onError={() => setError(true)}
          onContextMenu={handleContextMenu}
          loading="lazy"
        />
      );
    } else if (post.type === 'VIDEO') {
      // 使用代理URL避免CORS问题
      const videoUrl = getProxiedVideoUrl(fileUrl);
      return (
        <video
          ref={mediaRef as React.Ref<HTMLVideoElement>}
          src={videoUrl}
          muted
          loop
          crossOrigin="anonymous"
          className={cn(
            "w-full h-full object-contain transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoadedMetadata={handleVideoLoad}
          onError={(e) => {
            // 如果视频加载失败，尝试使用备用路径
            if (mediaRef.current && post.fileUrl) {
              try {
                const video = mediaRef.current as HTMLVideoElement;
                const currentSrc = video.src;
                
                // 如果当前URL是代理URL，尝试直接URL
                if (currentSrc.includes('/api/proxy')) {
                  const newSrc = post.fileUrl;
                  video.src = newSrc;
                  video.load();
                }
              } catch (e) {
                // 如果已经尝试过直接URL，标记为加载失败
                setError(true);
              }
            } else {
              setError(true);
            }
          }}
          onContextMenu={handleContextMenu}
          controlsList="nodownload"
          disablePictureInPicture
          playsInline
        />
      );
    }
    return null;
  };

  return (
    <motion.div 
      ref={cardRef}
      className={`relative w-full rounded-md border border-gray-800/30 overflow-hidden ${className} 
      transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 
      hover:border-primary/50 hover:scale-[1.01] group media-protected`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        contain: 'content',
        willChange: 'transform',
      }}
      onContextMenu={handleContextMenu}
    >
      {/* 加载状态 */}
      {!imageLoaded && isVisible && (
        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
      )}
      
      {isVisible && (
        <div 
          onClick={onClick} 
          className="relative cursor-pointer overflow-hidden rounded-md"
          onContextMenu={handleContextMenu}
        >
          {/* 媒体内容 */}
          {renderMedia()}
          
          {/* 渐变遮罩 */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-black/50 opacity-70 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          
          {/* 视频类型标签 - 显示在右上角 */}
          {post.type === "VIDEO" && post.videoCategory && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center justify-center">
              <span className="text-[11px] text-white font-medium leading-none">
                {getVideoCategoryText(post.videoCategory)}
              </span>
            </div>
          )}
          
          {/* 平台信息和交互按钮 */}
          <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
            {/* 平台信息 */}
            <div className="flex items-center space-x-1">
              {platformLogoUrl && (
                <img
                  src={platformLogoUrl}
                  alt={post.aiPlatform.name}
                  className="w-4 h-4 rounded-sm object-cover"
                  loading="lazy"
                />
              )}
              <span className="text-xs text-white font-medium truncate">
                {post.aiPlatform.name}
              </span>
            </div>
            
            {/* 交互按钮 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike();
                }}
                disabled={!permissions.canLike()}
                className={`flex items-center space-x-1 text-white transition-transform duration-200 ${
                  permissions.canLike() 
                    ? 'group-hover:scale-110 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                title={!permissions.canLike() ? '您当前无法进行点赞操作' : ''}
              >
                <Heart
                  className={`w-4 h-4 ${
                    post.hasLiked ? 'fill-red-500 text-red-500' : 'fill-none group-hover:text-red-400'
                  }`}
                />
                <span className="text-xs">{post.likesCount}</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite();
                }}
                disabled={!permissions.canFavorite()}
                className={`flex items-center space-x-1 text-white transition-transform duration-200 ${
                  permissions.canFavorite() 
                    ? 'group-hover:scale-110 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                title={!permissions.canFavorite() ? '您当前无法进行收藏操作' : ''}
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    post.hasFavorited ? 'fill-yellow-500 text-yellow-500' : 'fill-none group-hover:text-yellow-400'
                  }`}
                />
                <span className="text-xs">{post.favoritesCount}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // 优化重渲染逻辑
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.hasLiked === nextProps.post.hasLiked &&
    prevProps.post.hasFavorited === nextProps.post.hasFavorited &&
    prevProps.post.likesCount === nextProps.post.likesCount &&
    prevProps.post.favoritesCount === nextProps.post.favoritesCount &&
    prevProps.className === nextProps.className
  );
}); 