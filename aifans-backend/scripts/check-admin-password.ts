import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const DEFAULT_PASSWORD = 'Admin123';

async function resetAdminPassword() {
  const prisma = new PrismaClient();
  
  try {
    console.log('开始检查管理员密码...');
    
    // 查询管理员账户
    const adminUser = await prisma.$queryRaw`
      SELECT * FROM users WHERE username = 'admin' LIMIT 1
    `;
    
    if (Array.isArray(adminUser) && adminUser.length > 0) {
      const admin = adminUser[0];
      console.log('找到管理员账户:');
      console.log('- ID:', admin.id);
      console.log('- 用户名:', admin.username);
      console.log('- 当前密码哈希:', admin.passwordHash);
      
      // 验证当前默认密码是否能匹配
      const isCurrentPasswordValid = await bcrypt.compare(DEFAULT_PASSWORD, admin.passwordHash);
      console.log(`默认密码(${DEFAULT_PASSWORD})验证结果:`, isCurrentPasswordValid ? '成功' : '失败');
      
      // 特别测试admin888密码
      const isAdmin888Valid = await bcrypt.compare('admin888', admin.passwordHash);
      console.log(`密码(admin888)验证结果:`, isAdmin888Valid ? '成功' : '失败');
      
      // 测试其他可能的密码
      const testPasswords = ['admin123', 'Admin888', 'admin', 'admin@123'];
      for (const testPassword of testPasswords) {
        const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
        console.log(`测试密码(${testPassword})验证结果:`, isValid ? '成功' : '失败');
      }
      
      console.log('\n当前有效的密码是:', isCurrentPasswordValid ? 'Admin123' : (isAdmin888Valid ? 'admin888' : '未知'));
      
      // 询问是否需要重置密码
      console.log('\n是否要重置密码为Admin123? (将在确认后执行)');
      
    } else {
      console.log('错误：未找到管理员账户');
    }
    
  } catch (error) {
    console.error('检查/重置密码过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 将以下代码注释掉以查看密码状态而不执行重置
// resetAdminPassword();

// 要重置密码，取消下面一行的注释并执行脚本
// resetAdminPasswordForce();

// 强制重置密码的函数
async function resetAdminPasswordForce() {
  const prisma = new PrismaClient();
  
  try {
    console.log('开始强制重置管理员密码...');
    
    // 查询管理员账户
    const adminUser = await prisma.$queryRaw`
      SELECT * FROM users WHERE username = 'admin' LIMIT 1
    `;
    
    if (Array.isArray(adminUser) && adminUser.length > 0) {
      const admin = adminUser[0];
      console.log('找到管理员账户, ID:', admin.id);
      
      // 生成新的密码哈希
      const salt = await bcrypt.genSalt();
      const newPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);
      
      // 更新密码 - 使用参数化查询以避免SQL注入
      await prisma.$executeRaw`
        UPDATE users 
        SET passwordHash = ${newPasswordHash}, updatedAt = NOW() 
        WHERE id = ${admin.id}
      `;
      
      console.log('密码已重置为:', DEFAULT_PASSWORD);
      
      // 验证更新是否成功
      const updatedAdmin = await prisma.$queryRaw`
        SELECT * FROM users WHERE id = ${admin.id}
      `;
      
      if (Array.isArray(updatedAdmin) && updatedAdmin.length > 0) {
        const isPasswordValid = await bcrypt.compare(DEFAULT_PASSWORD, updatedAdmin[0].passwordHash);
        console.log('验证重置结果:', isPasswordValid ? '成功' : '失败');
        console.log('新密码哈希:', updatedAdmin[0].passwordHash);
      }
    } else {
      console.log('错误：未找到管理员账户');
    }
  } catch (error) {
    console.error('重置密码过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 默认仅检查密码
resetAdminPassword();

// 如果需要重置密码，请取消下面的注释并再次运行脚本
// resetAdminPasswordForce(); 