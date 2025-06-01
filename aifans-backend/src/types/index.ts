// Prisma枚举类型定义
export enum EntityType {
  POST = 'POST',
  NOTE = 'NOTE',
  SCREENING = 'SCREENING',
}

export enum NoteStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN_BY_ADMIN = 'HIDDEN_BY_ADMIN',
  ADMIN_DELETED = 'ADMIN_DELETED',
}

export enum AIPlatformType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum Role {
  NORMAL = 'NORMAL',
  PREMIUM = 'PREMIUM',
  LIFETIME = 'LIFETIME',
  ADMIN = 'ADMIN',
}

// 用户接口定义
export interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  avatarUrl?: string;
  premiumExpiryDate?: Date;
} 