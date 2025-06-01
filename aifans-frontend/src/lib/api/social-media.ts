import { api } from './api';

export const socialMediaApi = {
  // 获取所有社交媒体平台
  getAll: async () => {
    console.log('请求社交媒体列表 /social-media/active');
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
    console.log('请求管理员社交媒体列表 /social-media/admin');
    const { data } = await api.get('/api/social-media/admin');
    return data;
  }
}; 