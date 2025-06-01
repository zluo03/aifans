import { Role } from '@/types/user';

/**
 * 检查用户是否可以访问灵感页面
 */
export function canAccessInspiration(userRole?: string): boolean {
  // 游客不能访问
  if (!userRole) {
    return false;
  }
  
  // 所有登录用户都可以访问
  return true;
}

/**
 * 检查用户是否可以上传作品
 */
export function canUploadPost(userRole?: string): boolean {
  if (!userRole) {
    return false;
  }
  
  // 管理员、终身会员、高级会员可以上传
  return ['ADMIN', 'LIFETIME', 'PREMIUM'].includes(userRole);
}

/**
 * 检查用户是否可以复制提示词
 */
export function canCopyPrompt(userRole?: string): boolean {
  if (!userRole) {
    return false;
  }
  
  // 管理员、终身会员、高级会员可以复制提示词
  return ['ADMIN', 'LIFETIME', 'PREMIUM'].includes(userRole);
}

/**
 * 检查用户是否可以下载作品
 * @param userRole 用户角色
 * @param allowDownload 作品是否允许下载
 * @returns 是否可以下载
 */
export function canDownloadPost(userRole?: string, allowDownload: boolean = false): boolean {
  if (!userRole) {
    return false;
  }
  
  // 管理员可以下载所有作品（即使作者未允许下载）
  if (userRole === 'ADMIN') {
    return true;
  }
  
  // 终身会员、高级会员可以下载（需要作者允许下载）
  if (['LIFETIME', 'PREMIUM'].includes(userRole)) {
    return allowDownload;
  }
  
  // 普通用户不能下载
  return false;
}

/**
 * 检查用户是否可以点赞和收藏
 */
export function canLikeAndFavorite(userRole?: string): boolean {
  if (!userRole) {
    return false;
  }
  
  // 所有登录用户都可以点赞和收藏
  return true;
}

/**
 * 检查用户是否可以查看作品详情
 */
export function canViewPostDetail(userRole?: string): boolean {
  if (!userRole) {
    return false;
  }
  
  // 所有登录用户都可以查看作品详情
  return true;
}

/**
 * 获取用户的会员等级显示名称
 */
export function getMembershipDisplayName(userRole?: string): string {
  switch (userRole) {
    case 'ADMIN':
      return '管理员';
    case 'LIFETIME':
      return '白金会员';
    case 'PREMIUM':
      return '黄金会员';
    case 'NORMAL':
      return '普通用户';
    default:
      return '游客';
  }
}

/**
 * 获取会员等级颜色
 */
export function getMembershipColor(userRole?: string): string {
  switch (userRole) {
    case 'ADMIN':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'LIFETIME':
      return 'text-gray-800 bg-gray-100 border-gray-300'; // 白金色
    case 'PREMIUM':
      return 'text-yellow-700 bg-yellow-50 border-yellow-300'; // 黄金色
    case 'NORMAL':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-500 bg-gray-50 border-gray-200';
  }
}

/**
 * 获取用户权限摘要
 */
export function getUserPermissions(userRole?: string) {
  return {
    canAccess: canAccessInspiration(userRole),
    canUpload: canUploadPost(userRole),
    canCopyPrompt: canCopyPrompt(userRole),
    canLikeAndFavorite: canLikeAndFavorite(userRole),
    canViewDetail: canViewPostDetail(userRole),
    membershipName: getMembershipDisplayName(userRole),
    membershipColor: getMembershipColor(userRole),
    isAdmin: userRole === 'ADMIN',
    isPremiumOrAbove: ['ADMIN', 'LIFETIME', 'PREMIUM'].includes(userRole || ''),
  };
} 