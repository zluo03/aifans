import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { adaptUserCreateInput } from '../src/types/prisma-extend';

async function createAdminUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('检查管理员账户是否已存在...');
    
    // 使用更精确的查询条件
    const existingAdmin = await prisma.$queryRaw`
      SELECT id FROM users WHERE username = 'admin' OR email = 'admin@aifans.pro' LIMIT 1
    `;
    
    if (Array.isArray(existingAdmin) && existingAdmin.length > 0) {
      console.log('管理员账户已存在，无需创建。');
      
      // 查看用户信息 - 只选择需要的字段
      const adminUser = await prisma.user.findFirst({
        where: { 
          OR: [
            { username: 'admin' },
            { email: 'admin@aifans.pro' }
          ]
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true
        }
      });
      
      if (adminUser) {
        console.log('管理员账户ID:', adminUser.id);
        console.log('角色:', adminUser.role);
        console.log('状态:', adminUser.status);
      }
      
      return;
    }

    console.log('开始创建管理员账户...');
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('admin888', salt);

    // 创建管理员账户 - 使用Prisma客户端API
    try {
      // 准备数据
      const adminData = adaptUserCreateInput({
        username: 'admin',
        nickname: '管理员',
        email: 'admin@aifans.pro',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      });
      
      // 创建用户
      const admin = await prisma.user.create({
        data: adminData,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true
        }
      });
      
      console.log('管理员账户创建成功！');
      console.log('用户名: admin');
      console.log('密码: admin888');
      console.log('角色: 管理员');
      console.log('用户ID:', admin.id);
    } catch (error) {
      console.error('使用Prisma创建账户失败:', error);
      
      // 如果Prisma创建失败，尝试使用原始SQL
      console.log('尝试使用原始SQL创建管理员账户...');
      
      const result = await prisma.$executeRaw`
        INSERT INTO users (username, nickname, email, passwordHash, role, status, createdAt, updatedAt)
        VALUES ('admin', '管理员', 'admin@aifans.pro', ${hashedPassword}, 'ADMIN', 'ACTIVE', NOW(), NOW())
      `;
      
      if (result === 1) {
        console.log('管理员账户创建成功（使用原始SQL）！');
        console.log('用户名: admin');
        console.log('密码: admin888');
        console.log('角色: 管理员');
      } else {
        console.log('管理员账户创建失败。');
      }
    }
    
  } catch (error) {
    console.error('创建管理员账户时出错:', error);
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