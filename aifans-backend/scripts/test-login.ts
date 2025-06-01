import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { mapUserPasswordField } from '../src/types/prisma-extend';

async function testLoginProcess() {
  const prisma = new PrismaClient();
  
  try {
    console.log('模拟登录过程测试...');
    
    // 查询管理员账户
    const adminUser = await prisma.$queryRaw`
      SELECT * FROM users WHERE username = 'admin' LIMIT 1
    `;
    
    if (Array.isArray(adminUser) && adminUser.length > 0) {
      const admin = adminUser[0];
      console.log('找到管理员账户:');
      console.log('- ID:', admin.id);
      console.log('- 用户名:', admin.username);
      
      // 测试密码验证
      const testPasswords = ['Admin123', 'admin888'];
      
      // 1. 直接比较原始的passwordHash
      console.log('\n1. 直接使用原始数据库中的passwordHash:');
      for (const testPassword of testPasswords) {
        const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
        console.log(`密码 "${testPassword}" 验证结果:`, isValid ? '成功' : '失败');
      }
      
      // 2. 使用mapUserPasswordField进行处理后验证
      console.log('\n2. 使用mapUserPasswordField函数处理后:');
      const mappedUser = mapUserPasswordField(admin);
      console.log(`- 原始passwordHash: ${admin.passwordHash}`);
      console.log(`- 映射后passwordHash: ${mappedUser.passwordHash}`);
      
      for (const testPassword of testPasswords) {
        const isValidAfterMapping = await bcrypt.compare(testPassword, mappedUser.passwordHash);
        console.log(`密码 "${testPassword}" 映射后验证结果:`, isValidAfterMapping ? '成功' : '失败');
      }
      
      // 3. 检查字段是否被重命名
      console.log('\n3. 检查数据库字段名称:');
      console.log('原始用户对象字段:', Object.keys(admin));
      if (admin.password) {
        console.log('存在password字段, 值为:', admin.password);
      }
      if (admin.passwordHash) {
        console.log('存在passwordHash字段, 值为:', admin.passwordHash);
      }
      
      // 创建基于admin的对象修改测试
      console.log('\n4. 测试不同形式的对象映射:');
      
      // 4.1 创建只有password的用户对象
      const userWithPassword = { ...admin, password: admin.passwordHash };
      if ('passwordHash' in userWithPassword) {
        delete userWithPassword.passwordHash;
      }
      
      const mappedUserWithPassword = mapUserPasswordField(userWithPassword);
      console.log('只有password字段的对象映射后:');
      console.log('- 映射后passwordHash:', mappedUserWithPassword.passwordHash);
      
      // 4.2 创建只有passwordHash的用户对象
      const userWithPasswordHash = { ...admin };
      if ('password' in userWithPasswordHash) {
        delete userWithPasswordHash.password;
      }
      
      const mappedUserWithPasswordHash = mapUserPasswordField(userWithPasswordHash);
      console.log('只有passwordHash字段的对象映射后:');
      console.log('- 映射后passwordHash:', mappedUserWithPasswordHash.passwordHash);
      
    } else {
      console.log('错误：未找到管理员账户');
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行测试
testLoginProcess(); 