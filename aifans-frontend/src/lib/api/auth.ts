import { api } from './api';
import { encryptPassword } from '../utils/crypto';

interface RegisterPayload {
  username: string;
  nickname: string;
  email: string;
  password: string;
  verificationCode: string;
}

interface LoginPayload {
  login: string;
  password: string;
  captchaId: string;
  captcha: string;
}

interface AuthResponse {
  user: any;
  token: string;
}

interface CaptchaResponse {
  captchaId: string;
  image: string;
}

export const authApi = {
  // 发送邮箱验证码
  sendVerificationCode: async (email: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/auth/send-verification-code', { email });
    return data;
  },

  // 获取图形验证码
  getCaptcha: async () => {
    const { data } = await api.get<CaptchaResponse>('/auth/captcha');
    return data;
  },

  // 用户注册
  register: async (payload: RegisterPayload): Promise<any> => {
    const { data } = await api.post('/auth/register', {
      ...payload,
      password: await encryptPassword(payload.password)
    });
    return data;
  },
  
  // 用户登录
  login: async (login: string, password: string, captchaId: string, captcha: string): Promise<any> => {
    const { data } = await api.post('/auth/login', {
      login,
      password: await encryptPassword(password),
      captchaId,
      captcha
    });
    return data;
  },
  
  // 获取当前用户信息
  getProfile: async (): Promise<any> => {
    const { data } = await api.get('/auth/profile');
    return data;
  },
  
  // 发送重置密码邮件
  forgotPassword: async (email: string): Promise<any> => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },
  
  // 重置密码
  resetPassword: async (token: string, password: string): Promise<any> => {
    const encryptedPassword = await encryptPassword(password);
    const { data } = await api.post(`/auth/reset-password`, { 
      token, 
      newPassword: encryptedPassword 
    });
    return data;
  },

  // 检查微信登录状态
  checkWechatLoginStatus: async (openId: string): Promise<{ isLoggedIn: boolean; token?: string; user?: any; error?: string }> => {
    const { data } = await api.get(`/auth/wechat/check-login-status?openId=${openId}`);
    return data;
  },

  // 获取微信登录二维码
  getWechatLoginQrCode: async (): Promise<{ qrCodeUrl: string; openId: string }> => {
    const { data } = await api.get('/auth/wechat/qrcode');
    return data;
  },
  
  // 模拟微信登录 (当微信扫码不工作时使用)
  simulateWechatLogin: async (openId: string): Promise<{ success: boolean; token?: string; user?: any; message: string }> => {
    const { data } = await api.get(`/auth/wechat/simulate-login?openId=${openId}`);
    return data;
  },

  // 获取微信登录URL
  getWechatLoginUrl: async () => {
    try {
      const response = await fetch('/api/auth/wechat/login-url', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`获取微信登录URL失败: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取微信登录URL错误:', error);
      throw error;
    }
  },

  /**
   * 验证微信验证码
   */
  verifyWechatCode: async (code: string): Promise<any> => {
    const { data } = await api.post('/auth/wechat/verify-code', { code });
    return data;
  }
}; 