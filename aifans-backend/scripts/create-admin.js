const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin888', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@aifans.pro',
        username: 'admin',
        nickname: '管理员',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    console.log('管理员创建成功:', admin);
  } catch (error) {
    console.error('创建管理员失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 