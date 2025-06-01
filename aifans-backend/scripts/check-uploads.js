const fs = require('fs');
const path = require('path');

// 检查上传目录及权限
function checkUploadsDirectory() {
  console.log('=== 上传目录检查 ===');
  
  // 检查工作目录
  const cwd = process.cwd();
  console.log(`当前工作目录: ${cwd}`);
  
  // 检查uploads目录
  const uploadsDir = path.join(cwd, 'uploads');
  
  try {
    // 检查目录是否存在
    if (!fs.existsSync(uploadsDir)) {
      console.error(`错误: uploads目录不存在: ${uploadsDir}`);
      return;
    }
    
    // 检查是否为目录
    const stats = fs.statSync(uploadsDir);
    if (!stats.isDirectory()) {
      console.error(`错误: uploads不是一个目录: ${uploadsDir}`);
      return;
    }
    
    console.log(`uploads目录存在: ${uploadsDir}`);
    
    // 检查权限
    try {
      // 尝试读取目录
      const files = fs.readdirSync(uploadsDir);
      console.log(`可以读取uploads目录，包含${files.length}个项目`);
      
      // 检查avatar子目录
      const avatarDir = path.join(uploadsDir, 'avatar');
      if (fs.existsSync(avatarDir)) {
        if (fs.statSync(avatarDir).isDirectory()) {
          const avatarFiles = fs.readdirSync(avatarDir);
          console.log(`avatar目录存在，包含${avatarFiles.length}个文件`);
          
          // 列出最近5个头像文件
          if (avatarFiles.length > 0) {
            console.log('最近的头像文件:');
            
            // 获取文件及其修改时间
            const fileDetails = avatarFiles.map(file => {
              const filePath = path.join(avatarDir, file);
              const stats = fs.statSync(filePath);
              return {
                name: file,
                path: filePath,
                size: stats.size,
                mtime: stats.mtime
              };
            });
            
            // 按修改时间排序，最新的在前
            fileDetails.sort((a, b) => b.mtime - a.mtime);
            
            // 显示最近5个文件
            fileDetails.slice(0, 5).forEach(file => {
              console.log(`- ${file.name} (${file.size} 字节, 修改时间: ${file.mtime.toISOString()})`);
              
              // 尝试读取文件
              try {
                const content = fs.readFileSync(file.path);
                console.log(`  文件可读，大小: ${content.length} 字节`);
              } catch (err) {
                console.error(`  无法读取文件: ${err.message}`);
              }
            });
          }
        } else {
          console.error(`错误: avatar不是一个目录: ${avatarDir}`);
        }
      } else {
        console.error(`错误: avatar目录不存在: ${avatarDir}`);
      }
      
    } catch (err) {
      console.error(`无法读取uploads目录: ${err.message}`);
    }
    
    // 尝试写入测试文件
    const testFile = path.join(uploadsDir, 'test.txt');
    try {
      fs.writeFileSync(testFile, 'Test write permissions');
      console.log(`可以写入uploads目录: ${testFile}`);
      
      // 清理测试文件
      fs.unlinkSync(testFile);
      console.log('测试文件已删除');
    } catch (err) {
      console.error(`无法写入uploads目录: ${err.message}`);
    }
    
  } catch (err) {
    console.error(`检查uploads目录时出错: ${err.message}`);
  }
}

// 执行检查
checkUploadsDirectory(); 