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
      
      console.log(`获取帖子详情，ID: ${id}`);
      const { data } = await api.get(`/posts/${id}`);
      
      // 验证返回的数据格式
      if (!data || !data.id) {
        throw new Error('返回的帖子数据无效');
      }
      
      console.log(`成功获取帖子详情，ID: ${id}`);
      return data;
    } catch (error: any) {
      console.error(`获取帖子详情失败，ID: ${id}`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
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
        console.error(`无效的帖子ID: ${id}`);
        throw new Error('无效的帖子ID');
      }
      
      console.log(`开始发送点赞请求，帖子ID: ${id}`);
      
      // 记录当前的认证状态，用于调试
      let authHeader = null;
      if (typeof window !== 'undefined') {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          try {
            const { state } = JSON.parse(decodeURIComponent(authStorage));
            authHeader = state?.token ? '存在' : '不存在';
          } catch (e) {
            authHeader = '解析失败';
          }
        }
      }
      
      console.log(`点赞请求认证状态: ${authHeader || '未找到'}`);
      
      // 尝试验证帖子是否存在，但即使验证失败也继续点赞操作
      let postVerified = false;
      try {
        console.log(`验证帖子是否存在，ID: ${id}`);
        const postResponse = await api.get(`/posts/${id}`);
        
        // 详细记录帖子数据以便调试
        console.log(`获取到帖子数据:`, {
          id: postResponse.data?.id,
          状态: postResponse.data?.status,
          标题: postResponse.data?.title,
          用户: postResponse.data?.user?.username,
          平台: postResponse.data?.aiPlatform?.name,
          创建时间: postResponse.data?.createdAt
        });
        
        // 记录帖子状态，但不强制要求状态为VISIBLE
        console.log(`帖子验证成功，ID: ${id}, 状态: ${postResponse.data?.status || '未指定'}`);
        
        // 只有明确标记为不可见的帖子才拒绝点赞
        if (postResponse.data?.status === 'HIDDEN' || postResponse.data?.status === 'ADMIN_DELETED') {
          console.error(`帖子状态不可见，ID: ${id}, 状态: ${postResponse.data?.status}`);
          throw new Error('该作品当前不可见，无法点赞');
        }
        
        postVerified = true;
      } catch (verifyError: any) {
        // 如果验证请求失败且是404错误，可能帖子已被删除
        if (verifyError.response?.status === 404) {
          console.error(`帖子不存在，ID: ${id}`);
          console.warn('帖子验证失败，但将继续尝试点赞操作');
          // 注意：不立即抛出错误，而是继续尝试点赞
        } else if (verifyError.message?.includes('不可见')) {
          // 如果是明确的不可见错误，则直接抛出
          throw verifyError;
        } else {
          // 其他验证错误，记录但继续尝试点赞
          console.warn(`帖子验证请求失败，但将继续尝试点赞，ID: ${id}`, verifyError.message);
        }
      }
      
      // 实现请求重试逻辑
      let retryCount = 0;
      const maxRetries = 2;
      let lastError = null;
      
      while (retryCount <= maxRetries) {
        try {
          if (retryCount > 0) {
            console.log(`点赞请求重试 #${retryCount}, 帖子ID: ${id}`);
          }
          
          // 记录完整的请求URL
          const requestUrl = `/posts/${id}/like`;
          console.log(`发送点赞请求到: ${requestUrl}`);
          
          // 直接使用API请求，确保使用的是正确的baseURL
          const { data } = await api.post(requestUrl, {}, {
            timeout: 10000, // 增加超时时间
          });
          
          console.log(`点赞请求成功，响应数据:`, data);
          // 确保返回值符合预期
          if (data && typeof data.liked === 'boolean') {
            return data;
          } else {
            console.warn(`点赞响应数据结构异常:`, data);
            return { liked: !!data?.success }; // 尝试根据success字段推断点赞状态
          }
        } catch (err: any) {
          lastError = err;
          
          if (err.response && err.response.status === 401) {
            console.error('点赞请求未授权，用户可能未登录');
            throw new Error('请先登录后再点赞');
          }
          
          // 如果收到404错误，立即中断并返回友好错误
          if (err.response && err.response.status === 404) {
            console.error(`帖子不存在(点赞时)，ID: ${id}`);
            throw new Error('要点赞的作品不存在或已被删除');
          }
          
          // 网络问题或服务端超时，可以重试
          if (!err.response || err.response.status >= 500) {
            retryCount++;
            if (retryCount <= maxRetries) {
              // 指数退避重试
              const delay = 1000 * retryCount;
              console.log(`将在${delay}ms后重试点赞请求`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          } else {
            // 客户端错误（400系列）不重试
            break;
          }
        }
      }
      
      // 所有重试都失败，处理最终错误
      // 详细记录错误信息
      let errorInfo = {
        message: lastError?.message || '未知错误',
        status: lastError?.response?.status,
        statusText: lastError?.response?.statusText,
        data: lastError?.response?.data || '无响应数据',
        isAxiosError: lastError?.isAxiosError,
        details: lastError?.details || {}
      };
      
      console.error(`点赞请求失败（已重试${retryCount}次），帖子ID: ${id}，错误:`, errorInfo);
      
      // 如果是404错误，给出更友好的错误信息
      if (lastError?.response?.status === 404) {
        throw new Error(lastError?.response?.data?.message || '作品不存在或已被删除');
      }
      
      // 如果是其他HTTP错误，使用更友好的错误信息
      if (lastError?.response) {
        throw new Error(lastError?.response?.data?.message || '点赞失败，服务器响应异常');
      }
      
      // 网络错误或其他错误
      throw new Error('点赞失败，请检查网络连接并稍后再试');
    } catch (error: any) {
      // 记录错误并重新抛出
      console.error(`点赞操作处理异常: ${error.message}`);
      throw error;
    }
  },

  // 收藏/取消收藏帖子
  toggleFavorite: async (id: number): Promise<{ favorited: boolean }> => {
    try {
      // 确保ID有效
      if (!id || isNaN(id) || id <= 0) {
        console.error(`无效的帖子ID: ${id}`);
        throw new Error('无效的帖子ID');
      }
      
      console.log(`开始发送收藏请求，帖子ID: ${id}`);
      
      // 记录当前的认证状态，用于调试
      let authHeader = null;
      if (typeof window !== 'undefined') {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          try {
            const { state } = JSON.parse(decodeURIComponent(authStorage));
            authHeader = state?.token ? '存在' : '不存在';
          } catch (e) {
            authHeader = '解析失败';
          }
        }
      }
      
      console.log(`收藏请求认证状态: ${authHeader || '未找到'}`);
      
      // 尝试验证帖子是否存在，但即使验证失败也继续收藏操作
      let postVerified = false;
      try {
        console.log(`验证帖子是否存在，ID: ${id}`);
        const postResponse = await api.get(`/posts/${id}`);
        
        // 详细记录帖子数据以便调试
        console.log(`获取到帖子数据:`, {
          id: postResponse.data?.id,
          状态: postResponse.data?.status,
          标题: postResponse.data?.title,
          用户: postResponse.data?.user?.username,
          平台: postResponse.data?.aiPlatform?.name,
          创建时间: postResponse.data?.createdAt
        });
        
        // 记录帖子状态，但不强制要求状态为VISIBLE
        console.log(`帖子验证成功，ID: ${id}, 状态: ${postResponse.data?.status || '未指定'}`);
        
        // 只有明确标记为不可见的帖子才拒绝收藏
        if (postResponse.data?.status === 'HIDDEN' || postResponse.data?.status === 'ADMIN_DELETED') {
          console.error(`帖子状态不可见，ID: ${id}, 状态: ${postResponse.data?.status}`);
          throw new Error('该作品当前不可见，无法收藏');
        }
        
        postVerified = true;
      } catch (verifyError: any) {
        // 如果验证请求失败且是404错误，可能帖子已被删除
        if (verifyError.response?.status === 404) {
          console.error(`帖子不存在，ID: ${id}`);
          console.warn('帖子验证失败，但将继续尝试收藏操作');
          // 注意：不立即抛出错误，而是继续尝试收藏
        } else if (verifyError.message?.includes('不可见')) {
          // 如果是明确的不可见错误，则直接抛出
          throw verifyError;
        } else {
          // 其他验证错误，记录但继续尝试收藏
          console.warn(`帖子验证请求失败，但将继续尝试收藏，ID: ${id}`, verifyError.message);
        }
      }
      
      // 实现请求重试逻辑
      let retryCount = 0;
      const maxRetries = 2;
      let lastError = null;
      
      while (retryCount <= maxRetries) {
        try {
          if (retryCount > 0) {
            console.log(`收藏请求重试 #${retryCount}, 帖子ID: ${id}`);
          }
          
          // 记录完整的请求URL
          const requestUrl = `/posts/${id}/favorite`;
          console.log(`发送收藏请求到: ${requestUrl}`);
          
          // 直接使用API请求，确保使用的是正确的baseURL
          const { data } = await api.post(requestUrl, {}, {
            timeout: 10000, // 增加超时时间
          });
          
          console.log(`收藏请求成功，响应数据:`, data);
          // 确保返回值符合预期
          if (data && typeof data.favorited === 'boolean') {
            return data;
          } else {
            console.warn(`收藏响应数据结构异常:`, data);
            return { favorited: !!data?.success }; // 尝试根据success字段推断收藏状态
          }
        } catch (err: any) {
          lastError = err;
          
          if (err.response && err.response.status === 401) {
            console.error('收藏请求未授权，用户可能未登录');
            throw new Error('请先登录后再收藏');
          }
          
          // 如果收到404错误，立即中断并返回友好错误
          if (err.response && err.response.status === 404) {
            console.error(`帖子不存在(收藏时)，ID: ${id}`);
            throw new Error('要收藏的作品不存在或已被删除');
          }
          
          // 网络问题或服务端超时，可以重试
          if (!err.response || err.response.status >= 500) {
            retryCount++;
            if (retryCount <= maxRetries) {
              // 指数退避重试
              const delay = 1000 * retryCount;
              console.log(`将在${delay}ms后重试收藏请求`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          } else {
            // 客户端错误（400系列）不重试
            break;
          }
        }
      }
      
      // 所有重试都失败，处理最终错误
      // 详细记录错误信息
      let errorInfo = {
        message: lastError?.message || '未知错误',
        status: lastError?.response?.status,
        statusText: lastError?.response?.statusText,
        data: lastError?.response?.data || '无响应数据',
        isAxiosError: lastError?.isAxiosError,
        details: lastError?.details || {}
      };
      
      console.error(`收藏请求失败（已重试${retryCount}次），帖子ID: ${id}，错误:`, errorInfo);
      
      // 如果是404错误，给出更友好的错误信息
      if (lastError?.response?.status === 404) {
        throw new Error(lastError?.response?.data?.message || '作品不存在或已被删除');
      }
      
      // 如果是其他HTTP错误，使用更友好的错误信息
      if (lastError?.response) {
        throw new Error(lastError?.response?.data?.message || '收藏失败，服务器响应异常');
      }
      
      // 网络错误或其他错误
      throw new Error('收藏失败，请检查网络连接并稍后再试');
    } catch (error: any) {
      // 记录错误并重新抛出
      console.error(`收藏操作处理异常: ${error.message}`);
      throw error;
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