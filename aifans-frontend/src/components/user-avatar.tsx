'use client';

import { useAuthStore } from "@/lib/store/auth-store";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { LogIn, Settings, User } from 'lucide-react';
import { processImageUrl, ensureAvatarUrlConsistency, getProxyAvatarUrl, addTimestampToUrl } from '@/lib/utils/image-url';
import { getMembershipDisplayName } from '@/lib/utils/permission';
import { isUserMuted, UserStatus } from '@/lib/utils/permissions';
import { Avatar } from './avatar';

export function UserAvatar() {
  const { user, logout, isLoading } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);

  // 处理客户端挂载
  useEffect(() => {
    setMounted(true);
    
    // 监听认证状态变化事件
    const handleAuthStateChanged = () => {
      console.log('UserAvatar - 检测到认证状态变化');
    };
    
    window.addEventListener('auth-state-changed', handleAuthStateChanged);
    
    // 清理函数
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChanged);
    };
  }, []);

  // 处理点击外部关闭菜单
  useEffect(() => {
    if (!mounted) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        avatarRef.current && 
        !avatarRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mounted]);

  // 头像点击处理
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // 处理注销
  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  // 根据用户角色获取头像边框颜色
  const getAvatarBorderClass = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'ring-2 ring-cyan-400'; // 管理员：青色
      case 'LIFETIME':
        return 'ring-2 ring-pink-400'; // 永久用户：粉色（中间色）
      case 'PREMIUM':
        return 'ring-2 ring-yellow-400'; // 高级用户：金色
      default:
        return 'ring-2 ring-white/80'; // 普通用户：白色
    }
  };

  // 加载状态
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse" />
      </div>
    );
  }

  // 未登录状态
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link 
          href="/login" 
          className="inline-flex items-center justify-center h-9 px-4 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <LogIn className="w-4 h-4 mr-2" />
          登录
        </Link>
      </div>
    );
  }

  // 登录状态
  return (
    <div className="relative z-50">
      <div className="flex items-center gap-4" data-testid="user-avatar-container">
        {/* 用户头像下拉菜单 */}
        <div className="relative inline-block">
          <button
            ref={avatarRef}
            onClick={handleAvatarClick}
            className={`w-8 h-8 rounded-full overflow-hidden ${getAvatarBorderClass(user?.role || 'NORMAL')} hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-white/80`}
            title={user.nickname || user.username}
            data-testid="avatar-button"
            aria-label="用户菜单"
          >
            <Avatar 
              alt={user.nickname || user.username} 
              size="sm" 
              src={user.avatarUrl}
            />
          </button>

          {/* 下拉菜单 */}
          {showMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg py-1 border z-[9999]"
              data-testid="dropdown-menu"
            >
              <div className="px-4 py-3 border-b">
                <div className="font-semibold text-card-foreground">{user.nickname || user.username}</div>
                {user.email && <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>}
                <div className="text-xs text-muted-foreground mt-0.5">等级: {getMembershipDisplayName(user.role)}</div>
              </div>
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="block px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors w-full text-left"
                  onClick={() => setShowMenu(false)}
                >
                  管理后台
                </Link>
              )}
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors w-full text-left"
                onClick={() => setShowMenu(false)}
              >
                个人资料
              </Link>
              <Link
                href="/profile/settings"
                className="block px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors w-full text-left"
                onClick={() => setShowMenu(false)}
              >
                修改密码
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                注销
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 