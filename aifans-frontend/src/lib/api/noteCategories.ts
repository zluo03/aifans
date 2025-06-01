import { NoteCategory } from '@/types';
import { api } from './api';

export const noteCategoriesApi = {
  // 获取所有笔记分类
  getAllCategories: async (): Promise<NoteCategory[]> => {
    const { data } = await api.get('/note-categories');
    return data;
  },

  // 管理员API
  admin: {
    // 获取所有类别（管理员视图）
    getAllCategories: async (): Promise<NoteCategory[]> => {
      const { data } = await api.get('/admin/note-categories');
      return data;
    },

    // 创建新类别
    createCategory: async (categoryData: { name: string; description?: string }): Promise<NoteCategory> => {
      const { data } = await api.post('/admin/note-categories', categoryData);
      return data;
    },

    // 更新类别
    updateCategory: async (id: number, categoryData: { name?: string; description?: string }): Promise<NoteCategory> => {
      const { data } = await api.patch(`/admin/note-categories/${id}`, categoryData);
      return data;
    },

    // 删除类别
    deleteCategory: async (id: number): Promise<void> => {
      await api.delete(`/admin/note-categories/${id}`);
    },

    // 获取单个类别详情
    getCategory: async (id: number): Promise<NoteCategory> => {
      const { data } = await api.get(`/admin/note-categories/${id}`);
      return data;
    },
  }
}; 