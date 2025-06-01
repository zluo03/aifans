import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { BASE_URL } from "@/lib/api/api";

export async function GET(req: NextRequest) {
  try {
    // 检查BASE_URL配置
    const apiUrlInfo = {
      baseUrl: BASE_URL,
      environmentVar: process.env.NEXT_PUBLIC_API_URL,
      frontendApiUrl: `${req.nextUrl.origin}/api`,
    };
    
    // 构建测试URL
    const testUrl = `${BASE_URL}/posts`;
    const testLikeUrl = `${BASE_URL}/posts/1/like`;
    
    // 测试连接
    let connectionStatus = "未测试";
    let testError = null;
    let testLikeStatus = null;
    let testLikeError = null;
    
    try {
      // 只测试连接，不实际获取数据
      const response = await axios.head(testUrl, { timeout: 3000 });
      connectionStatus = `连接成功 (${response.status})`;
    } catch (error: any) {
      connectionStatus = `连接失败`;
      testError = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
        } : null
      };
    }
    
    // 测试点赞接口
    try {
      // 只测试接口存在性，不实际点赞
      const response = await axios.options(testLikeUrl, { timeout: 3000 });
      testLikeStatus = `点赞接口存在 (${response.status})`;
    } catch (error: any) {
      // 如果是404错误，可能是OPTIONS不支持
      if (error.response?.status === 404) {
        testLikeStatus = `点赞接口返回404 - 请检查后端实现`;
      } else {
        testLikeStatus = `点赞接口测试失败`;
      }
      
      testLikeError = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
        } : null
      };
    }
    
    return NextResponse.json({
      apiConfiguration: apiUrlInfo,
      tests: {
        postsApi: {
          url: testUrl,
          status: connectionStatus,
          error: testError
        },
        likeApi: {
          url: testLikeUrl,
          status: testLikeStatus,
          error: testLikeError
        }
      },
      debug: {
        apiPrefixDoubled: BASE_URL.includes('/api') && testUrl.includes('/api/api'),
        hasApiPrefix: BASE_URL.includes('/api'),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "API URL检查失败",
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 