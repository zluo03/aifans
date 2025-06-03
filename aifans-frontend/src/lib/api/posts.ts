import { api } from './api';

// 帖子分页响应接口
export interface PostPaginationResponse {
  data: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 帖子类型
export interface Post {
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
  status: 'VISIBLE' | 'HIDDEN' | 'ADMIN_DELETED';
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl?: string;
  };
  hasLiked?: boolean;
  hasFavorited?: boolean;
  createdAt: string; // ISO日期字符串
  updatedAt: string; // ISO日期字符串
}

// 创建帖子参数
export interface CreatePostPayload {
  type: "IMAGE" | "VIDEO";
  title?: string;
  prompt: string;
  modelUsed: string;
  aiPlatformId: number;
  videoCategory?: string;
  allowDownload?: boolean;
  file: File;
}

export const postsApi = {
  // 获取帖子列表
  getPosts: async (params: Record<string, any> = {}): Promise<PostPaginationResponse> => {
    const { data } = await api.get('/posts', { params });
    return data;
  },

  // 获取单个帖子详情
  getPost: async (id: number): Promise<Post> => {
    try {
      // 确保ID有效
      if (!id || isNaN(id) || id <= 0) {
        throw new Error('无效的帖子ID');
      }
      
      const { data } = await api.get(`/posts/${id}`);
      
      // 验证返回的数据格式
      if (!data || !data.id) {
        throw new Error('返回的帖子数据无效');
      }
      
      return data;
    } catch (error: any) {
      // 重新抛出带有友好消息的错误
      if (error.response?.status === 404) {
        throw new Error('作品不存在或已被删除');
      } else if (error.response) {
        throw new Error(error.response.data?.message || '获取作品详情失败');
      } else {
        throw new Error('获取作品详情失败，请检查网络连接');
      }
    }
  },

  // 创建帖子
  createPost: async (payload: CreatePostPayload): Promise<Post> => {
    const formData = new FormData();
    formData.append('type', payload.type);
    if (payload.title) formData.append('title', payload.title);
    formData.append('prompt', payload.prompt);
    formData.append('modelUsed', payload.modelUsed);
    formData.append('aiPlatformId', payload.aiPlatformId.toString());
    if (payload.videoCategory) formData.append('videoCategory', payload.videoCategory);
    if (payload.allowDownload !== undefined) formData.append('allowDownload', payload.allowDownload.toString());
    formData.append('file', payload.file);

    const { data } = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // 更新帖子
  updatePost: async (id: number, payload: Partial<CreatePostPayload>): Promise<Post> => {
    const { data } = await api.patch(`/posts/${id}`, payload);
    return data;
  },

  // 删除帖子
  deletePost: async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  // 点赞/取消点赞帖子
  toggleLike: async (id: number): Promise<{ liked: boolean }> => {
    try {
      // 确保ID有效
      if (!id || isNaN(id) || id <= 0) {
        throw new Error('无效的帖子ID');
      }
      
      // 尝试验证帖子是否存在
      try {
        const postResponse = await api.get(`/posts/${id}`);
        
        // 只有明确标记为不可见的帖子才拒绝点赞
        if (postResponse.data?.status === 'HIDDEN' || postResponse.data?.status === 'ADMIN_DELETED') {
          throw new Error('该作品当前不可见，无法点赞');
        }
      } catch (verifyError: any) {
        // 如果是明确的不可见错误，则直接抛出
        if (verifyError.message?.includes('不可见')) {
          throw verifyError;
        }
        // 其他错误（如404）继续尝试点赞
      }
      
      // 实现请求重试逻辑
      let retryCount = 0;
      const maxRetries = 2;
      let lastError = null;
      
      while (retryCount <= maxRetries) {
        try {
          const { data } = await api.post(`/posts/${id}/like`, {}, {
            timeout: 10000 // 增加超时时间
          });
          
          // 确保返回值符合预期
          if (data && typeof data.liked === 'boolean') {
            return data;
          } else {
            return { liked: !!data?.success }; // 尝试根据success字段推断点赞状态
          }
        } catch (err: any) {
          lastError = err;
          
          if (err.response && err.response.status === 401) {
            throw new Error('请先登录后再点赞');
          }
          
          // 如果收到404错误，立即中断并返回友好错误
          if (err.response && err.response.status === 404) {
            throw new Error('要点赞的作品不存在或已被删除');
          }
          
          // 网络问题或服务端超时，可以重试
          if (!err.response || err.response.status >= 500) {
            retryCount++;
            if (retryCount <= maxRetries) {
              // 指数退避重试
              const delay = 1000 * retryCount;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          
          throw err;
        }
      }
      
      // 如果重试后仍然失败，抛出最后的错误
      if (lastError) {
        throw lastError;
      }
      
      // 默认返回值（理论上不会执行到这里）
      return { liked: false };
    } catch (error: any) {
      // 处理错误并返回友好的错误消息
      if (error.response?.status === 401) {
        throw new Error('请先登录后再点赞');
      } else if (error.response?.status === 404) {
        throw new Error('要点赞的作品不存在或已被删除');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || '点赞操作失败，请稍后再试');
      }
    }
  },

  // 收藏/取消收藏帖子
  toggleFavorite: async (id: number): Promise<{ favorited: boolean }> => {
    try {
      // 确保ID有效
      if (!id || isNaN(id) || id <= 0) {
        throw new Error('无效的帖子ID');
      }
      
      // 尝试验证帖子是否存在
      try {
        const postResponse = await api.get(`/posts/${id}`);
        
        // 只有明确标记为不可见的帖子才拒绝收藏
        if (postResponse.data?.status === 'HIDDEN' || postResponse.data?.status === 'ADMIN_DELETED') {
          throw new Error('该作品当前不可见，无法收藏');
        }
      } catch (verifyError: any) {
        // 如果是明确的不可见错误，则直接抛出
        if (verifyError.message?.includes('不可见')) {
          throw verifyError;
        }
        // 其他错误（如404）继续尝试收藏
      }
      
      // 实现请求重试逻辑
      let retryCount = 0;
      const maxRetries = 2;
      let lastError = null;
      
      while (retryCount <= maxRetries) {
        try {
          const { data } = await api.post(`/posts/${id}/favorite`, {}, {
            timeout: 10000 // 增加超时时间
          });
          
          // 确保返回值符合预期
          if (data && typeof data.favorited === 'boolean') {
            return data;
          } else {
            return { favorited: !!data?.success }; // 尝试根据success字段推断收藏状态
          }
        } catch (err: any) {
          lastError = err;
          
          if (err.response && err.response.status === 401) {
            throw new Error('请先登录后再收藏');
          }
          
          // 如果收到404错误，立即中断并返回友好错误
          if (err.response && err.response.status === 404) {
            throw new Error('要收藏的作品不存在或已被删除');
          }
          
          // 网络问题或服务端超时，可以重试
          if (!err.response || err.response.status >= 500) {
            retryCount++;
            if (retryCount <= maxRetries) {
              // 指数退避重试
              const delay = 1000 * retryCount;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          
          throw err;
        }
      }
      
      // 如果重试后仍然失败，抛出最后的错误
      if (lastError) {
        throw lastError;
      }
      
      // 默认返回值（理论上不会执行到这里）
      return { favorited: false };
    } catch (error: any) {
      // 处理错误并返回友好的错误消息
      if (error.response?.status === 401) {
        throw new Error('请先登录后再收藏');
      } else if (error.response?.status === 404) {
        throw new Error('要收藏的作品不存在或已被删除');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || '收藏操作失败，请稍后再试');
      }
    }
  },

  // 获取我的帖子
  getMyPosts: async (page: number = 1, limit: number = 10): Promise<PostPaginationResponse> => {
    const { data } = await api.get('/posts/user/my', { params: { page, limit } });
    return data;
  },

  // 获取我点赞的帖子
  getLikedPosts: async (page: number = 1, limit: number = 10): Promise<PostPaginationResponse> => {
    const { data } = await api.get('/posts/user/liked', { params: { page, limit } });
    return data;
  },

  // 获取我收藏的帖子
  getFavoritedPosts: async (page: number = 1, limit: number = 10): Promise<PostPaginationResponse> => {
    const { data } = await api.get('/posts/user/favorited', { params: { page, limit } });
    return data;
  },
}; 