import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function createAdminUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('检查管理员账户是否已存在...');
    
    // 使用更精确的查询条件
    const existingAdmin = await prisma.$queryRaw`
      SELECT id FROM users WHERE username = 'admin' OR email = 'admin@aifans.pro' LIMIT 1
    `;
    
    if (Array.isArray(existingAdmin) && existingAdmin.length > 0) {
      console.log('管理员账户已存在。正在更新密码...');
      
      // 更新现有管理员密码
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash('Abcd888', salt);
      
      await prisma.$executeRaw`
        UPDATE users SET passwordHash = ${hashedPassword}, updatedAt = NOW()
        WHERE username = 'admin' OR email = 'admin@aifans.pro'
      `;
      
      console.log('管理员密码已更新为: Abcd888');
      return;
    }

    console.log('开始创建管理员账户...');
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('Abcd888', salt);
    
    const now = new Date();

    // 使用Prisma客户端创建管理员账户
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        nickname: '管理员',
        email: 'admin@aifans.pro',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      }
    });

    if (admin) {
      console.log('管理员账户创建成功！');
      console.log('用户名: admin');
      console.log('密码: Abcd888');
      console.log('角色: 管理员');
    } else {
      console.log('管理员账户创建失败。');
    }
  } catch (error) {
    console.error('创建管理员账户时出错:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      if ('code' in error) {
        console.error('错误代码:', (error as any).code);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()
  .then(() => {
    console.log('脚本执行完毕');
    process.exit(0);
  })
  .catch((err) => {
    console.error('脚本执行出错:', err);
    process.exit(1);
  }); 