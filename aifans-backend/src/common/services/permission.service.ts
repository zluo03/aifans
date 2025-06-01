import { Injectable } from '@nestjs/common';
import { Role } from '../../types/prisma-enums';

@Injectable()
export class PermissionService {
  
  /**
   * 检查用户是否可以访问灵感页面
   */
  canAccessInspiration(userRole?: Role): boolean {
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
  canUploadPost(userRole?: Role): boolean {
    if (!userRole) {
      return false;
    }
    
    // 管理员、终身会员、高级会员可以上传
    return ['ADMIN', 'LIFETIME', 'PREMIUM'].includes(userRole);
  }

  /**
   * 检查用户是否可以复制提示词
   */
  canCopyPrompt(userRole?: Role): boolean {
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
  canDownloadPost(userRole?: Role, allowDownload: boolean = false): boolean {
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
  canLikeAndFavorite(userRole?: Role): boolean {
    if (!userRole) {
      return false;
    }
    
    // 所有登录用户都可以点赞和收藏
    return true;
  }

  /**
   * 检查用户是否可以查看作品详情
   */
  canViewPostDetail(userRole?: Role): boolean {
    if (!userRole) {
      return false;
    }
    
    // 所有登录用户都可以查看作品详情
    return true;
  }

  /**
   * 获取用户的会员等级显示名称
   */
  getMembershipDisplayName(userRole?: Role): string {
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
   * 获取用户权限摘要
   */
  getUserPermissions(userRole?: Role) {
    return {
      canAccess: this.canAccessInspiration(userRole),
      canUpload: this.canUploadPost(userRole),
      canCopyPrompt: this.canCopyPrompt(userRole),
      canLikeAndFavorite: this.canLikeAndFavorite(userRole),
      canViewDetail: this.canViewPostDetail(userRole),
      membershipName: this.getMembershipDisplayName(userRole),
      isAdmin: userRole === 'ADMIN',
      isPremiumOrAbove: ['ADMIN', 'LIFETIME', 'PREMIUM'].includes(userRole || ''),
    };
  }
} 