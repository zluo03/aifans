/**
 * 测试头像文件可访问性
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// 头像目录
const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatar');

// 测试URL前缀
const URL_PREFIXES = [
  'http://localhost:3001/uploads/avatar/',
  'http://dev.aifans.pro/uploads/avatar/'
];

/**
 * 测试文件可访问性
 */
async function testFilesAccess() {
  console.log('=== 测试头像文件可访问性 ===');
  
  if (!fs.existsSync(AVATAR_DIR)) {
    console.error('头像目录不存在');
    return;
  }
  
  try {
    // 读取所有头像文件
    const files = fs.readdirSync(AVATAR_DIR);
    console.log(`共有${files.length}个头像文件需要测试`);
    
    // 测试前5个文件
    const testFiles = files.slice(0, 5);
    
    for (const prefix of URL_PREFIXES) {
      console.log(`\n测试URL前缀: ${prefix}`);
      
      for (const file of testFiles) {
        const url = `${prefix}${file}`;
        
        try {
          console.log(`测试URL: ${url}`);
          const result = await testUrl(url);
          
          if (result.success) {
            console.log(`✅ 访问成功 - 状态码: ${result.statusCode}, 内容类型: ${result.contentType}`);
          } else {
            console.log(`❌ 访问失败 - ${result.error}`);
          }
        } catch (error) {
          console.error(`请求失败: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.error('测试头像文件可访问性失败:', error.message);
  }
}

/**
 * 测试URL是否可访问
 */
function testUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'];
      
      let error;
      if (statusCode !== 200) {
        error = `状态码: ${statusCode}`;
      }
      
      if (error) {
        resolve({ success: false, error });
        return;
      }
      
      resolve({ 
        success: true, 
        statusCode, 
        contentType 
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    // 设置5秒超时
    req.setTimeout(5000, () => {
      req.abort();
      resolve({ success: false, error: '请求超时' });
    });
  });
}

// 运行测试
testFilesAccess(); 