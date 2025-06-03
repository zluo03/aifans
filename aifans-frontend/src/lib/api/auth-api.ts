import { baseUrl } from '../utils/api-helpers';

// 登录API
export async function login(credentials: { 
  login: string; 
  password: string; 
  captchaId: string; 
  captcha: string;
}) {
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '登录失败');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// 注册API
export async function register(userData: {
  username: string;
  email: string;
  password: string;
  verificationCode: string;
}) {
  try {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '注册失败');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// 获取验证码
export async function getCaptcha() {
  try {
    const response = await fetch(`${baseUrl}/api/auth/captcha`);
    
    if (!response.ok) {
      throw new Error('获取验证码失败');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// 发送邮箱验证码
export async function sendVerificationCode(email: string) {
  try {
    const response = await fetch(`${baseUrl}/api/auth/send-verification-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '发送验证码失败');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// 忘记密码
export async function forgotPassword(email: string) {
  try {
    const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '请求密码重置失败');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// 重置密码
export async function resetPassword(token: string, newPassword: string) {
  try {
    const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '重置密码失败');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// 微信验证码登录
export async function verifyWechatCode(code: string) {
  try {
    const response = await fetch(`${baseUrl}/api/auth/wechat/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '验证码验证失败');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// 获取用户资料
export async function getProfile(token: string) {
  try {
    const response = await fetch(`${baseUrl}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取用户资料失败');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
} 