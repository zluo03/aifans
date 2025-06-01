const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function testAuthAndUpload() {
  try {
    console.log('=== 测试认证和文件上传 ===');
    
    // 1. 先测试登录获取有效token
    console.log('1. 测试登录...');
    
    // 首先获取验证码
    const captchaResponse = await fetch('http://localhost:3001/api/auth/captcha');
    if (!captchaResponse.ok) {
      throw new Error('获取验证码失败');
    }
    const captchaData = await captchaResponse.json();
    console.log('验证码ID:', captchaData.id);
    
    // 尝试登录 (使用默认管理员账号)
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: 'admin@aifans.pro',
        password: 'admin123', 
        captchaId: captchaData.id,
        captcha: 'SKIP' // 假设验证码（在测试环境中可能需要实际验证码）
      })
    });
    
    console.log('登录响应状态:', loginResponse.status);
    
    if (loginResponse.status === 400) {
      const loginError = await loginResponse.json();
      console.log('登录错误详情:', loginError);
      
      // 如果是验证码问题，尝试使用简单的测试方法
      console.log('尝试直接测试上传端点...');
      await testUploadDirectly();
      return;
    }
    
    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('登录成功，获取到token:', token ? 'YES' : 'NO');
    
    // 2. 使用真实token测试上传
    console.log('\n2. 测试文件上传...');
    await testUploadWithToken(token);
    
  } catch (error) {
    console.error('测试失败:', error);
    console.log('\n尝试备用测试方法...');
    await testUploadDirectly();
  }
}

async function testUploadWithToken(token) {
  try {
    // 创建测试文件
    const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync('test-upload.png', testImageContent);
    
    // 准备表单数据
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-upload.png'));
    formData.append('folder', 'notes/covers');
    
    console.log('发送上传请求...');
    
    const response = await fetch('http://localhost:3001/api/storage/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('上传响应状态:', response.status);
    console.log('上传响应头:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('上传响应内容:', responseText);
    
    // 清理测试文件
    fs.unlinkSync('test-upload.png');
    
  } catch (error) {
    console.error('上传测试失败:', error);
  }
}

async function testUploadDirectly() {
  console.log('直接测试上传端点（无认证）...');
  
  try {
    const response = await fetch('http://localhost:3001/api/storage/upload', {
      method: 'POST'
    });
    
    console.log('无认证上传响应状态:', response.status);
    const responseText = await response.text();
    console.log('无认证上传响应内容:', responseText);
    
  } catch (error) {
    console.error('直接测试失败:', error);
  }
}

testAuthAndUpload(); 