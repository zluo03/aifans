"use client";

import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { X, Heart, Bookmark, Download, Copy, Tag, Calendar, Eye, Info, Crown, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/animations";
import { processImageUrl } from "@/lib/utils/image-url";
import { getVideoCategoryText } from "@/lib/utils/video-category";
import { canCopyPrompt, canDownloadPost, getUserPermissions } from "@/lib/utils/permission";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuthStore } from "@/lib/store/auth-store";
import Link from "next/link";

// 媒体比例类型
type MediaRatio = 'wide' | 'tall' | 'square';

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

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onLike: () => void;
  onFavorite: () => void;
  userRole?: string;
  currentUser?: {
    id: number;
    username: string;
    nickname: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

// 使用memo优化内容部分，防止不必要的重新渲染
const ModalContent = memo(({ post, onLike, onFavorite, onClose, userRole, currentUser, onEdit, onDelete }: Omit<PostDetailModalProps, 'isOpen'>) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [currentTab, setCurrentTab] = useState<'info' | 'prompt'>('info');
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mediaRatio, setMediaRatio] = useState<MediaRatio>('square');
  const [forceLayout, setForceLayout] = useState<MediaRatio | null>(null);
  const [isMediaHovered, setIsMediaHovered] = useState(false);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);

  // 使用新的权限系统
  const { user } = useAuthStore();
  const newPermissions = usePermissions();
  const oldPermissions = getUserPermissions(userRole);
  
  // 权限检查 - 考虑用户状态（禁言、封禁）
  const canCopy = newPermissions.canCreateContent() && canCopyPrompt(userRole);
  const canDownload = newPermissions.canCreateContent() && canDownloadPost(userRole, post.allowDownload);

  // 处理所有URL，确保正确访问
  const fileUrl = processImageUrl(post.fileUrl);
  const userAvatarUrl = post.user?.avatarUrl ? processImageUrl(post.user.avatarUrl) : undefined;

  // 优化媒体加载处理
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setImageLoaded(true);
      updateMediaRatio();
    }
  }, []);

  const handleVideoLoad = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.videoWidth && video.videoHeight) {
      setVideoLoaded(true);
      updateMediaRatio();
    }
  }, []);

  // 优化的媒体比例计算
  const updateMediaRatio = useCallback(() => {
    if (!mediaRef.current) return;

    requestAnimationFrame(() => {
      let width = 0;
      let height = 0;

      if (post.type === 'IMAGE') {
        const imgElement = mediaRef.current as HTMLImageElement;
        width = imgElement.naturalWidth;
        height = imgElement.naturalHeight;
      } else if (post.type === 'VIDEO') {
        const videoElement = mediaRef.current as HTMLVideoElement;
        width = videoElement.videoWidth;
        height = videoElement.videoHeight;
      }

      if (width && height) {
        const ratio = width / height;
        let newRatio: MediaRatio;
        
        if (ratio > 1.2) {
          newRatio = 'wide';
        } else if (ratio < 0.8) {
          newRatio = 'tall';
        } else {
          newRatio = 'square';
        }
        
        if (!forceLayout || mediaRatio !== newRatio) {
          setMediaRatio(newRatio);
        }
      }
    });
  }, [post.type, forceLayout, mediaRatio]);

  // 优化布局类
  const layoutClasses = useMemo(() => ({
    wide: {
      container: 'flex-col',
      mediaWrapper: 'w-full flex-none h-[30vh] flex items-center justify-center border-b border-gray-200 dark:border-gray-700 overflow-visible relative',
      contentWrapper: 'w-full px-6 py-4 flex-grow relative',
      mediaClass: 'w-full h-full object-cover transition-all duration-300'
    },
    tall: {
      container: 'flex-col md:flex-row',
      mediaWrapper: 'w-full md:w-[30%] flex-none h-[30vh] md:h-[60vh] flex items-start justify-start border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 overflow-hidden',
      contentWrapper: 'w-full md:w-[70%] p-6 overflow-y-auto',
      mediaClass: 'h-full w-full object-cover'
    },
    square: {
      container: 'flex-col md:flex-row',
      mediaWrapper: 'w-full md:w-[50%] flex-none h-[30vh] md:h-[60vh] flex items-start justify-start border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 overflow-hidden',
      contentWrapper: 'w-full md:w-[50%] p-6 overflow-y-auto',
      mediaClass: 'h-full w-full object-cover'
    }
  }), []);

  // 优化动画配置
  const animationConfig = useMemo(() => ({
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -5 },
    transition: { 
      duration: 0.15,
      ease: [0.23, 1, 0.32, 1]
    }
  }), []);

  // 优化悬停样式
  const hoveredMediaStyle = useMemo(() => 
    mediaRatio === 'wide' && isMediaHovered ? {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: 'auto',
      maxHeight: 'none',
      objectFit: 'contain' as const,
      zIndex: 100,
      transformOrigin: 'top center',
      boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
      transform: 'scale(1.02)'
    } : {},
  [mediaRatio, isMediaHovered]);

  // 防止右键菜单
  const preventRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // 处理媒体悬停
  const handleMediaHover = useCallback((isHovered: boolean) => {
    if (mediaRatio === 'wide') {
      setIsMediaHovered(isHovered);
    }
  }, [mediaRatio]);

  return (
    <motion.div 
      className="relative max-w-6xl w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-2xl min-h-[60vh] max-h-[90vh] overflow-visible flex will-change-transform"
      {...animationConfig}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-[100] p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      
      {/* 内容区域 */}
      <div className={`flex ${layoutClasses[mediaRatio].container} w-full h-full overflow-hidden rounded-xl`}>
        {/* 媒体区域 */}
        <div 
          className={`${layoutClasses[mediaRatio].mediaWrapper} ${
            mediaRatio === 'wide' 
              ? 'z-20 rounded-t-xl' 
              : 'z-10 rounded-t-xl md:rounded-t-none md:rounded-l-xl'
          } bg-black ${isMediaHovered ? 'overflow-visible' : ''}`} 
          onContextMenu={preventRightClick}
          onMouseEnter={() => handleMediaHover(true)}
          onMouseLeave={() => handleMediaHover(false)}
        >
          {post.type === 'VIDEO' ? (
            <>
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={fileUrl}
                className={`${layoutClasses[mediaRatio].mediaClass} ${isMediaHovered && mediaRatio === 'wide' ? 'z-50' : ''}`}
                style={mediaRatio === 'wide' ? { 
                  ...(isMediaHovered ? hoveredMediaStyle : {objectFit: 'cover' as const})
                } : { objectFit: 'cover' as const }}
                onLoadedData={handleVideoLoad}
                onLoadedMetadata={handleVideoLoad}
                onContextMenu={preventRightClick}
                autoPlay
                loop
                playsInline
                preload="metadata"
                disablePictureInPicture
              />
              {!videoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
                </div>
              )}
            </>
          ) : (
            <>
              <img
                ref={mediaRef as React.RefObject<HTMLImageElement>}
                src={fileUrl}
                alt={post.title || "AI生成图像"}
                className={`
                  ${layoutClasses[mediaRatio].mediaClass}
                  transition-opacity duration-300
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                  ${isMediaHovered && mediaRatio === 'wide' ? 'z-50' : ''}
                `}
                style={mediaRatio === 'wide' ? { 
                  ...(isMediaHovered ? hoveredMediaStyle : {objectFit: 'cover' as const}) 
                } : { objectFit: 'cover' as const }}
                onLoad={handleImageLoad}
                loading="lazy"
                decoding="async"
                onContextMenu={preventRightClick}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
                </div>
              )}
            </>
          )}
        </div>
        
        {/* 内容区域 */}
        <div className={`${layoutClasses[mediaRatio].contentWrapper} ${
          mediaRatio === 'wide' 
            ? 'z-10 overflow-visible rounded-b-xl' 
            : 'z-30 rounded-b-xl md:rounded-b-none md:rounded-r-xl'
        }`}>
          {/* 作者信息 */}
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              {userAvatarUrl ? (
                <img 
                  src={userAvatarUrl} 
                  alt={post.user.nickname} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onContextMenu={preventRightClick}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-lg font-bold">
                  {post.user.nickname.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="ml-3">
              <div className="font-medium text-gray-900 dark:text-gray-100">{post.user.nickname}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">@{post.user.username}</div>
            </div>
          </div>
          
          {/* 标题 */}
          {post.title && (
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{post.title}</h2>
          )}
          
          {/* 标签页切换 */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              className={`pb-2 mr-4 text-sm font-medium relative ${
                currentTab === 'info' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setCurrentTab('info')}
            >
              作品信息
              {currentTab === 'info' && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                />
              )}
            </button>
            <button
              className={`pb-2 text-sm font-medium relative ${
                currentTab === 'prompt' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setCurrentTab('prompt')}
            >
              提示词
              {currentTab === 'prompt' && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                />
              )}
            </button>
          </div>
          
          {/* 内容区域 */}
          <AnimatePresence mode="wait" initial={false}>
            {currentTab === 'info' ? (
              <motion.div
                key="info"
                {...animationConfig}
                className="space-y-4"
              >
                {/* AI平台和模型 */}
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Tag className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">AI平台：</span>
                  <span className="ml-1">{post.aiPlatform.name}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Info className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">使用模型：</span>
                  <span className="ml-1">{post.modelUsed}</span>
                </div>
                
                {/* 视频类别 */}
                {post.type === 'VIDEO' && post.videoCategory && (
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <Tag className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium">视频类别：</span>
                    <span className="ml-1">{getVideoCategoryText(post.videoCategory)}</span>
                  </div>
                )}
                
                {/* 统计信息 */}
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Eye className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">浏览量：</span>
                  <span className="ml-1">{post.viewsCount}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="prompt"
                {...animationConfig}
                className="space-y-4"
              >
                {/* 提示词内容 */}
                {canCopy ? (
                  <div className="relative">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      {post.prompt}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 普通用户 - 不可选中的提示词 */}
                    <div className="relative">
                      <div 
                        className="whitespace-pre-wrap text-sm text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 select-none"
                        style={{ 
                          userSelect: 'none', 
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none',
                          pointerEvents: 'none' 
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                      >
                        {post.prompt}
                      </div>
                      {/* 覆盖层防止复制 */}
                      <div 
                        className="absolute inset-0 bg-transparent cursor-not-allowed"
                        onContextMenu={(e) => e.preventDefault()}
                        onMouseDown={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        title="升级会员可以复制提示词"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 升级会员提示区域 - 普通用户显示 */}
                          {!oldPermissions.isPremiumOrAbove && (
            <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-800">升级会员解锁更多功能</p>
                    <p className="text-sm text-gray-600">复制提示词、下载素材、上传作品</p>
                  </div>
                </div>
                <Button asChild size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                  <Link href="/membership">
                    立即升级
                  </Link>
                </Button>
              </div>
            </div>
          )}
          
          {/* 交互按钮区域 */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onLike}
              className={`flex items-center ${post.hasLiked ? 'text-red-500 border-red-200' : ''}`}
            >
              <Heart className={`h-4 w-4 mr-1.5 ${post.hasLiked ? 'fill-red-500' : ''}`} />
              {post.hasLiked ? '已点赞' : '点赞'}
              <span className="ml-1.5">({post.likesCount})</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onFavorite}
              className={`flex items-center ${post.hasFavorited ? 'text-yellow-500 border-yellow-200' : ''}`}
            >
              <Bookmark className={`h-4 w-4 mr-1.5 ${post.hasFavorited ? 'fill-yellow-500' : ''}`} />
              {post.hasFavorited ? '已收藏' : '收藏'}
              <span className="ml-1.5">({post.favoritesCount})</span>
            </Button>
            
            {/* 复制提示词按钮 */}
            {canCopy ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(post.prompt);
                  toast.success('提示词已复制到剪贴板');
                }}
                className="flex items-center"
              >
                <Copy className="h-4 w-4 mr-1.5" />
                复制提示词
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                disabled
                className="flex items-center opacity-50 cursor-not-allowed"
                title="升级会员可以复制提示词"
              >
                <Copy className="h-4 w-4 mr-1.5" />
                复制提示词
              </Button>
            )}
            
            {/* 下载按钮 */}
            {canDownload ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    setIsDownloading(true);
                    
                    // 通过axios下载文件
                    const response = await axios.get(`/api/posts/${post.id}/download`, {
                      responseType: 'blob'
                    });
                    
                    // 创建下载链接
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    
                    // 确定文件名和扩展名
                    const filename = post.title || `AI作品_${post.id}`;
                    const extension = post.type === 'IMAGE' ? 'png' : 'mp4';
                    
                    link.setAttribute('download', `${filename}.${extension}`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    toast.success('下载成功');
                  } catch (error) {
                    console.error('下载失败:', error);
                    toast.error('下载失败，请稍后再试');
                  } finally {
                    setIsDownloading(false);
                  }
                }}
                className="flex items-center"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <div className="mr-1.5 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    下载中...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1.5" />
                    下载
                  </>
                )}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                disabled
                className="flex items-center opacity-50 cursor-not-allowed"
                title={post.allowDownload ? "升级会员可以下载素材" : "作者未允许下载"}
              >
                <Download className="h-4 w-4 mr-1.5" />
                下载
              </Button>
            )}
            
            {/* 编辑和删除按钮 - 只有作品作者才能看到 */}
            {currentUser && currentUser.id === post.user.id && (
              <>
                {/* 编辑按钮 */}
                {onEdit && (
                  <Button 
                    size="sm"
                    onClick={onEdit}
                    className="flex items-center bg-blue-500 hover:bg-blue-600 text-white border-0"
                  >
                    <Edit className="h-4 w-4 mr-1.5" />
                    编辑
                  </Button>
                )}
                
                {/* 删除按钮 */}
                {onDelete && (
                  <Button 
                    size="sm"
                    onClick={onDelete}
                    className="flex items-center bg-red-400 hover:bg-red-500 text-white border-0"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    删除
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // 优化重渲染逻辑
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.hasLiked === nextProps.post.hasLiked &&
    prevProps.post.hasFavorited === nextProps.post.hasFavorited &&
    prevProps.post.likesCount === nextProps.post.likesCount &&
    prevProps.post.favoritesCount === nextProps.post.favoritesCount
  );
});

ModalContent.displayName = 'ModalContent';

// 主弹框组件，使用高度优化的方式
export default function PostDetailModal({
  isOpen,
  onClose,
  post,
  onLike,
  onFavorite,
  userRole,
  currentUser,
  onEdit,
  onDelete,
}: PostDetailModalProps) {
  // 使用一个key来确保每次打开不同的帖子时完全重新渲染组件
  // 这样可以避免状态残留问题
  const modalKey = `modal-${post.id}`;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-8"
          key={modalKey}
        >
          {/* 毛玻璃背景 */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={onClose}
          />
          
          {/* 内容 - 使用memo组件避免不必要的重新渲染 */}
          <ModalContent 
            post={post} 
            onLike={onLike} 
            onFavorite={onFavorite} 
            onClose={onClose} 
            userRole={userRole} 
            currentUser={currentUser}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}
    </AnimatePresence>
  );
} 