import { User } from './user';

export enum NoteStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN_BY_ADMIN = 'HIDDEN_BY_ADMIN',
  ADMIN_DELETED = 'ADMIN_DELETED',
}

export interface NoteCategory {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: number;
  userId: number;
  title: string;
  content: any; // JSON 内容
  coverImageUrl?: string;
  categoryId: number;
  likesCount: number;
  favoritesCount: number;
  viewsCount: number;
  status: NoteStatus;
  createdAt: string;
  updatedAt: string;
  user: User;
  category: NoteCategory;
  isLiked?: boolean;
  isFavorited?: boolean;
}

export interface NotePaginationResponse {
  notes: Note[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
} 