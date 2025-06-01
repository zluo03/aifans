/**
 * 用户权限控制工具
 */

// 用户状态枚举 - 简化版本
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
}

// 用户角色枚举
export enum UserRole {
  NORMAL = 'NORMAL',
  PREMIUM = 'PREMIUM',
  LIFETIME = 'LIFETIME',
  ADMIN = 'ADMIN',
}

// 用户类型
export interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  premiumExpiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
  isWechatUser?: boolean;
  wechatOpenId?: string;
  wechatAvatar?: string;
  wechatNickname?: string;
}

/**
 * 检查用户是否被封禁
 */
export function isUserBanned(user: User | null): boolean {
  return user?.status === UserStatus.BANNED;
}

/**
 * 检查用户是否被禁言 - 已废弃，现在只有封禁状态
 */
export function isUserMuted(user: User | null): boolean {
  return false; // 简化：不再有禁言状态
}

/**
 * 检查用户是否可以登录
 */
export function canUserLogin(user: User | null): boolean {
  return !isUserBanned(user);
}

/**
 * 检查用户是否可以创建内容（作品、笔记、灵贴等）
 */
export function canUserCreateContent(user: User | null): boolean {
  if (!user) return false;
  return !isUserBanned(user); // 简化：只检查是否被封禁
}

/**
 * 检查用户是否可以上传作品
 */
export function canUserUploadPost(user: User | null): boolean {
  return canUserCreateContent(user);
}

/**
 * 检查用户是否可以创建笔记
 */
export function canUserCreateNote(user: User | null): boolean {
  return canUserCreateContent(user);
}

/**
 * 检查用户是否可以发布灵贴
 */
export function canUserCreateSpiritPost(user: User | null): boolean {
  return canUserCreateContent(user);
}

/**
 * 检查用户是否可以认领灵贴
 */
export function canUserClaimSpiritPost(user: User | null): boolean {
  return canUserCreateContent(user);
}

/**
 * 检查用户是否可以创建个人主页
 */
export function canUserCreateProfile(user: User | null): boolean {
  return canUserCreateContent(user);
}

/**
 * 检查用户是否可以编辑个人主页
 */
export function canUserEditProfile(user: User | null): boolean {
  return canUserCreateContent(user);
}

/**
 * 检查用户是否可以在影院发表弹幕
 */
export function canUserComment(user: User | null): boolean {
  return canUserCreateContent(user);
}

/**
 * 检查用户是否可以点赞
 */
export function canUserLike(user: User | null): boolean {
  if (!user) return false;
  return !isUserBanned(user); // 只有未被封禁的用户可以点赞
}

/**
 * 检查用户是否可以收藏
 */
export function canUserFavorite(user: User | null): boolean {
  if (!user) return false;
  return !isUserBanned(user); // 只有未被封禁的用户可以收藏
}

/**
 * 获取用户状态显示文本
 */
export function getUserStatusText(status: UserStatus): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return '正常';
    case UserStatus.BANNED:
      return '封禁';
    default:
      return '未知';
  }
}

/**
 * 获取权限被拒绝时的提示信息
 */
export function getPermissionDeniedMessage(user: User | null, action: string): string {
  if (!user) {
    return '请先登录';
  }
  
  if (isUserBanned(user)) {
    return '您的账号已被封禁，无法进行此操作';
  }
  
  return '权限不足';
} 