import { api } from './api';
import { EntityType } from '../../types';

// 更新个人资料参数
export interface UpdateProfilePayload {
  nickname?: string;
  avatarUrl?: string;
}

// 修改密码参数
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  entityType?: EntityType;
}

export const usersApi = {
  // 获取当前用户信息
  getProfile: async () => {
    const { data } = await api.get('/users/me');
    return data;
  },
  
  // 更新个人资料
  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await api.patch('/users/me', payload);
    return data;
  },
  
  // 修改密码
  changePassword: async (payload: ChangePasswordPayload) => {
    console.log('发送修改密码请求:', {
      url: '/users/change-password',
      payload: {
        currentPassword: `长度: ${payload.currentPassword.length}`,
        newPassword: `长度: ${payload.newPassword.length}`,
      },
    });
    
    try {
      const response = await api.post('/users/change-password', payload);
      console.log('修改密码请求成功:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });
      return response.data;
    } catch (error: any) {
      console.error('修改密码请求失败:', {
        name: error.name,
        message: error.message,
        response: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        },
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });
      throw error;
    }
  },
  
  // 上传头像
  uploadAvatar: async (formData: FormData) => {
    try {
      console.log('开始上传头像...');
      // 不再需要folder参数，直接调用新接口
      const { data } = await api.post('/storage/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('头像上传成功，原始响应:', data);
      
      // 确保URL格式一致
      if (data.url) {
        // 获取API基础URL
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        // 统一处理头像URL格式
        if (!data.url.startsWith('http')) {
          // 如果是相对路径，添加基础URL
          if (data.url.includes('/uploads/')) {
            data.url = `${baseUrl}${data.url.startsWith('/') ? '' : '/'}${data.url}`;
          } else if (data.url.includes('avatar/')) {
            data.url = `${baseUrl}/uploads/${data.url.startsWith('/') ? data.url.substring(1) : data.url}`;
          } else {
            // 其他情况，假设是相对于后端的路径
            data.url = `${baseUrl}${data.url.startsWith('/') ? '' : '/'}${data.url}`;
          }
          console.log('修正后的头像完整URL:', data.url);
        }
        
        // 记录URL格式信息
        console.log('头像URL格式检查:', {
          URL: data.url,
          是否以http开头: data.url.startsWith('http'),
          是否包含uploads: data.url.includes('/uploads/'),
          是否包含avatar: data.url.includes('/avatar/')
        });
      }
      
      return data;
    } catch (error) {
      console.error('头像上传失败:', error);
      throw error;
    }
  },
  
  // 获取我的收藏
  getMyFavorites: async (params: PaginationParams = {}) => {
    const { page = 1, limit = 10, entityType } = params;
    const { data } = await api.get('/users/me/favorites', {
      params: { page, limit, entityType }
    });
    return data;
  },
  
  // 获取我的点赞
  getMyLikes: async (params: PaginationParams = {}) => {
    const { page = 1, limit = 10, entityType } = params;
    const { data } = await api.get('/users/me/likes', {
      params: { page, limit, entityType }
    });
    return data;
  }
}; 