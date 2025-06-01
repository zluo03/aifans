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
      console.log('管理员账户已存在，无需创建。');
      
      // 获取当前管理员信息
      const adminInfo = await prisma.$queryRaw`
        SELECT id, username, email, role, password FROM users WHERE username = 'admin' LIMIT 1
      `;
      
      if (Array.isArray(adminInfo) && adminInfo.length > 0) {
        const admin = adminInfo[0];
        
        // 修复密码字段（如果需要）
        if (admin.password === null) {
          console.log('管理员账户密码字段为空，正在修复...');
          
          const salt = await bcrypt.genSalt();
          const hashedPassword = await bcrypt.hash('admin888', salt);
          
          await prisma.$executeRaw`
            UPDATE users 
            SET password = ${hashedPassword} 
            WHERE id = ${admin.id}
          `;
          
          console.log('管理员账户密码已修复。');
        }
      }
      
      return;
    }

    console.log('开始创建管理员账户...');
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('admin888', salt);

    // 创建管理员账户
    const result = await prisma.$executeRaw`
      INSERT INTO users (username, nickname, email, password, role, status, createdAt, updatedAt)
      VALUES ('admin', '管理员', 'admin@aifans.pro', ${hashedPassword}, 'ADMIN', 'ACTIVE', NOW(), NOW())
    `;
    
    if (result === 1) {
      console.log('管理员账户创建成功！');
      console.log('用户名: admin');
      console.log('密码: admin888');
      console.log('角色: 管理员');
    } else {
      console.log('管理员账户创建失败。');
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