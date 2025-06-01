import { api } from './api';

// 放映分页响应接口
export interface ScreeningPaginationResponse {
  screenings: Screening[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 评论响应类型
export interface ScreeningComment {
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

export const screeningsApi = {
  // 获取放映列表
  getScreenings: async (page: number = 1, limit: number = 10): Promise<ScreeningPaginationResponse> => {
    const { data } = await api.get('/screenings', { params: { page, limit } });
    return data;
  },

  // 获取单个放映详情
  getScreening: async (id: number): Promise<Screening> => {
    const { data } = await api.get(`/screenings/${id}`);
    return data;
  },

  // 点赞/取消点赞放映
  toggleLike: async (id: number): Promise<{ liked: boolean }> => {
    const { data } = await api.post(`/screenings/${id}/like`);
    return data;
  },

  // 获取放映评论
  getComments: async (id: number): Promise<ScreeningComment[]> => {
    const { data } = await api.get(`/screenings/${id}/comments`);
    return data;
  },

  // 添加放映评论/弹幕
  addComment: async (id: number, content: string): Promise<ScreeningComment> => {
    const { data } = await api.post(`/screenings/${id}/comments`, { content });
    return data;
  },
};

// 管理员API
export const adminScreeningsApi = {
  // 上传放映视频
  uploadScreening: async (formData: FormData): Promise<Screening> => {
    const { data } = await api.post('/admin/screenings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // 删除放映视频
  deleteScreening: async (id: number): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/admin/screenings/${id}`);
    return data;
  },
}; 