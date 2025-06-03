const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// 测试配置
const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/storage/upload`;
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.png');
let TOKEN = ''; // 将由登录获取

// 创建测试图片
function createTestImage() {
  console.log('创建测试图片...');
  // 创建一个简单的1x1像素的PNG图片
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(TEST_IMAGE_PATH, buffer);
  console.log(`测试图片已创建: ${TEST_IMAGE_PATH}`);
  return TEST_IMAGE_PATH;
}

// 登录获取令牌
async function login(email, password) {
  try {
    console.log(`尝试登录账号: ${email}...`);
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('登录响应状态码:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('登录失败:', data);
      throw new Error('登录失败');
    }
    
    console.log('登录成功!');
    TOKEN = data.token || data.access_token;
    console.log('获取到令牌:', TOKEN.substring(0, 15) + '...');
    
    return TOKEN;
  } catch (error) {
    console.error('登录过程中发生错误:', error);
    throw error;
  }
}

// 测试上传功能
async function testUpload() {
  try {
    // 确保测试图片存在
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      createTestImage();
    }

    console.log('准备上传测试图片...');
    
    // 创建FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_IMAGE_PATH));
    formData.append('folder', 'resources/covers');

    console.log('发送请求到:', API_URL);
    console.log('请求头:', {
      'Authorization': TOKEN ? `Bearer ${TOKEN}` : '未提供',
      ...formData.getHeaders()
    });

    // 发送请求
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}),
      },
    });

    console.log('响应状态码:', response.status);
    console.log('响应头:', response.headers.raw());

    // 获取响应内容
    const contentType = response.headers.get('content-type');
    console.log('响应内容类型:', contentType);

    let responseData;
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (response.ok) {
      console.log('上传成功!');
      console.log('响应数据:', JSON.stringify(responseData, null, 2));
    } else {
      console.error('上传失败!');
      console.error('错误详情:', JSON.stringify(responseData, null, 2));
    }

    return responseData;
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    throw error;
  }
}

// 运行测试
async function runTest() {
  try {
    // 在这里输入有效的账号密码
    const email = 'admin@example.com'; // 替换为有效的邮箱
    const password = 'password';        // 替换为有效的密码
    
    await login(email, password);
    await testUpload();
    
    console.log('测试完成');
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    // 可选：清理测试图片
    // if (fs.existsSync(TEST_IMAGE_PATH)) {
    //   fs.unlinkSync(TEST_IMAGE_PATH);
    //   console.log('测试图片已删除');
    // }
  }
}

// 执行测试
runTest(); 