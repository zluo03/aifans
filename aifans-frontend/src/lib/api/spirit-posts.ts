import { api as apiClient } from './api';

export interface SpiritPost {
  id: number;
  userId: number;
  title: string;
  content: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
  _count?: {
    claims: number;
  };
  claims?: {
    userId: number;
    isCompleted: boolean;
  }[];
  isClaimed?: boolean;
  isOwner?: boolean;
  unreadCount?: number;
  claimInfo?: {
    claimedAt: string;
    isCompleted: boolean;
  };
}

export interface SpiritPostClaim {
  id: number;
  postId: number;
  userId: number;
  isCompleted: boolean;
  createdAt: string;
  post?: SpiritPost;
  user?: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
}

export interface SpiritPostMessage {
  id: number;
  postId: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
  receiver: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
}

export interface CreateSpiritPostDto {
  title: string;
  content: string;
}

export interface UpdateSpiritPostDto {
  title?: string;
  content?: string;
  isHidden?: boolean;
}

export interface CreateMessageDto {
  content: string;
}

export interface MarkCompletedDto {
  claimerIds: number[];
}

export interface MessagesResponse {
  isOwner: boolean;
  messages?: SpiritPostMessage[];
  conversations?: {
    user: {
      id: number;
      username: string;
      nickname: string;
      avatarUrl: string | null;
    };
    messages: SpiritPostMessage[];
    hasConversation: boolean;
  }[];
}

export const spiritPostsApi = {
  // 创建灵贴
  create: async (data: CreateSpiritPostDto): Promise<SpiritPost> => {
    const response = await apiClient.post('/spirit-posts', data);
    return response.data;
  },

  // 获取灵贴列表
  getAll: async (): Promise<SpiritPost[]> => {
    const response = await apiClient.get('/spirit-posts');
    return response.data;
  },

  // 获取我的灵贴
  getMyPosts: async (): Promise<SpiritPost[]> => {
    const response = await apiClient.get('/spirit-posts/my-posts');
    return response.data;
  },

  // 获取我认领的灵贴
  getMyClaimedPosts: async (): Promise<SpiritPost[]> => {
    const response = await apiClient.get('/spirit-posts/my-claims');
    return response.data;
  },

  // 获取灵贴详情
  getOne: async (id: number): Promise<SpiritPost> => {
    const response = await apiClient.get(`/spirit-posts/${id}`);
    return response.data;
  },

  // 更新灵贴
  update: async (id: number, data: UpdateSpiritPostDto): Promise<SpiritPost> => {
    const response = await apiClient.patch(`/spirit-posts/${id}`, data);
    return response.data;
  },

  // 认领灵贴
  claim: async (id: number): Promise<SpiritPostClaim> => {
    const response = await apiClient.post(`/spirit-posts/${id}/claim`);
    return response.data;
  },

  // 获取消息列表
  getMessages: async (id: number): Promise<MessagesResponse> => {
    const response = await apiClient.get(`/spirit-posts/${id}/messages`);
    return response.data;
  },

  // 发送消息
  sendMessage: async (id: number, data: CreateMessageDto): Promise<SpiritPostMessage> => {
    const response = await apiClient.post(`/spirit-posts/${id}/messages`, data);
    return response.data;
  },

  // 回复消息（发布者专用）
  replyMessage: async (id: number, receiverId: number, data: CreateMessageDto): Promise<SpiritPostMessage> => {
    const response = await apiClient.post(`/spirit-posts/${id}/messages/reply/${receiverId}`, data);
    return response.data;
  },

  // 标记已认领
  markCompleted: async (id: number, data: MarkCompletedDto): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/spirit-posts/${id}/mark-completed`, data);
    return response.data;
  },

  // 标记消息为已读
  markMessagesAsRead: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/spirit-posts/${id}/mark-read`);
    return response.data;
  },

  // 获取未读消息总数
  getUnreadMessageCount: async (): Promise<{ total: number; myPosts: number; myClaims: number }> => {
    const response = await apiClient.get('/spirit-posts/unread-count');
    return response.data;
  },
}; 