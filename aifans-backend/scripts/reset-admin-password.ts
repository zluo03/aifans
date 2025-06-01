import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// 要重置的密码
const NEW_PASSWORD = 'Admin123';
// 当前可能的密码 - 用于验证
const CURRENT_PASSWORD = 'admin888';

async function resetAdminPassword() {
  const prisma = new PrismaClient();
  
  try {
    console.log('====== 开始重置管理员密码 ======');
    
    // 查询管理员账户
    const adminUser = await prisma.$queryRaw`
      SELECT * FROM users WHERE username = 'admin' LIMIT 1
    `;
    
    if (!Array.isArray(adminUser) || adminUser.length === 0) {
      console.log('错误：未找到管理员账户');
      return;
    }
    
    const admin = adminUser[0];
    console.log('找到管理员账户:');
    console.log('- ID:', admin.id);
    console.log('- 用户名:', admin.username);
    console.log('- 当前密码哈希:', admin.passwordHash);
    
    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(CURRENT_PASSWORD, admin.passwordHash);
    console.log(`当前密码 "${CURRENT_PASSWORD}" 验证结果:`, isCurrentPasswordValid ? '成功' : '失败');
    
    // 生成新密码哈希
    const salt = await bcrypt.genSalt();
    const newPasswordHash = await bcrypt.hash(NEW_PASSWORD, salt);
    console.log('- 新生成的密码哈希:', newPasswordHash);
    
    // 使用原生SQL直接更新密码字段 - 绕过所有适配器和转换逻辑
    console.log('\n执行密码重置...');
    
    const result = await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET passwordHash = '${newPasswordHash}', updatedAt = NOW() 
      WHERE id = ${admin.id}
    `);
    
    console.log(`更新结果: 影响了 ${result} 行`);
    
    // 验证更新是否成功
    const updatedAdmin = await prisma.$queryRaw`
      SELECT * FROM users WHERE id = ${admin.id}
    `;
    
    if (Array.isArray(updatedAdmin) && updatedAdmin.length > 0) {
      console.log('\n更新后的密码哈希:', updatedAdmin[0].passwordHash);
      
      // 验证新密码
      const isNewPasswordValid = await bcrypt.compare(NEW_PASSWORD, updatedAdmin[0].passwordHash);
      console.log(`新密码 "${NEW_PASSWORD}" 验证结果:`, isNewPasswordValid ? '成功' : '失败');
      
      if (isNewPasswordValid) {
        console.log('\n✅ 密码重置成功！');
        console.log(`管理员账户 "${admin.username}" 的密码已重置为: ${NEW_PASSWORD}`);
        console.log('请使用新密码登录系统。');
      } else {
        console.log('\n❌ 密码重置失败！');
        console.log('验证新密码失败，请联系技术支持。');
      }
    } else {
      console.log('\n❌ 密码重置失败！');
      console.log('无法获取更新后的用户信息。');
    }
    
  } catch (error) {
    console.error('重置密码过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行重置
resetAdminPassword(); 