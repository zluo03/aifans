/**
 * 跨标签页广播通道
 * 用于在不同标签页之间传递事件
 */

type BroadcastMessage = {
  type: 'user-role-updated' | 'user-status-updated' | 'auth-state-changed';
  detail: any;
  timestamp: number;
};

class CrossTabBroadcast {
  private channel: BroadcastChannel | null = null;
  private fallbackKey = 'cross-tab-broadcast';
  
  constructor() {
    // 检查是否支持 BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('auth-events');
        this.setupChannelListener();
      } catch (error) {
        console.warn('BroadcastChannel 初始化失败，使用 localStorage 作为后备方案');
        this.setupStorageFallback();
      }
    } else {
      this.setupStorageFallback();
    }
  }
  
  private setupChannelListener() {
    if (!this.channel) return;
    
    this.channel.onmessage = (event) => {
      const message = event.data as BroadcastMessage;
      
      // 在当前窗口触发相应的事件
      window.dispatchEvent(new CustomEvent(message.type, {
        detail: message.detail
      }));
    };
  }
  
  private setupStorageFallback() {
    // 使用 localStorage 事件作为后备方案
    window.addEventListener('storage', (event) => {
      if (event.key === this.fallbackKey && event.newValue) {
        try {
          const message = JSON.parse(event.newValue) as BroadcastMessage;
          
          // 在当前窗口触发相应的事件
          window.dispatchEvent(new CustomEvent(message.type, {
            detail: message.detail
          }));
          
          // 清理消息
          setTimeout(() => {
            localStorage.removeItem(this.fallbackKey);
          }, 100);
        } catch (error) {
          console.error('[CrossTabBroadcast] 解析消息失败:', error);
        }
      }
    });
  }
  
  /**
   * 广播消息到所有标签页
   */
  broadcast(type: BroadcastMessage['type'], detail: any) {
    const message: BroadcastMessage = {
      type,
      detail,
      timestamp: Date.now()
    };
    
    if (this.channel) {
      // 使用 BroadcastChannel
      this.channel.postMessage(message);
    } else {
      // 使用 localStorage 作为后备
      localStorage.setItem(this.fallbackKey, JSON.stringify(message));
      
      // 触发 storage 事件
      window.dispatchEvent(new StorageEvent('storage', {
        key: this.fallbackKey,
        newValue: JSON.stringify(message),
        url: window.location.href
      }));
    }
    
    // 同时在当前窗口也触发事件
    window.dispatchEvent(new CustomEvent(type, { detail }));
  }
  
  /**
   * 关闭广播通道
   */
  close() {
    if (this.channel) {
      this.channel.close();
    }
  }
}

// 创建单例实例
let broadcastInstance: CrossTabBroadcast | null = null;

export function getCrossTabBroadcast(): CrossTabBroadcast {
  if (!broadcastInstance && typeof window !== 'undefined') {
    broadcastInstance = new CrossTabBroadcast();
  }
  return broadcastInstance!;
}

/**
 * 广播用户角色更新事件
 */
export function broadcastUserRoleUpdate(userId: number, role: string) {
  const broadcast = getCrossTabBroadcast();
  broadcast?.broadcast('user-role-updated', { userId, role, timestamp: Date.now() });
}

/**
 * 广播用户状态更新事件
 */
export function broadcastUserStatusUpdate(userId: number, status: string) {
  const broadcast = getCrossTabBroadcast();
  broadcast?.broadcast('user-status-updated', { userId, status, timestamp: Date.now() });
}

/**
 * 广播认证状态变化事件
 */
export function broadcastAuthStateChange(detail?: any) {
  const broadcast = getCrossTabBroadcast();
  broadcast?.broadcast('auth-state-changed', { ...detail, timestamp: Date.now() });
} 