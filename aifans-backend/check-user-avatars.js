const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserAvatars() {
  try {
    console.log('检查用户头像URL...');
    
    const users = await prisma.user.findMany({
      where: {
        avatarUrl: {
          not: null
        }
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatarUrl: true,
      }
    });
    
    console.log(`找到 ${users.length} 个有头像的用户:`);
    
    users.forEach(user => {
      console.log(`用户 ${user.username} (${user.nickname}):`);
      console.log(`  头像URL: ${user.avatarUrl}`);
      console.log(`  URL类型: ${getUrlType(user.avatarUrl)}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('查询错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getUrlType(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return '完整URL';
  } else if (url.startsWith('/uploads/')) {
    return '相对路径';
  } else {
    return '其他格式';
  }
}

checkUserAvatars(); 