// API配置
const getApiBaseUrl = () => {
  // 获取环境变量
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  console.log('API配置 - 环境变量NEXT_PUBLIC_API_URL:', envUrl);
  
  // 如果环境变量存在，使用环境变量
  if (envUrl) {
    console.log('API配置 - 使用环境变量中的API URL');
    return envUrl;
  }
  
  // 默认使用本地开发环境URL
  const defaultUrl = 'http://localhost:3001';
  console.log('API配置 - 使用默认后端URL:', defaultUrl);
  return defaultUrl;
};

export const API_BASE_URL = getApiBaseUrl(); 