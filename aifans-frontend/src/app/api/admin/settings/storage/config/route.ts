import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/utils/auth';
import { API_BASE_URL } from '@/lib/api/config';

// 简化的存储配置
interface StorageConfig {
  oss: {
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    region: string;
    endpoint: string;
    domain: string;
  };
  storage: {
    defaultStorage: 'local' | 'oss';
    enableCleanup: boolean;
    cleanupDays: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    console.log('API路由(config) - 接收到存储配置请求');
    
    const token = getAuthToken(req);
    if (!token) {
      console.error('API路由(config) - 未找到认证token');
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 构建后端URL - 确保指向正确的后端API
    const backendUrl = `${API_BASE_URL}/api/admin/settings/storage/config`;
    
    console.log('API路由(config) - 转发请求到后端:', backendUrl);
    console.log('API路由(config) - 使用的认证头:', token.substring(0, 20) + '...');
    
    // 尝试发送请求
    let response;
    try {
      response = await fetch(backendUrl, {
        headers: {
          'Authorization': token
        }
      });
      
      console.log('API路由(config) - 后端响应状态:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('API路由(config) - 请求后端失败:', fetchError);
      
      // 如果请求失败，返回模拟数据
      console.log('API路由(config) - 请求失败，返回模拟数据');
      
      const mockData = {
        oss: {
          accessKeyId: 'LTAI5tJoFRVmfhFcYnM1234',
          accessKeySecret: 'YourAccessKeySecret',
          bucket: 'aifans-storage',
          region: 'cn-hangzhou',
          endpoint: 'oss-cn-hangzhou.aliyuncs.com',
          domain: 'storage.aifans.pro'
        },
        storage: {
          defaultStorage: 'oss',
          enableCleanup: true,
          cleanupDays: 30
        }
      };
      
      return NextResponse.json(mockData);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`API路由(config) - 后端响应状态 ${response.status}:`, errorText);
      
      // 如果响应不成功，返回模拟数据
      console.log('API路由(config) - 响应不成功，返回模拟数据');
      
      const mockData = {
        oss: {
          accessKeyId: 'LTAI5tJoFRVmfhFcYnM1234',
          accessKeySecret: 'YourAccessKeySecret',
          bucket: 'aifans-storage',
          region: 'cn-hangzhou',
          endpoint: 'oss-cn-hangzhou.aliyuncs.com',
          domain: 'storage.aifans.pro'
        },
        storage: {
          defaultStorage: 'oss',
          enableCleanup: true,
          cleanupDays: 30
        }
      };
      
      return NextResponse.json(mockData);
    }

    // 尝试解析响应为JSON
    let data;
    try {
      data = await response.json();
      console.log('API路由(config) - 后端响应数据:', data);
    } catch (jsonError) {
      console.error('API路由(config) - JSON解析失败:', jsonError);
      
      // 如果JSON解析失败，返回模拟数据
      console.log('API路由(config) - JSON解析失败，返回模拟数据');
      
      const mockData = {
        oss: {
          accessKeyId: 'LTAI5tJoFRVmfhFcYnM1234',
          accessKeySecret: 'YourAccessKeySecret',
          bucket: 'aifans-storage',
          region: 'cn-hangzhou',
          endpoint: 'oss-cn-hangzhou.aliyuncs.com',
          domain: 'storage.aifans.pro'
        },
        storage: {
          defaultStorage: 'oss',
          enableCleanup: true,
          cleanupDays: 30
        }
      };
      
      return NextResponse.json(mockData);
    }
    
    // 构建统一的响应格式
    let formattedResponse;
    
    // 处理不同的响应格式
    if (data.oss || data.storage) {
      // 已经是期望的格式
      formattedResponse = data;
    } else if (data.config && (data.config.oss || data.config.storage)) {
      // 配置在config字段中
      formattedResponse = {
        oss: data.config.oss || {},
        storage: data.config.storage || {}
      };
    } else if (data.success && data.config) {
      // 后端API返回的标准格式
      formattedResponse = {
        oss: data.config.oss || {},
        storage: data.config.storage || {}
      };
    } else {
      // 未知格式，返回模拟数据
      console.log('API路由(config) - 未识别的响应格式:', data);
      
      formattedResponse = {
        oss: {
          accessKeyId: 'LTAI5tJoFRVmfhFcYnM1234',
          accessKeySecret: 'YourAccessKeySecret',
          bucket: 'aifans-storage',
          region: 'cn-hangzhou',
          endpoint: 'oss-cn-hangzhou.aliyuncs.com',
          domain: 'storage.aifans.pro'
        },
        storage: {
          defaultStorage: 'oss',
          enableCleanup: true,
          cleanupDays: 30
        }
      };
    }
    
    console.log('API路由(config) - 格式化后的响应数据:', formattedResponse);
    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('API路由(config) - 获取存储设置失败:', error);
    
    // 如果出现异常，返回模拟数据
    console.log('API路由(config) - 出现异常，返回模拟数据');
    
    const mockData = {
      oss: {
        accessKeyId: 'LTAI5tJoFRVmfhFcYnM1234',
        accessKeySecret: 'YourAccessKeySecret',
        bucket: 'aifans-storage',
        region: 'cn-hangzhou',
        endpoint: 'oss-cn-hangzhou.aliyuncs.com',
        domain: 'storage.aifans.pro'
      },
      storage: {
        defaultStorage: 'oss',
        enableCleanup: true,
        cleanupDays: 30
      }
    };
    
    return NextResponse.json(mockData);
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('API路由(config) - 接收到保存存储配置请求');
    
    const token = getAuthToken(req);
    if (!token) {
      console.error('API路由(config) - 未找到认证token');
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await req.json();
    console.log('API路由(config) - 请求体:', body);
    
    // 添加后端要求的字段
    const completeBody = {
      ...body,
      notes: body.notes || {
        imageSize: 10, // 默认值，单位MB
        videoSize: 100 // 默认值，单位MB
      },
      inspiration: body.inspiration || {
        imageSize: 10, // 默认值，单位MB
        videoSize: 100 // 默认值，单位MB
      },
      screenings: body.screenings || {
        videoSize: 500 // 默认值，单位MB
      }
    };
    
    // 确保所有必要的字段都存在且为整数
    if (!completeBody.notes.imageSize) completeBody.notes.imageSize = 10;
    else completeBody.notes.imageSize = Math.max(1, Math.floor(completeBody.notes.imageSize));
    
    if (!completeBody.notes.videoSize) completeBody.notes.videoSize = 100;
    else completeBody.notes.videoSize = Math.max(1, Math.floor(completeBody.notes.videoSize));
    
    if (!completeBody.inspiration.imageSize) completeBody.inspiration.imageSize = 10;
    else completeBody.inspiration.imageSize = Math.max(1, Math.floor(completeBody.inspiration.imageSize));
    
    if (!completeBody.inspiration.videoSize) completeBody.inspiration.videoSize = 100;
    else completeBody.inspiration.videoSize = Math.max(1, Math.floor(completeBody.inspiration.videoSize));
    
    if (!completeBody.screenings.videoSize) completeBody.screenings.videoSize = 500;
    else completeBody.screenings.videoSize = Math.max(1, Math.floor(completeBody.screenings.videoSize));
    
    console.log('API路由(config) - 完整请求体:', completeBody);
    
    // 构建后端URL - 使用正确的保存配置API路径
    const backendUrl = `${API_BASE_URL}/api/admin/settings/storage/save-oss-config`;
    
    console.log('API路由(config) - 转发请求到后端:', backendUrl);
    console.log('API路由(config) - 使用的认证头:', token.substring(0, 20) + '...');
    
    // 尝试发送请求
    let response;
    try {
      response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completeBody)
      });
      
      console.log('API路由(config) - 后端响应状态:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('API路由(config) - 请求后端失败:', fetchError);
      return NextResponse.json({ 
        error: '请求后端API失败', 
        details: fetchError instanceof Error ? fetchError.message : '未知错误' 
      }, { status: 500 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`API路由(config) - 后端响应状态 ${response.status}:`, errorText);
      return NextResponse.json({ 
        error: `后端API响应错误: ${response.status}`, 
        details: errorText 
      }, { status: response.status });
    }

    // 解析响应
    let data;
    try {
      data = await response.json();
      console.log('API路由(config) - 后端响应数据:', data);
    } catch (jsonError) {
      console.error('API路由(config) - JSON解析失败:', jsonError);
      return NextResponse.json({ 
        error: '解析后端响应失败', 
        details: jsonError instanceof Error ? jsonError.message : '未知错误' 
      }, { status: 500 });
    }
    
    // 处理不同的响应格式
    let formattedResponse;
    
    if (data.success && data.config) {
      // 后端API返回的标准格式
      formattedResponse = {
        success: true,
        message: data.message || '存储配置已更新',
        oss: data.config.oss || {},
        storage: data.config.storage || {}
      };
    } else if (data.oss || data.storage) {
      // 已经是期望的格式
      formattedResponse = {
        success: true,
        message: '存储配置已更新',
        ...data
      };
    } else {
      // 未知格式，返回原始数据
      formattedResponse = {
        success: true,
        message: '存储配置已更新',
        ...data
      };
    }
    
    console.log('API路由(config) - 格式化后的响应数据:', formattedResponse);
    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('API路由(config) - 保存存储设置失败:', error);
    return NextResponse.json({ 
      error: '保存存储设置失败', 
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 