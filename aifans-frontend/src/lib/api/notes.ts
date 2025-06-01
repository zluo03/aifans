import { Note, NotePaginationResponse } from '@/types';
import { api } from './api';

export interface NoteFilters {
  userId?: number;
  categoryId?: number;
  query?: string;
  page?: number;
  limit?: number;
}

export interface CreateNotePayload {
  title: string;
  content: any;
  categoryId: number;
  coverImageUrl?: string;
}

export interface UpdateNotePayload {
  title?: string;
  content?: any;
  categoryId?: number;
  coverImageUrl?: string;
}

export const notesApi = {
  // 获取笔记列表
  getNotes: async (filters?: NoteFilters): Promise<NotePaginationResponse> => {
    const { data } = await api.get('/notes', { params: filters });
    return data;
  },

  // 获取用户点赞的笔记
  getLikedNotes: async (page: number = 1, limit: number = 10): Promise<NotePaginationResponse> => {
    const { data } = await api.get('/notes/user/liked', { params: { page, limit } });
    return data;
  },

  // 获取用户收藏的笔记
  getFavoritedNotes: async (page: number = 1, limit: number = 10): Promise<NotePaginationResponse> => {
    const { data } = await api.get('/notes/user/favorited', { params: { page, limit } });
    return data;
  },

  // 获取单个笔记详情
  getNote: async (id: number): Promise<Note> => {
    const { data } = await api.get(`/notes/${id}`);
    return data;
  },

  // 创建笔记
  createNote: async (payload: CreateNotePayload): Promise<Note> => {
    const { data } = await api.post('/notes', payload);
    return data;
  },

  // 更新笔记
  updateNote: async (id: number, payload: UpdateNotePayload): Promise<Note> => {
    const { data } = await api.patch(`/notes/${id}`, payload);
    return data;
  },

  // 删除笔记
  deleteNote: async (id: number): Promise<void> => {
    await api.delete(`/notes/${id}`);
  },

  // 点赞/取消点赞笔记
  toggleLike: async (id: number): Promise<{ liked: boolean }> => {
    const { data } = await api.post(`/notes/${id}/like`);
    return data;
  },

  // 收藏/取消收藏笔记
  toggleFavorite: async (id: number): Promise<{ favorited: boolean }> => {
    const { data } = await api.post(`/notes/${id}/favorite`);
    return data;
  },

  // 获取视频访问token
  getVideoToken: async (videoPath: string): Promise<{ 
    token: string; 
    expiresAt: number; 
    url: string; 
  }> => {
    console.log('=== getVideoToken 调试信息 ===');
    console.log('请求的视频路径:', videoPath);
    console.log('编码后的路径:', encodeURIComponent(videoPath));
    
    // 使用配置好的api客户端，这样会自动携带认证信息
    const { data } = await api.get('/storage/video/token', {
      params: { path: videoPath }
    });
    
    console.log('成功响应数据:', data);
    return data;
  },
}; 