// 简单的登录测试脚本
const axios = require('axios');

async function testLogin() {
  try {
    console.log('开始测试登录...');
    
    const loginData = {
      login: 'admin',
      password: 'admin888'
    };
    
    console.log('发送登录数据:', JSON.stringify(loginData));
    
    const response = await axios.post('http://localhost:3001/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('登录成功!');
    console.log('用户信息:', response.data.user);
    console.log('Token:', response.data.token);
    
    return response.data;
  } catch (error) {
    console.error('登录失败!');
    
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误信息:', error.response.data);
    } else if (error.request) {
      console.log('无响应:', error.request);
    } else {
      console.log('错误:', error.message);
    }
    
    console.log('错误详情:', error);
  }
}

testLogin(); 