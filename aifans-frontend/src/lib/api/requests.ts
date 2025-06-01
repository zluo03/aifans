import { api } from './api';
import { Request, RequestCategory, RequestPriority, RequestResponse, RequestStatus, ResponseStatus } from '@/types';

// 需求分页响应接口
export interface RequestPaginationResponse {
  requests: Request[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 响应分页响应接口
export interface ResponsePaginationResponse {
  responses: RequestResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 创建需求参数
export interface CreateRequestPayload {
  title: string;
  content: string;
  categoryId: number;
  priority?: RequestPriority;
  budget?: number;
}

// 更新需求参数
export interface UpdateRequestPayload {
  title?: string;
  content?: string;
  categoryId?: number;
  priority?: RequestPriority;
  status?: RequestStatus;
  budget?: number;
}

// 创建响应参数
export interface CreateResponsePayload {
  content: string;
  price?: number;
  isPublic?: boolean;
}

export const requestsApi = {
  // 获取需求列表
  getRequests: async (
    page: number = 1,
    limit: number = 10,
    categoryId?: number,
    status?: RequestStatus,
    priority?: RequestPriority,
    search?: string,
  ): Promise<RequestPaginationResponse> => {
    const { data } = await api.get('/requests', {
      params: {
        page,
        limit,
        categoryId,
        status,
        priority,
        search,
      },
    });
    return data;
  },

  // 获取单个需求详情
  getRequest: async (id: number): Promise<Request> => {
    const { data } = await api.get(`/requests/${id}`);
    return data;
  },

  // 创建需求
  createRequest: async (payload: CreateRequestPayload): Promise<Request> => {
    const { data } = await api.post('/requests', payload);
    return data;
  },

  // 更新需求
  updateRequest: async (id: number, payload: UpdateRequestPayload): Promise<Request> => {
    const { data } = await api.patch(`/requests/${id}`, payload);
    return data;
  },

  // 删除需求
  deleteRequest: async (id: number): Promise<void> => {
    await api.delete(`/requests/${id}`);
  },

  // 获取我的需求列表
  getMyRequests: async (page: number = 1, limit: number = 10): Promise<RequestPaginationResponse> => {
    const { data } = await api.get('/requests/user/my', { params: { page, limit } });
    return data;
  },

  // 点赞/取消点赞需求
  toggleLike: async (id: number): Promise<{ liked: boolean }> => {
    const { data } = await api.post(`/requests/${id}/like`);
    return data;
  },

  // 收藏/取消收藏需求
  toggleFavorite: async (id: number): Promise<{ favorited: boolean }> => {
    const { data } = await api.post(`/requests/${id}/favorite`);
    return data;
  },

  // 回复需求
  createResponse: async (requestId: number, payload: CreateResponsePayload): Promise<RequestResponse> => {
    const { data } = await api.post(`/requests/${requestId}/responses`, payload);
    return data;
  },

  // 获取响应详情
  getResponse: async (id: number): Promise<RequestResponse> => {
    const { data } = await api.get(`/requests/responses/${id}`);
    return data;
  },

  // 更新响应状态
  updateResponseStatus: async (id: number, status: ResponseStatus): Promise<RequestResponse> => {
    const { data } = await api.patch(`/requests/responses/${id}/status`, { status });
    return data;
  },

  // 获取我的响应列表
  getMyResponses: async (page: number = 1, limit: number = 10): Promise<ResponsePaginationResponse> => {
    const { data } = await api.get('/requests/user/my-responses', { params: { page, limit } });
    return data;
  },
};

// 获取需求分类API
export const requestCategoriesApi = {
  // 获取所有需求分类
  getAllCategories: async (): Promise<RequestCategory[]> => {
    const { data } = await api.get('/request-categories');
    return data;
  },

  // 获取单个需求分类
  getCategory: async (id: number): Promise<RequestCategory> => {
    const { data } = await api.get(`/request-categories/${id}`);
    return data;
  },
}; 