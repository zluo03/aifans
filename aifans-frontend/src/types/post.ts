import { User } from './user';
import { AIPlatform } from './ai-platform';

export interface Post {
  id: number;
  title: string;
  content: string;
  fileUrl: string;
  thumbnailUrl?: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'TEXT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  userId: number;
  user?: User;
  aiPlatformId?: number;
  aiPlatform?: AIPlatform;
  likesCount: number;
  commentsCount: number;
  favoritesCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
  tags?: string[];
  prompt?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  metadata?: any;
}

export interface PostComment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  postId: number;
  user?: User;
  likesCount: number;
  isLiked?: boolean;
}

export interface PostLike {
  id: number;
  createdAt: string;
  userId: number;
  postId: number;
  user?: User;
}

export interface PostFavorite {
  id: number;
  createdAt: string;
  userId: number;
  postId: number;
  user?: User;
} 