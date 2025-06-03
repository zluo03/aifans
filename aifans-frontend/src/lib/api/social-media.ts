import { api } from './api';

export const socialMediaApi = {
  // 获取所有社交媒体平台
  getAll: async () => {
    const { data } = await api.get('/api/social-media/active');
    return data;
  },

  // 获取单个社交媒体平台
  getOne: async (id: number) => {
    const { data } = await api.get(`/api/social-media/${id}`);
    return data;
  },
  
  // 获取管理员列表
  getAdmin: async () => {
    const { data } = await api.get('/api/social-media/admin');
    return data;
  }
}; 