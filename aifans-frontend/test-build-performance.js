const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 开始测试构建性能...\n');

// 清理缓存
console.log('📦 清理构建缓存...');
try {
  execSync('rmdir /s /q .next', { stdio: 'inherit' });
} catch (e) {
  // 忽略错误，可能目录不存在
}

// 测试构建时间
console.log('\n⏱️  开始构建测试...');
const startTime = Date.now();

try {
  execSync('npm run build', { stdio: 'inherit' });
  const endTime = Date.now();
  const buildTime = (endTime - startTime) / 1000;
  
  console.log(`\n✅ 构建完成！耗时: ${buildTime.toFixed(2)}秒`);
  
  // 检查构建产物大小
  if (fs.existsSync('.next')) {
    console.log('\n📊 构建产物分析:');
    
    // 检查页面大小
    const pagesDir = '.next/server/app';
    if (fs.existsSync(pagesDir)) {
      const notesPagePath = `${pagesDir}/notes/[id]/page.js`;
      if (fs.existsSync(notesPagePath)) {
        const stats = fs.statSync(notesPagePath);
        console.log(`📄 笔记详情页面大小: ${(stats.size / 1024).toFixed(2)} KB`);
      }
    }
    
    // 检查客户端bundle
    const staticDir = '.next/static';
    if (fs.existsSync(staticDir)) {
      console.log('📦 客户端bundle信息:');
      execSync('dir .next\\static\\chunks /s', { stdio: 'inherit' });
    }
  }
  
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

console.log('\n🎉 性能测试完成！'); 