const axios = require('axios');

async function testLogin() {
  try {
    console.log('测试登录功能...');
    
    const response = await axios.post('http://localhost:3000/auth/login', {
      login: 'admin',
      password: 'admin888'
    });
    
    console.log('登录成功!');
    console.log('Token:', response.data.token);
    console.log('用户信息:', JSON.stringify(response.data.user, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('登录失败!');
    if (error.response) {
      // 服务器返回了错误响应
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('没有收到响应，可能是服务器没有运行或网络问题');
    } else {
      // 设置请求时出错
      console.error('请求错误:', error.message);
    }
    throw error;
  }
}

testLogin()
  .then(data => {
    console.log('测试完成');
  })
  .catch(err => {
    console.log('测试失败');
  }); 