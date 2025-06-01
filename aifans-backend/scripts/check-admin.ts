import { PrismaClient } from '@prisma/client';

async function checkAdminUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('查询管理员账户信息...');
    
    const admin = await prisma.user.findUnique({
      where: { username: 'admin' },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        role: true,
        status: true,
        createdAt: true,
      }
    });
    
    if (admin) {
      console.log('管理员账户信息:');
      console.log(JSON.stringify(admin, null, 2));
    } else {
      console.log('未找到管理员账户');
    }
  } catch (error) {
    console.error('查询管理员账户时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser()
  .then(() => {
    console.log('脚本执行完毕');
    process.exit(0);
  })
  .catch((err) => {
    console.error('脚本执行出错:', err);
    process.exit(1);
  }); 