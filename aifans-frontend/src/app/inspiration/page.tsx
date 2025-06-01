"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from "./components/post-card";
import UploadPostModal from "./components/upload-post-modal";
import PostDetailModal from "./components/post-detail-modal";
import EditPostModal from "./components/edit-post-modal";
import { useAuthStore } from "@/lib/store/auth-store";
import { SearchFilter } from "@/components/ui/search-filter";
import { PageTransition } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";
import { PlusIcon, Crown, Lock, PlusCircle } from "lucide-react";
import { postsApi } from "@/lib/api/posts";
import type { Post } from "@/lib/api/posts";
import { platformsApi } from "@/lib/api/platforms";
import type { Platform as AIPlatform } from "@/lib/api/platforms";
import { debounce } from "lodash";
import './components/media-protection.css';
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { processPostImageUrl } from "@/lib/utils/image-url";

// 搜索过滤器占位组件
function SearchFilterFallback() {
  return (
    <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
  );
}

// 游客访问限制组件
function GuestAccessDenied() {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
        <div className="text-center max-w-md">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">需要登录才能访问</h1>
          <p className="text-gray-600 mb-6">
            灵感页面需要登录后才能浏览。请先登录或注册账号。
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/login">登录</Link>
            </Button>
            <Button asChild>
              <Link href="/register">注册</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function InspirationPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [platforms, setPlatforms] = useState<AIPlatform[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [mediaDimensions, setMediaDimensions] = useState<Record<number, { aspectRatio: number | null }>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // 新增：处理后的平台数据（去重并合并双属性平台）
  const [processedPlatforms, setProcessedPlatforms] = useState<Array<{
    id: number;
    name: string;
    logoUrl?: string;
    type: 'IMAGE' | 'VIDEO' | 'BOTH';
    status: string;
    supportedTypes?: ('IMAGE' | 'VIDEO')[];
  }>>([]);

  // Refs for stable access in callbacks
  const mediaDimensionsRef = useRef(mediaDimensions);
  const postsRef = useRef(posts);

  // 权限检查
  const permissions = usePermissions();

  // 检查访问权限 - 只允许已登录用户访问
  const canAccess = isAuthenticated; // 只有已登录用户可以访问灵感页面

  useEffect(() => {
    mediaDimensionsRef.current = mediaDimensions;
  }, [mediaDimensions]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const fetchPosts = useCallback(async (filters: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await postsApi.getPosts(filters);
      if (response?.data) {
        const postsArray = Array.isArray(response.data) ? response.data : [response.data];
        // 过滤出有效的、可见的帖子，增强验证
        const newPosts = postsArray.filter(post => {
          // 基本数据验证
          if (!post || typeof post !== 'object' || !post.id) {
            console.warn('发现无效帖子数据:', post);
            return false;
          }
          
          // 状态检查
          if (post.status !== 'VISIBLE') {
            console.info(`帖子(ID:${post.id})状态不可见:`, post.status);
            return false;
          }
          
          // 必需字段检查
          if (!post.fileUrl || !post.user || !post.aiPlatform) {
            console.warn(`帖子(ID:${post.id})缺少必要字段:`, {
              hasFileUrl: !!post.fileUrl,
              hasUser: !!post.user,
              hasAiPlatform: !!post.aiPlatform
            });
            return false;
          }
          
          // 处理图片URL
          const processedPost = {
            ...post,
            fileUrl: processPostImageUrl(post.fileUrl),
            thumbnailUrl: post.thumbnailUrl ? processPostImageUrl(post.thumbnailUrl) : post.thumbnailUrl,
            aiPlatform: {
              ...post.aiPlatform,
              logoUrl: post.aiPlatform.logoUrl ? processPostImageUrl(post.aiPlatform.logoUrl) : post.aiPlatform.logoUrl
            }
          } satisfies Post;
          
          // 替换原始对象
          Object.assign(post, processedPost);
          
          return true;
        });
        
        console.log(`获取到${postsArray.length}个帖子，过滤后剩余${newPosts.length}个有效帖子`);
        
        // 移除前端排序，因为后端已经处理了排序，直接使用后端返回的顺序
        setPosts(newPosts);
      } else {
        console.warn('API返回格式不符合预期:', response);
        setPosts([]);
      }
    } catch (err) {
      console.error("获取作品列表失败:", err);
      setPosts([]);
      setError("获取作品列表失败，请刷新页面重试");
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化获取帖子
  useEffect(() => {
    fetchPosts({});
  }, [fetchPosts]); // fetchPosts is stable

  // 获取AI平台列表
  useEffect(() => {
    let isMounted = true;
    const fetchPlatforms = async () => {
      try {
        const data = await platformsApi.getAllPlatforms();
        
        if (isMounted && data) {
          if (data.length === 0) {
            console.warn('后端返回了空的平台列表');
            // 不设置错误，允许页面继续显示
          }
          
          // 添加status字段缺失处理
          const dataWithStatus = data.map((platform: any) => {
            if (!platform || typeof platform !== 'object') {
              console.warn('平台数据无效:', platform);
              return platform;
            }
            
            if (!('status' in platform)) {
              return { ...platform, status: 'ACTIVE' };
            }
            return platform;
          });
          
          const activePlatforms = dataWithStatus.filter(platform => platform.status === 'ACTIVE');
          
          if (activePlatforms.length === 0) {
            console.warn('没有状态为ACTIVE的平台，尝试使用所有平台');
            // 如果没有ACTIVE平台，使用所有平台，而不是设置错误
            setPlatforms(dataWithStatus);
          } else {
            setPlatforms(activePlatforms);
          }

          // 处理平台数据：去重并合并双属性平台
          const platformMap = new Map<string, {
            id: number;
            name: string;
            logoUrl?: string;
            types: Set<'IMAGE' | 'VIDEO'>;
            status: string;
          }>();

          // 遍历所有平台，按名称分组
          activePlatforms.forEach((platform: AIPlatform) => {
            const existing = platformMap.get(platform.name);
            if (existing) {
              // 如果平台名称已存在，添加新的类型
              existing.types.add(platform.type);
              // 保留第一个遇到的ID和logoUrl
            } else {
              // 创建新的平台记录
              platformMap.set(platform.name, {
                id: platform.id,
                name: platform.name,
                logoUrl: platform.logoUrl,
                types: new Set([platform.type]),
                status: platform.status
              });
            }
          });

          // 转换为数组格式，用于搜索过滤器
          const processed = Array.from(platformMap.values()).map(p => ({
            id: p.id,
            name: p.name,
            logoUrl: p.logoUrl,
            type: p.types.size > 1 ? 'BOTH' : Array.from(p.types)[0],
            status: p.status,
            // 保存原始类型信息
            supportedTypes: Array.from(p.types)
          })) as any[];

          console.log('处理后的平台数据:', processed.map(p => ({
            name: p.name,
            type: p.type,
            supportedTypes: p.supportedTypes
          })));

          setProcessedPlatforms(processed);
        } else {
          console.warn('InspirationPage - 没有获取到平台数据或平台列表为空');
          if (isMounted) {
            setPlatforms([]);
            setProcessedPlatforms([]);
            // 不设置错误，允许页面继续显示
          }
        }
      } catch (err: any) {
        console.error('获取AI平台列表失败:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        if (isMounted) {
          setPlatforms([]);
          setProcessedPlatforms([]);
          // 只记录错误，不阻止页面显示
          console.error('平台列表获取失败，但页面将继续加载');
        }
      }
    };

    fetchPlatforms();
    return () => {
      isMounted = false;
    };
  }, []); // 只在组件挂载时获取一次平台列表

  const handlePostClick = useCallback((post: Post) => {
    if (!post || !post.id) {
      console.error('尝试查看无效帖子详情:', post);
      toast.error('无法查看作品详情，作品数据无效');
      return;
    }
    
    // 检查帖子状态是否可见
    if (post.status !== 'VISIBLE') {
      console.error(`尝试查看不可见的帖子详情: ID=${post.id}, 状态=${post.status}`);
      toast.error('该作品当前不可见，无法查看详情');
      return;
    }
    
    // 先显示加载中的提示
    toast.loading('加载作品详情中...', {
      id: `loading-post-${post.id}`,
      duration: 2000 // 最多显示2秒
    });
    
    try {
      // 重新获取最新的帖子数据，确保数据是最新的
      postsApi.getPost(post.id)
        .then(updatedPost => {
          // 关闭加载提示
          toast.dismiss(`loading-post-${post.id}`);
          
          // 更新选中的帖子并打开详情模态框
          setSelectedPost(updatedPost);
          setIsDetailModalOpen(true);
        })
        .catch(err => {
          // 关闭加载提示并显示错误
          toast.dismiss(`loading-post-${post.id}`);
          
          console.error(`获取帖子详情失败, ID: ${post.id}`, err);
          
          // 处理404错误 - 帖子可能已被删除
          if (err.message?.includes('不存在') || err.message?.includes('已被删除')) {
            toast.error('该作品不存在或已被删除');
            
            // 从列表中移除该帖子
            setPosts(currentPosts => currentPosts.filter(p => p.id !== post.id));
            return;
          }
          
          // 对于其他错误，仍然使用列表中的数据显示
          setSelectedPost(post);
          setIsDetailModalOpen(true);
          toast.error('获取最新作品数据失败，显示可能不是最新信息');
        });
    } catch (err) {
      // 关闭加载提示
      toast.dismiss(`loading-post-${post.id}`);
      
      console.error(`处理帖子点击事件出错, ID: ${post.id}`, err);
      // 即使出错，也尝试显示
      setSelectedPost(post);
      setIsDetailModalOpen(true);
      toast.error('加载作品详情时发生错误');
    }
  }, []);

  const handleLikeToggle = useCallback(async (postId: number) => {
    // 首先检查用户是否已登录
    if (!isAuthenticated) {
      toast.error('请先登录后再点赞');
      return;
    }

    // 检查用户权限（封禁用户无法点赞）
    if (!permissions.canLike()) {
      toast.error('您当前无法进行点赞操作');
      return;
    }

    // 防止点击无效帖子
    if (!postId || isNaN(postId) || postId <= 0) {
      toast.error('无效的作品ID');
      return;
    }
    
    const currentPosts = postsRef.current; // Use ref for current posts
    const targetPost = currentPosts.find(p => p.id === postId);
    
    // 如果在当前列表中找不到目标帖子，可能已被移除或过滤
    if (!targetPost) {
      console.error(`尝试点赞不存在的帖子: ID=${postId}`);
      toast.error('找不到要点赞的作品，请刷新页面');
      return;
    }
    
    // 如果帖子状态不可见，不允许点赞
    if (targetPost.status === 'HIDDEN' || targetPost.status === 'ADMIN_DELETED') {
      console.error(`尝试点赞不可见的帖子: ID=${postId}, 状态=${targetPost.status}`);
      toast.error('该作品当前不可见，无法进行点赞操作');
      return;
    }

    const newHasLiked = !targetPost.hasLiked;
    const previousPosts = [...currentPosts]; // 保存当前状态，用于可能的回滚
    
    // 乐观更新UI状态
    const updatedPosts = currentPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          hasLiked: newHasLiked,
          likesCount: newHasLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1)
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    
    // 如果是当前选中的帖子，同步更新详情视图
    if (selectedPost?.id === postId) {
      setSelectedPost(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          hasLiked: newHasLiked,
          likesCount: newHasLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1)
        };
      });
    }
    
    try {
      // 直接获取认证状态信息，用于调试
      let authHeader = null;
      let tokenInfo = "未知";
      if (typeof window !== 'undefined') {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          try {
            const { state } = JSON.parse(decodeURIComponent(authStorage));
            authHeader = state?.token ? `存在 (${state.token.substring(0, 10)}...)` : '不存在';
            if (state?.user) {
              tokenInfo = `用户ID: ${state.user.id}, 用户名: ${state.user.username}`;
            }
          } catch (e) {
            authHeader = '解析失败';
          }
        }
      }
      
      // 与服务器进行同步
      console.log(`发送点赞请求: 帖子ID=${postId}, 预期状态=${newHasLiked ? '点赞' : '取消点赞'}, 认证状态=${authHeader}, ${tokenInfo}`);
      const response = await postsApi.toggleLike(postId);
      
      // 记录响应成功信息
      console.log(`点赞请求成功响应: `, response);
      
      // 如果服务器返回的状态与我们预期的不一致，调整UI状态
      if (response && response.liked !== undefined && response.liked !== newHasLiked) {
        console.log('服务器状态与本地预期不一致，正在更新UI...', {
          预期状态: newHasLiked,
          服务器返回状态: response.liked
        });
        
        // 以服务器返回的状态为准，更新UI
        const correctedPosts = currentPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              hasLiked: response.liked,
              likesCount: response.liked ? 
                (targetPost.hasLiked ? post.likesCount : post.likesCount + 1) : 
                (targetPost.hasLiked ? post.likesCount - 1 : post.likesCount)
            };
          }
          return post;
        });
        setPosts(correctedPosts);
        
        // 如果是当前选中的帖子，同步更新详情视图
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              hasLiked: response.liked,
              likesCount: response.liked ? 
                (targetPost.hasLiked ? prev.likesCount : prev.likesCount + 1) : 
                (targetPost.hasLiked ? prev.likesCount - 1 : prev.likesCount)
            };
          });
        }
      }
      
      // 点赞成功，显示轻量级提示（可选）
      // toast.success(newHasLiked ? '点赞成功' : '取消点赞成功', { duration: 1500 });
      
    } catch (err: any) {
      console.error("点赞操作失败:", err);
      
      // 回滚UI状态
      setPosts(previousPosts);
      
      // 如果是选中的帖子，也回滚详情视图
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            hasLiked: targetPost.hasLiked,
            likesCount: targetPost.likesCount
          };
        });
      }
      
      // 显示错误提示
      let errorMessage = '点赞失败，请稍后再试';
      let shouldRemovePost = false;
      
      // 从错误对象中提取具体错误信息
      if (err instanceof Error) {
        errorMessage = err.message;
        // 检查是否包含作品不存在的错误信息
        shouldRemovePost = err.message.includes('不存在') || err.message.includes('已被删除');
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        shouldRemovePost = err.response.status === 404;
      } else if (err.response?.status === 404) {
        errorMessage = '作品不存在或已被删除';
        shouldRemovePost = true;
      }
      
      // 如果是作品不存在错误，从列表中移除该帖子
      if (shouldRemovePost) {
        console.log(`从列表中移除不存在的帖子，ID: ${postId}`);
        const filteredPosts = currentPosts.filter(post => post.id !== postId);
        setPosts(filteredPosts);
        
        // 如果是当前选中的帖子，关闭详情模态框
        if (selectedPost?.id === postId) {
          setIsDetailModalOpen(false);
          setSelectedPost(null);
        }
        
        // 更友好的提示
        toast.error('该作品不存在或已被管理员删除', {
          description: '已从列表中移除该作品'
        });
      } else {
        toast.error(errorMessage);
      }
    }
  }, [isAuthenticated, selectedPost, setIsDetailModalOpen]);

  const handleFavoriteToggle = useCallback(async (postId: number) => {
    // 首先检查用户是否已登录
    if (!isAuthenticated) {
      toast.error('请先登录后再收藏');
      return;
    }

    // 检查用户权限（封禁用户无法收藏）
    if (!permissions.canFavorite()) {
      toast.error('您当前无法进行收藏操作');
      return;
    }
    
    // 防止点击无效帖子
    if (!postId || isNaN(postId) || postId <= 0) {
      toast.error('无效的作品ID');
      return;
    }
    
    const currentPosts = postsRef.current; // Use ref
    const targetPost = currentPosts.find(p => p.id === postId);
    
    // 如果在当前列表中找不到目标帖子，可能已被移除或过滤
    if (!targetPost) {
      console.error(`尝试收藏不存在的帖子: ID=${postId}`);
      toast.error('找不到要收藏的作品，请刷新页面');
      return;
    }
    
    // 如果帖子状态不可见，不允许收藏
    if (targetPost.status === 'HIDDEN' || targetPost.status === 'ADMIN_DELETED') {
      console.error(`尝试收藏不可见的帖子: ID=${postId}, 状态=${targetPost.status}`);
      toast.error('该作品当前不可见，无法进行收藏操作');
      return;
    }

    const newHasFavorited = !targetPost.hasFavorited;
    const previousPosts = [...currentPosts]; // 保存当前状态，用于可能的回滚
    
    // 乐观更新UI状态
    const updatedPosts = currentPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          hasFavorited: newHasFavorited,
          favoritesCount: newHasFavorited ? post.favoritesCount + 1 : Math.max(0, post.favoritesCount - 1)
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    
    // 如果是当前选中的帖子，同步更新详情视图
    if (selectedPost?.id === postId) {
      setSelectedPost(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          hasFavorited: newHasFavorited,
          favoritesCount: newHasFavorited ? prev.favoritesCount + 1 : Math.max(0, prev.favoritesCount - 1)
        };
      });
    }
    
    try {
      // 与服务器进行同步
      console.log(`发送收藏请求: 帖子ID=${postId}, 预期状态=${newHasFavorited ? '收藏' : '取消收藏'}`);
      const response = await postsApi.toggleFavorite(postId);
      
      // 如果服务器返回的状态与我们预期的不一致，调整UI状态
      if (response && response.favorited !== undefined && response.favorited !== newHasFavorited) {
        console.log('服务器状态与本地预期不一致，正在更新UI...', {
          预期状态: newHasFavorited,
          服务器返回状态: response.favorited
        });
        
        // 以服务器返回的状态为准，更新UI
        const correctedPosts = currentPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              hasFavorited: response.favorited,
              favoritesCount: response.favorited ? 
                (targetPost.hasFavorited ? post.favoritesCount : post.favoritesCount + 1) : 
                (targetPost.hasFavorited ? post.favoritesCount - 1 : post.favoritesCount)
            };
          }
          return post;
        });
        setPosts(correctedPosts);
        
        // 如果是当前选中的帖子，同步更新详情视图
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              hasFavorited: response.favorited,
              favoritesCount: response.favorited ? 
                (targetPost.hasFavorited ? prev.favoritesCount : prev.favoritesCount + 1) : 
                (targetPost.hasFavorited ? prev.favoritesCount - 1 : prev.favoritesCount)
            };
          });
        }
      }
      
      // 收藏成功，显示轻量级提示（可选）
      // toast.success(newHasFavorited ? '收藏成功' : '取消收藏成功', { duration: 1500 });
      
    } catch (err: any) {
      console.error("收藏操作失败:", err);
      
      // 回滚UI状态
      setPosts(previousPosts);
      
      // 如果是选中的帖子，也回滚详情视图
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            hasFavorited: targetPost.hasFavorited,
            favoritesCount: targetPost.favoritesCount
          };
        });
      }
      
      // 显示错误提示
      let errorMessage = '收藏失败，请稍后再试';
      let shouldRemovePost = false;
      
      // 从错误对象中提取具体错误信息
      if (err instanceof Error) {
        errorMessage = err.message;
        // 检查是否包含作品不存在的错误信息
        shouldRemovePost = err.message.includes('不存在') || err.message.includes('已被删除');
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        shouldRemovePost = err.response.status === 404;
      } else if (err.response?.status === 404) {
        errorMessage = '作品不存在或已被删除';
        shouldRemovePost = true;
      }
      
      // 如果是作品不存在错误，从列表中移除该帖子
      if (shouldRemovePost) {
        console.log(`从列表中移除不存在的帖子，ID: ${postId}`);
        const filteredPosts = currentPosts.filter(post => post.id !== postId);
        setPosts(filteredPosts);
        
        // 如果是当前选中的帖子，关闭详情模态框
        if (selectedPost?.id === postId) {
          setIsDetailModalOpen(false);
          setSelectedPost(null);
        }
        
        // 更友好的提示
        toast.error('该作品不存在或已被管理员删除', {
          description: '已从列表中移除该作品'
        });
      } else {
        toast.error(errorMessage);
      }
    }
  }, [isAuthenticated, selectedPost, setIsDetailModalOpen]);

  const handleUploadSuccess = useCallback(async () => {
    await fetchPosts({});
    // Layout will be updated by the useEffect watching 'posts'
  }, [fetchPosts]); // fetchPosts is stable

  // 编辑作品回调
  const handleEditPost = useCallback(() => {
    if (selectedPost) {
      setIsDetailModalOpen(false);
      setIsEditModalOpen(true);
    }
  }, [selectedPost]);

  // 删除作品回调
  const handleDeletePost = useCallback(async () => {
    if (!selectedPost) return;

    const confirmed = window.confirm('确定要删除这个作品吗？此操作不可撤销。');
    if (!confirmed) return;

    try {
      await postsApi.deletePost(selectedPost.id);
      toast.success('作品删除成功');
      
      // 从列表中移除已删除的作品
      setPosts(currentPosts => currentPosts.filter(p => p.id !== selectedPost.id));
      
      // 关闭详情模态框
      setIsDetailModalOpen(false);
      setSelectedPost(null);
    } catch (error: any) {
      console.error('删除作品失败:', error);
      toast.error(error.message || '删除作品失败，请稍后再试');
    }
  }, [selectedPost]);

  // 编辑成功回调
  const handleEditSuccess = useCallback(async () => {
    // 重新获取作品列表以更新数据
    await fetchPosts({});
    
    // 如果当前有选中的作品，重新获取其详情
    if (selectedPost) {
      try {
        const updatedPost = await postsApi.getPost(selectedPost.id);
        setSelectedPost(updatedPost);
      } catch (error) {
        console.error('获取更新后的作品详情失败:', error);
      }
    }
    
    setIsEditModalOpen(false);
    setIsDetailModalOpen(true);
    toast.success('作品信息更新成功');
  }, [fetchPosts, selectedPost]);

  const handleSearch = useCallback((filters: Record<string, any>) => {
    console.log('灵感页面接收到过滤参数:', filters);
    
    // 更新选中的类型，但不自动重置平台选择
    if (filters.type !== selectedType) {
      setSelectedType(filters.type);
    }
    
    // 处理作品类型过滤
    if (filters.type === 'all-types' || !filters.type || filters.type === '') {
      delete filters.type; // 删除该字段，相当于不过滤类型
      console.log('设置为显示所有类型');
    } else {
      console.log('设置类型过滤为:', filters.type);
    }
    
    // 处理AI平台过滤
    if (filters.aiPlatformId === 'no-platform-filter' || !filters.aiPlatformId || filters.aiPlatformId === '') {
      delete filters.aiPlatformId; 
      delete filters.aiPlatformIds; 
      console.log('设置为显示所有平台');
    } else if (filters.aiPlatformId) {
      // 检查是否是双属性平台
      const selectedPlatformId = parseInt(filters.aiPlatformId, 10);
      const selectedProcessedPlatform = processedPlatforms.find(p => p.id === selectedPlatformId);
      
      if (selectedProcessedPlatform && selectedProcessedPlatform.type === 'BOTH') {
        // 如果是双属性平台，需要找到该平台名称下的所有原始平台ID
        const platformName = selectedProcessedPlatform.name;
        const relatedPlatformIds = platforms
          .filter(p => p.name === platformName && p.status === 'ACTIVE')
          .map(p => p.id);
        
        if (relatedPlatformIds.length > 1) {
          // 使用多平台ID格式
          filters.aiPlatformIds = relatedPlatformIds.join(',');
          delete filters.aiPlatformId;
          console.log('设置双属性平台过滤，平台名称:', platformName, 'IDs:', filters.aiPlatformIds);
        } else if (relatedPlatformIds.length === 1) {
          // 只有一个ID，使用单平台格式
          filters.aiPlatformId = relatedPlatformIds[0];
          console.log('设置单平台过滤（来自双属性）:', filters.aiPlatformId);
        }
      } else {
        // 检查是否是逗号分隔的ID列表（多平台格式）
        if (typeof filters.aiPlatformId === 'string' && filters.aiPlatformId.includes(',')) {
          // 处理多个平台ID
          filters.aiPlatformIds = filters.aiPlatformId;
          delete filters.aiPlatformId;
          console.log('设置多平台过滤为:', filters.aiPlatformIds);
        } else {
          // 处理单个平台ID
          if (typeof filters.aiPlatformId === 'string') {
            const platformId = parseInt(filters.aiPlatformId, 10);
            if (isNaN(platformId) || platformId <= 0) {
              console.warn('无效的平台ID:', filters.aiPlatformId);
              delete filters.aiPlatformId;
            } else {
              filters.aiPlatformId = platformId;
              console.log('设置单平台过滤为:', filters.aiPlatformId);
            }
          } else {
            console.log('设置平台过滤为:', filters.aiPlatformId);
          }
        }
      }
    }
    
    // 处理收藏过滤
    if (filters.onlyFavorites === true) {
      filters.onlyFavorites = true;
      console.log('启用收藏过滤');
    } else {
      delete filters.onlyFavorites;
      console.log('禁用收藏过滤');
    }
    
    // 处理我的作品过滤
    if (filters.onlyMyPosts === true) {
      filters.onlyMyPosts = true;
      console.log('启用我的作品过滤');
    } else {
      delete filters.onlyMyPosts;
      console.log('禁用我的作品过滤');
    }
    
    console.log('最终发送的过滤参数:', filters);
    
    fetchPosts(filters);
  }, [fetchPosts, selectedType, processedPlatforms, platforms]);

  const handleMediaDimensionChange = useCallback((postId: number, aspectRatio: number | null) => {
    // 我们仍然收集媒体尺寸信息，但不再用于布局计算
    setMediaDimensions(prev => {
      if (prev[postId]?.aspectRatio === aspectRatio) {
        return prev; 
      }
      return {
        ...prev,
        [postId]: { aspectRatio }
      };
    });
  }, []); // No dependencies, stable reference

  // 搜索过滤器配置
  const searchFilters = [
    {
      name: 'type',
      label: '作品类型',
      type: 'select' as const,
      options: [
        { value: 'all-types', label: '全部类型' },
        { value: 'IMAGE', label: '图片' },
        { value: 'VIDEO', label: '视频' },
      ]
    },
    {
      name: 'onlyFavorites',
      label: '仅显示我的收藏',
      type: 'boolean' as const,
      defaultValue: false
    },
    {
      name: 'onlyMyPosts',
      label: '仅显示我的灵感',
      type: 'boolean' as const,
      defaultValue: false
    }
  ];

  // 禁用右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // 游客无法访问
  if (!canAccess) {
    return <GuestAccessDenied />;
  }

  return (
    <PageTransition>
      <div 
        className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden" 
        ref={containerRef}
        onContextMenu={handleContextMenu} // 禁用右键菜单
      >
        {/* 头部区域 */}
        <div className="p-4 flex-shrink-0">
          <Suspense fallback={<SearchFilterFallback />}>
            <div className="flex items-center gap-4 w-full">
              {/* 搜索和过滤区域 */}
              <div className="flex-1 min-w-0">
                <SearchFilter 
                  onSearch={handleSearch} 
                  filters={searchFilters}
                  platforms={processedPlatforms}
                  sortOptions={[
                    { value: 'newest', label: '最新发布' },
                    { value: 'oldest', label: '最早发布' },
                    { value: 'popular', label: '最多点赞' },
                    { value: 'views', label: '最多浏览' },
                    { value: 'favorites', label: '最多收藏' },
                  ]}
                  placeholder="搜索提示词、描述、用户或AI平台..."
                  className="w-full"
                />
              </div>
              
              {/* 上传按钮 */}
              <div className="flex-shrink-0">
                {permissions.canUploadPost() ? (
                  <Button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="bg-primary-gradient text-white border-0 hover:opacity-90 transition-opacity h-10 px-4"
                    size="default"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    <span>分享灵感</span>
                  </Button>
                ) : (
                  <Button 
                    disabled
                    className="h-10 px-4 opacity-50 cursor-not-allowed"
                    size="default"
                    title="需要会员权限"
                  >
                    <Lock className="h-4 w-4 mr-2" /> 
                    <span className="font-bold">分享灵感</span>
                  </Button>
                )}
              </div>
            </div>
          </Suspense>
        </div>

        {/* 内容区域 - 瀑布流布局 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 content-scrollbar">
          {!loading && !error && posts.length > 0 && (
            <div 
              className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2 space-y-2 py-2"
              onContextMenu={handleContextMenu} // 再次禁用右键菜单（确保嵌套元素也禁用）
            >
              {posts.map((post) => (
                <div key={post.id} className="break-inside-avoid mb-2 transform-gpu">
                  <PostCard
                    post={post}
                    onClick={() => handlePostClick(post)}
                    onLike={permissions.canLike() ? () => handleLikeToggle(post.id) : () => toast.error('您当前无法进行点赞操作')}
                    onFavorite={permissions.canFavorite() ? () => handleFavoriteToggle(post.id) : () => toast.error('您当前无法进行收藏操作')}
                    onDownload={() => {
                      // 简单的下载处理，可以后续完善
                      if (post.allowDownload) {
                        window.open(post.fileUrl, '_blank');
                      } else {
                        toast.info('该作品不允许下载');
                      }
                    }}
                    onEdit={() => {
                      setSelectedPost(post);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={() => {
                      setSelectedPost(post);
                      handleDeletePost();
                    }}
                    userRole={user?.role || 'NORMAL'}
                    currentUser={user ? {
                      id: user.id,
                      username: user.username,
                      nickname: user.nickname,
                      avatarUrl: user.avatarUrl
                    } : {
                      id: 0,
                      username: 'guest',
                      nickname: '游客',
                      avatarUrl: undefined
                    }}
                    onMediaDimensionChange={handleMediaDimensionChange}
                    className="transform-gpu"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 加载状态 */}
          {loading && (
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2 space-y-2 py-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="break-inside-avoid mb-2">
                  <div className="relative w-full rounded-md overflow-hidden">
                    <div 
                      style={{ paddingBottom: `${Math.random() * 40 + 80}%` }} 
                      className="bg-gray-200 dark:bg-gray-700 animate-pulse"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 错误状态 */}
          {!loading && error && (
            <div className="flex items-center justify-center h-full">
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
                {error}
              </div>
            </div>
          )}
          
          {/* 空状态 */}
          {!loading && !error && posts.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-6 text-gray-500">
                <p className="text-xl mb-2">暂无作品</p>
                <p>上传新作品或调整筛选条件试试看</p>
              </div>
            </div>
          )}
        </div>

        {/* 模态框 */}
        {permissions.canUploadPost() && (
          <UploadPostModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onSuccess={handleUploadSuccess}
            platforms={platforms}
          />
        )}
        
        {selectedPost && (
          <PostDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            post={selectedPost}
            onLike={() => handleLikeToggle(selectedPost.id)}
            onFavorite={() => handleFavoriteToggle(selectedPost.id)}
            userRole={user?.role}
            currentUser={user ? {
              id: user.id,
              username: user.username,
              nickname: user.nickname
            } : undefined}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
          />
        )}
        
        {/* 编辑作品模态框 */}
        {selectedPost && (
          <EditPostModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            post={selectedPost}
            platforms={platforms}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </PageTransition>
  );
} 