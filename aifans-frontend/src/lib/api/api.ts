import axios from 'axios';

// 基础URL配置
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://aifans.pro';

// 创建 axios 实例
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从auth-storage中获取token
    try {
      if (typeof window !== 'undefined') {
        const authStorage = localStorage.getItem('auth-storage');
        
        if (authStorage) {
          try {
            const authData = JSON.parse(authStorage);
            const token = authData?.state?.token;
            
            if (token) {
              // 确保token格式正确
              const finalToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
              config.headers.Authorization = finalToken;
            }
          } catch (parseError) {
            // 解析失败时不设置token
          }
        } else {
          // 尝试从cookie中获取
          const cookies = document.cookie.split(';');
          const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
          if (tokenCookie) {
            const token = tokenCookie.split('=')[1].trim();
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      }
    } catch (error) {
      // 处理认证失败
    }
    
    // 确保所有请求都以 /api 开头
    if (config.url && !config.url.startsWith('/api/') && !config.url.startsWith('http')) {
      config.url = `/api/${config.url.startsWith('/') ? config.url.substring(1) : config.url}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 触发自定义事件，由auth-provider处理认证失败
      if (typeof window !== 'undefined') {
        // 创建自定义事件，带上错误信息
        const authErrorEvent = new CustomEvent('auth-error', {
          detail: {
            status: error.response.status,
            message: error.response.data?.message || '认证失败',
            timestamp: Date.now()
          }
        });
        
        // 分发事件
        window.dispatchEvent(authErrorEvent);
      }
    }
    return Promise.reject(error);
  }
);

export default api;