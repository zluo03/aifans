/**
 * 用户角色轮询检查
 * 用于跨浏览器检测角色变化
 */

import { useAuthStore } from '@/lib/store/auth-store';

class RolePolling {
  private intervalId: NodeJS.Timeout | null = null;
  private isPolling = false;
  private pollingInterval = 120000; // 2分钟检查一次，减少频率
  private lastCheckTime = 0;
  private consecutiveErrors = 0;
  private maxErrors = 3;

  /**
   * 开始轮询
   */
  start() {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    this.consecutiveErrors = 0;
    
    // 立即执行一次检查
    this.checkRoleChange();
    
    // 设置定时器
    this.intervalId = setInterval(() => {
      this.checkRoleChange();
    }, this.pollingInterval);
  }

  /**
   * 停止轮询
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPolling = false;
  }

  /**
   * 检查角色变化
   */
  private async checkRoleChange(): Promise<boolean> {
    try {
      // 获取当前token
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('[RolePolling] 没有找到token，停止角色检查');
        return false;
      }

      // 添加时间戳防止缓存
      const timestamp = Date.now();
      const url = `/api/auth/profile?nocache=${timestamp}`;
      
      // 使用fetch API而不是axios，以避免触发全局拦截器
      const response = await fetch(url, {
        headers: {
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // 如果返回401或403，不立即登出，而是记录错误并返回false
      if (response.status === 401 || response.status === 403) {
        console.log('[RolePolling] 用户认证失败，可能被封禁或token过期，停止轮询');
        // 不再自动触发登出，只停止轮询
        return false;
      }

      if (!response.ok) {
        console.error(`[RolePolling] HTTP错误! 状态: ${response.status}`);
        return false;
      }

      // 处理响应数据
      const user = await response.json();
      
      // 检查用户是否被封禁
      if (user.status === 'BANNED') {
        console.log('[RolePolling] 用户已被封禁，停止轮询并注销');
        this.stop();
        // 触发登出事件
        window.dispatchEvent(new Event('auth-logout'));
        return false;
      }
      
      // 检查角色是否发生变化
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        if (user.role !== currentUser.role) {
          // 触发角色更新事件
          window.dispatchEvent(new CustomEvent('user-role-updated', {
            detail: {
              userId: currentUser.id,
              role: user.role,
              timestamp: Date.now(),
              source: 'polling'
            }
          }));
          
          // 强制刷新用户资料
          await useAuthStore.getState().forceRefreshUserProfile();
          
          // 如果从非高级用户变为高级用户，显示祝贺消息
          if (
            (currentUser.role === 'NORMAL' && 
            (user.role === 'PREMIUM' || user.role === 'LIFETIME'))
          ) {
            window.dispatchEvent(new CustomEvent('premium-status-changed', {
              detail: { newStatus: 'upgraded' }
            }));
          }
        }
        
        // 检查状态是否发生变化
        if (user.status !== currentUser.status) {
          // 触发状态更新事件
          window.dispatchEvent(new CustomEvent('user-status-updated', {
            detail: {
              userId: currentUser.id,
              status: user.status,
              timestamp: Date.now(),
              source: 'polling'
            }
          }));
          
          // 如果用户被封禁，强制登出
          if (user.status === 'BANNED') {
            this.stop();
            window.dispatchEvent(new Event('auth-logout'));
          } else {
            // 其他状态变更，强制刷新用户资料
            await useAuthStore.getState().forceRefreshUserProfile();
          }
        }
      }

      // 重置错误计数
      this.consecutiveErrors = 0;

      return true;
    } catch (error) {
      this.consecutiveErrors++;
      console.error(`[RolePolling] 检查角色变化失败 (${this.consecutiveErrors}/${this.maxErrors}):`, error);
      
      // 如果连续错误过多，停止轮询
      if (this.consecutiveErrors >= this.maxErrors) {
        console.error('[RolePolling] 连续错误过多，停止轮询');
        this.stop();
      }
      return false;
    }
  }

  /**
   * 设置轮询间隔
   */
  setInterval(interval: number) {
    this.pollingInterval = interval;
    
    // 如果正在轮询，重新启动以应用新间隔
    if (this.isPolling) {
      this.stop();
      this.start();
    }
  }

  /**
   * 获取轮询状态
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      interval: this.pollingInterval,
      consecutiveErrors: this.consecutiveErrors,
      lastCheckTime: this.lastCheckTime
    };
  }
}

// 创建单例实例
let pollingInstance: RolePolling | null = null;

export function getRolePolling(): RolePolling {
  if (!pollingInstance && typeof window !== 'undefined') {
    pollingInstance = new RolePolling();
  }
  return pollingInstance!;
}

/**
 * 开始角色轮询
 */
export function startRolePolling() {
  const polling = getRolePolling();
  polling?.start();
}

/**
 * 停止角色轮询
 */
export function stopRolePolling() {
  const polling = getRolePolling();
  polling?.stop();
} 