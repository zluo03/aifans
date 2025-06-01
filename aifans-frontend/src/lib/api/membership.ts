import { api } from './api';

// 会员查询参数
export interface MembershipQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

// 会员信息
export interface Member {
  id: number;
  username: string;
  nickname: string;
  email: string;
  role: string;
  status: string;
  premiumExpiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// 会员产品
export interface MembershipProduct {
  id: number;
  title: string;
  description: string | null;
  price: number;
  durationDays: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

// 兑换码
export interface RedemptionCode {
  id: number;
  code: string;
  durationDays: number;
  isUsed: boolean;
  usedAt: string | null;
  usedByUser: {
    id: number;
    nickname: string;
  } | null;
  createdAt: string;
}

// 支付设置
export interface PaymentSettings {
  alipayAppId: string;
  alipayPrivateKey: string;
  alipayPublicKey: string;
  alipayGatewayUrl: string;
  isSandbox: boolean;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 创建会员产品DTO
export interface CreateMembershipProductDto {
  title: string;
  description?: string;
  price: number;
  durationDays: number;
  type: string;
}

// 创建兑换码DTO
export interface CreateRedemptionCodeDto {
  durationDays: number;
}

// 兑换码DTO
export interface RedeemCodeDto {
  code: string;
}

// 会员管理API
export const membershipApi = {
  // 管理员API
  admin: {
    // 获取会员列表
    getMembers: async (query: MembershipQueryDto): Promise<PaginatedResponse<Member>> => {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);
      if (query.role) params.append('role', query.role);

      const response = await api.get(`/admin/membership/members?${params}`);
      return response.data;
    },

    // 获取会员产品列表
    getProducts: async (): Promise<MembershipProduct[]> => {
      const response = await api.get('/admin/membership/products');
      return response.data;
    },

    // 创建会员产品
    createProduct: async (data: CreateMembershipProductDto): Promise<MembershipProduct> => {
      const response = await api.post('/admin/membership/products', data);
      return response.data;
    },

    // 更新会员产品
    updateProduct: async (id: number, data: Partial<CreateMembershipProductDto>): Promise<MembershipProduct> => {
      const response = await api.patch(`/admin/membership/products/${id}`, data);
      return response.data;
    },

    // 删除会员产品
    deleteProduct: async (id: number): Promise<void> => {
      await api.delete(`/admin/membership/products/${id}`);
    },

    // 获取兑换码列表
    getRedemptionCodes: async (query: MembershipQueryDto): Promise<PaginatedResponse<RedemptionCode>> => {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);

      const response = await api.get(`/admin/membership/redemption-codes?${params}`);
      return response.data;
    },

    // 创建兑换码
    createRedemptionCode: async (data: CreateRedemptionCodeDto): Promise<RedemptionCode> => {
      const response = await api.post('/admin/membership/redemption-codes', data);
      return response.data;
    },

    // 获取订单列表
    getOrders: async (query: MembershipQueryDto): Promise<PaginatedResponse<any>> => {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);

      const response = await api.get(`/admin/membership/orders?${params}`);
      return response.data;
    },

    // 获取支付设置
    getPaymentSettings: async (): Promise<PaymentSettings> => {
      const response = await api.get('/admin/membership/payment-settings');
      return response.data;
    },

    // 更新支付设置
    updatePaymentSettings: async (data: PaymentSettings): Promise<PaymentSettings> => {
      const response = await api.put('/admin/membership/payment-settings', data);
      return response.data;
    },

    // 测试支付设置
    testPaymentSettings: async (): Promise<{ success: boolean; message: string }> => {
      const response = await api.post('/admin/membership/payment-settings/test');
      return response.data;
    },
  },

  // 用户API
  user: {
    // 获取会员产品列表
    getProducts: async (): Promise<MembershipProduct[]> => {
      const response = await api.get('/membership/products');
      return response.data;
    },

    // 兑换码兑换
    redeemCode: async (data: RedeemCodeDto): Promise<{ success: boolean; message: string }> => {
      const response = await api.post('/membership/redeem', data);
      return response.data;
    },
  },
}; 