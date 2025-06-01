'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import {
  canUserCreateContent,
  canUserUploadPost,
  canUserCreateNote,
  canUserCreateSpiritPost,
  canUserClaimSpiritPost,
  canUserCreateProfile,
  canUserEditProfile,
  canUserComment,
  canUserLike,
  canUserFavorite,
  isUserBanned,
  isUserMuted, // 保留函数但已简化
  getPermissionDeniedMessage,
  User
} from '@/lib/utils/permissions';

/**
 * 权限检查Hook
 */
export function usePermissions() {
  const { user } = useAuthStore();
  
  return {
    // 用户状态检查
    isUserBanned: () => isUserBanned(user as User),
    isUserMuted: () => isUserMuted(user as User),
    
    // 权限检查
    canCreateContent: () => canUserCreateContent(user as User),
    canUploadPost: () => canUserUploadPost(user as User),
    canCreateNote: () => canUserCreateNote(user as User),
    canCreateSpiritPost: () => canUserCreateSpiritPost(user as User),
    canClaimSpiritPost: () => canUserClaimSpiritPost(user as User),
    canCreateProfile: () => canUserCreateProfile(user as User),
    canEditProfile: () => canUserEditProfile(user as User),
    canComment: () => canUserComment(user as User),
    canLike: () => canUserLike(user as User),
    canFavorite: () => canUserFavorite(user as User),
    
    // 获取权限被拒绝的提示信息
    getPermissionDeniedMessage: (action: string) => getPermissionDeniedMessage(user as User, action),
    
    // 当前用户
    user: user as User
  };
} 