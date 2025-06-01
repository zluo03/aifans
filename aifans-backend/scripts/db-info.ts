import { PrismaClient } from '@prisma/client';

async function showTableInfo() {
  const prisma = new PrismaClient();
  
  try {
    console.log('用户表结构信息:');
    
    const tableInfo = await prisma.$queryRaw`DESCRIBE users`;
    console.log(tableInfo);
    
    // 获取管理员用户的所有字段名
    console.log('\n尝试获取密码字段:');
    try {
      const userFields = await prisma.$queryRaw`
        SELECT * FROM users WHERE username = 'admin' LIMIT 1
      `;
      if (Array.isArray(userFields) && userFields.length > 0) {
        const user = userFields[0];
        console.log('用户字段包括:');
        console.log(Object.keys(user));
        
        // 检查密码相关字段
        if (user.passwordHash !== undefined) {
          console.log('密码字段名称为: passwordHash');
        } else if (user.password !== undefined) {
          console.log('密码字段名称为: password');
        } else {
          console.log('未找到密码字段');
        }
      }
    } catch (e) {
      console.error('查询用户信息出错:', e);
    }
    
  } catch (error) {
    console.error('获取表结构时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showTableInfo()
  .then(() => {
    console.log('脚本执行完毕');
    process.exit(0);
  })
  .catch((err) => {
    console.error('脚本执行出错:', err);
    process.exit(1);
  }); 