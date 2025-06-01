export * from './user';
export * from './note';
export * from './request';

// 放映模块类型
export interface Screening {
  id: number;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  description?: string;
  likesCount: number;
  viewsCount: number;
  createdAt: string;
  adminUploader: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
  isLiked?: boolean;
}

export enum NoteStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN_BY_ADMIN = 'HIDDEN_BY_ADMIN',
  ADMIN_DELETED = 'ADMIN_DELETED',
}

export enum EntityType {
  POST = 'POST',
  NOTE = 'NOTE',
  SCREENING = 'SCREENING',
  REQUEST = 'REQUEST',
} 