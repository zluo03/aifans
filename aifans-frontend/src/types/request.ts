// 需求状态枚举
export enum RequestStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLVED = 'SOLVED',
  CLOSED = 'CLOSED',
  HIDDEN = 'HIDDEN',
}

// 需求优先级枚举
export enum RequestPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// 需求响应状态枚举
export enum ResponseStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

// 需求分类类型
export interface RequestCategory {
  id: number;
  name: string;
}

// 需求类型
export interface Request {
  id: number;
  title: string;
  content: string;
  categoryId: number;
  priority: RequestPriority;
  budget?: number;
  status: RequestStatus;
  likesCount: number;
  favoritesCount: number;
  viewsCount: number;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
  category: RequestCategory;
  isLiked?: boolean;
  isFavorited?: boolean;
  responses?: RequestResponse[];
  _count?: {
    responses: number;
  };
}

// 需求响应类型
export interface RequestResponse {
  id: number;
  requestId: number;
  content: string;
  price?: number;
  status: ResponseStatus;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
  request?: {
    id: number;
    title: string;
    status: RequestStatus;
    user: {
      id: number;
      nickname: string;
      avatarUrl: string | null;
    };
  };
} 