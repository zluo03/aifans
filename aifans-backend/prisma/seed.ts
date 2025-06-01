import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 创建管理员用户
  const password = 'admin888';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@aifans.pro',
      password: hashedPassword,
      role: 'ADMIN',
      nickname: '管理员',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  console.log('管理员用户创建成功！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 