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
          const authData = JSON.parse(authStorage);
          const token = authData?.state?.token;
          
          if (token) {
            config.headers.Authorization = token;
          }
        }
      }
    } catch (error) {
      console.error('处理认证token失败:', error);
    }
    
    // 确保所有请求都以 /api 开头
    if (config.url && !config.url.startsWith('/api/') && !config.url.startsWith('http')) {
      config.url = `/api/${config.url.startsWith('/') ? config.url.substring(1) : config.url}`;
    }
    
    return config;
  },
  (error) => {
    console.error('API请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除本地存储的认证信息
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        // 可以选择重定向到登录页面
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;