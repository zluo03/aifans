export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  CREATOR = 'CREATOR'
}

export interface User {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  role: Role | 'USER' | 'ADMIN' | 'CREATOR';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  createdAt?: string;
  updatedAt?: string;
  isVerified?: boolean;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  notesCount?: number;
  isFollowing?: boolean;
  isFollower?: boolean;
  membershipLevel?: string;
  membershipExpireDate?: string;
} 