const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('测试数据库连接...');
    
    // 测试基本连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 查询用户数量
    const userCount = await prisma.user.count();
    console.log(`用户数量: ${userCount}`);
    
    // 查询AI平台数量
    const platformCount = await prisma.aIPlatform.count();
    console.log(`AI平台数量: ${platformCount}`);
    
    // 查询帖子数量
    const postCount = await prisma.post.count();
    console.log(`帖子数量: ${postCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          nickname: true,
          email: true
        }
      });
      console.log('\n用户列表:');
      users.forEach(user => {
        console.log(`- ${user.username || user.nickname} (${user.email})`);
      });
    }
    
    if (platformCount > 0) {
      const platforms = await prisma.aIPlatform.findMany();
      console.log('\nAI平台列表:');
      platforms.forEach(platform => {
        console.log(`- ${platform.name} (${platform.type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  }
}

testConnection(); 