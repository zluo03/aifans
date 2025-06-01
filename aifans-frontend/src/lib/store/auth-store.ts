'use client';

import { create } from 'zustand';
import axios from 'axios';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptPassword } from '../utils/crypto';

// API基础URL
const baseUrl = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:3001') + '/api';

import { User } from '@/lib/utils/permissions';

// 检查是否在客户端
const isClient = typeof window !== 'undefined';

// 用户类型定义已移至 permissions.ts

// 认证状态
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // 操作
  login: (credentials: { login: string; password: string; captchaId: string; captcha: string }) => Promise<void>;
  register: (userData: { username: string; nickname: string; email: string; password: string; verificationCode: string }) => Promise<void>;
  logout: () => void;
  loadUserFromToken: (forceRefresh?: boolean) => Promise<void>;
  forceRefreshUserProfile: () => Promise<boolean>;
  clearError: () => void;
  initialize: () => Promise<void>;
  updateUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

// 创建一个空的存储对象作为服务器端的fallback
const serverStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// 创建认证状态存储
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      isInitialized: false,
      
      initialize: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // 只在客户端执行
          if (!isClient) {
            set({ isInitialized: true, isLoading: false });
            return;
          }
          
          // 从auth-storage获取token
          const authStorage = localStorage.getItem('auth-storage');
          if (!authStorage) {
            set({ isInitialized: true, isLoading: false });
            return;
          }

          const { state } = JSON.parse(authStorage);
          const token = state?.token;
          
          if (!token) {
            set({ isInitialized: true, isLoading: false });
            return;
          }

          // 确保token格式正确
          const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
          
          try {
            const response = await fetch('/api/auth/profile', {
              headers: {
                'Authorization': formattedToken,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const user = await response.json();
              set({ 
                user, 
                token: formattedToken, 
                isAuthenticated: true, 
                isInitialized: true, 
                error: null 
              });
              
              // 同步到localStorage
              if (isClient) {
                localStorage.setItem('token', formattedToken);
              }
            } else {
              // 认证失败，清除状态
              if (isClient) {
                localStorage.removeItem('token');
                localStorage.removeItem('auth-storage');
              }
              set({ 
                token: null, 
                user: null, 
                isAuthenticated: false, 
                isInitialized: true, 
                error: null 
              });
            }
          } catch (error) {
            console.error('初始化认证状态失败:', error);
            if (isClient) {
              localStorage.removeItem('token');
              localStorage.removeItem('auth-storage');
            }
            set({ 
              token: null, 
              user: null, 
              isAuthenticated: false, 
              isInitialized: true, 
              error: null 
            });
          }
        } catch (error) {
          console.error('初始化认证状态失败:', error);
          set({ isLoading: false });
        } finally {
          set({ isLoading: false });
        }
      },
      
      // 用户登录
      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          
          // 加密密码
          const encryptedCredentials = {
            login: credentials.login,
            password: encryptPassword(credentials.password),
            captchaId: credentials.captchaId,
            captcha: credentials.captcha
          };
          
          console.log('准备发送登录请求到Next.js API路由');
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(encryptedCredentials)
          });

          console.log('登录响应状态:', response.status, response.statusText);

          if (!response.ok) {
            let errorMessage = '登录失败，请检查用户名/邮箱和密码';
            try {
              const errorData = await response.json();
              if (errorData && errorData.message) {
                errorMessage = errorData.message;
              }
            } catch (parseError) {
              console.error('解析错误响应失败:', parseError);
            }
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          const { user, token } = data;
          
          if (!token || !user) {
            throw new Error('登录响应数据不完整');
          }
          
          // 设置API的认证头
          const authHeader = `Bearer ${token}`;
          axios.defaults.headers.common['Authorization'] = authHeader;
          
          console.log('登录成功，设置认证头:', {
            token: token.slice(0, 10) + '...',
            authHeader
          });
          
          // 存储用户和token
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false,
            error: null
          });
          
          // 登录成功后启动角色轮询
          if (typeof window !== 'undefined') {
            // 动态导入避免SSR问题
            import('@/lib/utils/role-polling').then(({ startRolePolling }) => {
              startRolePolling();
            });
          }
        } catch (error: any) {
          console.error('登录失败:', error);
          set({ 
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
            error: error.message || '登录失败，请检查用户名/邮箱和密码' 
          });
        }
      },
      
      // 用户注册
      register: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          
          // 加密密码
          const encryptedUserData = {
            ...userData,
            password: encryptPassword(userData.password)
          };
          
          console.log('发送注册请求:', {
            url: `${baseUrl}/auth/register`,
            userData: { ...encryptedUserData, password: '已加密', verificationCode: '***' }
          });
          
          const response = await axios.post(`${baseUrl}/auth/register`, encryptedUserData);
          const { user, token } = response.data;
          
          if (!token || !user) {
            throw new Error('注册响应数据不完整');
          }
          
          // 设置API的认证头
          const authHeader = `Bearer ${token}`;
          axios.defaults.headers.common['Authorization'] = authHeader;
          
          console.log('注册成功，设置认证头:', {
            token: token.slice(0, 10) + '...',
            authHeader
          });
          
          // 存储用户和token
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false,
            error: null
          });
          
          // 减少事件触发频率
          if (typeof window !== 'undefined') {
            // 使用防抖，避免频繁触发
            setTimeout(() => {
              window.dispatchEvent(new Event('auth-state-changed'));
            }, 100);
          }
        } catch (error: any) {
          console.error('注册失败:', error);
          set({ 
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
            error: error.response?.data?.message || '注册失败，请稍后再试' 
          });
        }
      },
      
      // 用户登出
      logout: () => {
        // 清除所有认证相关的存储
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
        
        // 清除认证头
        delete axios.defaults.headers.common['Authorization'];
        
        // 清除状态
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        
        // 触发登出事件
        window.dispatchEvent(new Event('auth-logout'));
      },
      
      // 从token加载用户
      loadUserFromToken: async (forceRefresh = false) => {
        const state = get();

        try {
          // 设置加载状态
          set({ isLoading: true });

          // 如果已经认证且有用户信息，且不是强制刷新，则跳过加载
          if (!forceRefresh && state.isAuthenticated && state.user && state.token) {
            // 确保设置了认证头
            axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
            set({ isLoading: false });
            return;
          }

          // 如果没有token，尝试从localStorage获取（仅在客户端）
          let currentToken = state.token;
          if (!currentToken && typeof window !== 'undefined') {
            const stored = localStorage.getItem('auth-storage');
            if (!stored) {
              set({ isLoading: false });
              return;
            }

            try {
              const { state: storedState } = JSON.parse(stored);
              if (!storedState?.token) {
                set({ isLoading: false });
                return;
              }

              currentToken = storedState.token;
              // 同时恢复用户信息和认证状态
              if (storedState.user && storedState.isAuthenticated) {
                set({ 
                  token: currentToken,
                  user: storedState.user,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null
                });
                axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
                return;
              }
            } catch (e) {
              console.error('解析存储的认证数据失败:', e);
              set({ isLoading: false });
              return;
            }
          }

          if (!currentToken) {
            set({ isLoading: false });
            return;
          }

          // 设置认证头
          const authHeader = `Bearer ${currentToken}`;
          axios.defaults.headers.common['Authorization'] = authHeader;
          
          // 获取用户资料
          const response = await axios.get(`${baseUrl}/auth/profile`, {
            headers: {
              Authorization: authHeader
            }
          });
          
          // 检查用户是否被封禁
          if (response.data.status === 'BANNED') {
            console.log('用户已被封禁，自动注销');
            get().logout();
            return;
          }

          // 更新状态
          set({ 
            token: currentToken,
            user: response.data, 
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          // 如果成功加载用户，启动角色轮询
          if (typeof window !== 'undefined' && response.data) {
            import('@/lib/utils/role-polling').then(({ startRolePolling }) => {
              startRolePolling();
            });
          }
          
        } catch (error: any) {
          console.error('加载用户资料失败:', error?.response?.data || error);
          
          // 只有在401错误且不是强制刷新时才清除状态
          // 避免在登录过程中因为竞态条件导致的误清除
          if (error?.response?.status === 401 && !forceRefresh) {
            console.log('Token无效，清除认证状态');
            get().logout();
          } else if (forceRefresh) {
            console.log('强制刷新失败，但保持当前认证状态');
          }
          
          // 确保在错误情况下也清除加载状态
          set({ isLoading: false });
        }
      },
      
      // 强制刷新用户资料
      forceRefreshUserProfile: async () => {
        try {
          // 获取当前状态
          const state = get();
          const token = state.token;
          
          if (!token) {
            console.error('无法刷新用户资料：没有token');
            return false;
          }
          
          console.log('准备发送用户资料刷新请求，使用token:', token.slice(0, 10) + '...');
          
          // 确保token格式正确
          const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
          
          // 发送请求获取最新用户信息
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': bearerToken,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            cache: 'no-store',
            credentials: 'include'
          });
          
          if (!response.ok) {
            console.error('获取用户资料失败，HTTP状态:', response.status);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // 解析用户数据
          const data = await response.json();
          console.log('获取到的用户资料:', data);
          
          // 检查头像URL格式
          // 只保留后端返回的原始 avatarUrl，不做任何拼接和修正
          // if (data.avatarUrl) {
          //   // 获取API基础URL
          //   const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          //   // 记录头像URL信息
          //   console.log('刷新用户资料 - 头像URL检查:', {
          //     原始URL: data.avatarUrl,
          //     是否以http开头: data.avatarUrl.startsWith('http'),
          //     是否包含uploads: data.avatarUrl.includes('/uploads/')
          //   });
          //   // 修正相对路径头像URL
          //   if (!data.avatarUrl.startsWith('http')) {
          //     if (data.avatarUrl.includes('/uploads/')) {
          //       data.avatarUrl = `${baseUrl}${data.avatarUrl.startsWith('/') ? '' : '/'}${data.avatarUrl}`;
          //     } else if (data.avatarUrl.includes('avatar/')) {
          //       data.avatarUrl = `${baseUrl}/uploads/${data.avatarUrl.startsWith('/') ? data.avatarUrl.substring(1) : data.avatarUrl}`;
          //     }
          //     console.log('修正后的头像URL:', data.avatarUrl);
          //   }
          // }
          
          // 检查微信头像URL格式
          if (data.wechatAvatar) {
            console.log('刷新用户资料 - 微信头像URL检查:', {
              原始URL: data.wechatAvatar,
              是否以http开头: data.wechatAvatar.startsWith('http')
            });
            
            // 确保微信头像URL以http开头
            if (!data.wechatAvatar.startsWith('http')) {
              if (data.wechatAvatar.startsWith('//')) {
                data.wechatAvatar = `https:${data.wechatAvatar}`;
              } else {
                data.wechatAvatar = `https://${data.wechatAvatar}`;
              }
              console.log('修正后的微信头像URL:', data.wechatAvatar);
            }
          }
          
          // 检查用户信息是否发生变化
          const currentUser = get().user;
          if (currentUser) {
            // 使用深度比较检查是否有变化
            const hasChanges = JSON.stringify(currentUser) !== JSON.stringify(data);
            console.log('用户信息是否有变化:', hasChanges);
            
            if (hasChanges) {
              console.log('检测到用户信息变化，更新状态');
              
              // 更新状态
              set((state) => ({ 
                ...state,
                user: data, 
                isAuthenticated: true,
                error: null
              }));
              
              // 触发事件通知其他组件
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth-state-changed', {
                  detail: { 
                    userId: data.id,
                    timestamp: Date.now()
                  }
                }));
              }
            } else {
              console.log('用户信息无变化，仍强制更新状态');
              // 即使没有检测到变化，也强制更新状态确保UI刷新
              const forceUpdatedUser = {
                ...data,
                _forceUpdate: Date.now() // 添加时间戳强制更新
              };
              
              set((state) => ({ 
                ...state,
                user: forceUpdatedUser, 
                isAuthenticated: true,
                error: null
              }));
              
              // 触发事件通知其他组件
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth-state-changed', {
                  detail: { 
                    userId: data.id,
                    timestamp: Date.now(),
                    forceUpdate: true
                  }
                }));
              }
            }
            
            // 手动更新本地存储，确保持久化
            try {
              if (typeof window !== 'undefined') {
                const persistState = {
                  user: data,
                  token,
                  isAuthenticated: true
                };
                
                // 更新本地存储
                localStorage.setItem('auth-storage', JSON.stringify({
                  state: persistState,
                  version: 0
                }));
                
                // 确保token也单独存储，使用正确的格式
                localStorage.setItem('token', token);
              }
            } catch (storageError) {
              console.error('更新本地存储失败:', storageError);
            }
          } else {
            // 当前没有用户信息，直接设置
            console.log('当前无用户信息，直接设置新用户信息');
            set({ 
              user: data, 
              token,
              isAuthenticated: true,
              error: null,
              isLoading: false
            });
          }
          
          // 允许短暂延迟，确保状态更新和传播
          await new Promise(resolve => setTimeout(resolve, 200));
          
          return true;
        } catch (error: any) {
          console.error('强制刷新用户资料失败:', error?.response?.data || error);
          return false;
        }
      },
      
      // 更新用户信息
      updateUser: (user: User) => {
        const token = localStorage.getItem('token');
        if (token) {
          // 设置API的认证头
          const authHeader = `Bearer ${token}`;
          axios.defaults.headers.common['Authorization'] = authHeader;
          
          // 更新状态
          set({ 
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          // 启动角色轮询
          if (typeof window !== 'undefined') {
            import('@/lib/utils/role-polling').then(({ startRolePolling }) => {
              startRolePolling();
            });
          }
        }
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => (isClient ? localStorage : serverStorage)),
      skipHydration: true,
    }
  )
);

// 监听认证状态变化
if (typeof window !== 'undefined') {
  // 监听登出事件
  window.addEventListener('auth-logout', () => {
    useAuthStore.getState().logout();
  });
  
  // 手动触发水合，因为我们移除了skipHydration
  useAuthStore.persist.rehydrate();
  
  // 移除storage监听，避免多标签页同步登录状态
  // window.addEventListener('storage', (e) => {
  //   if (e.key === 'auth-storage') {
  //     useAuthStore.getState().loadUserFromToken(true);
  //   }
  // });
} 