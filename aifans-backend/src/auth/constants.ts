import { ConfigService } from '@nestjs/config';

/**
 * JWT相关常量
 * 注意：生产环境中应该通过环境变量来配置，而不是硬编码
 */
export const jwtConstants = {
  // 用于测试的默认密钥，生产环境应该使用环境变量设置
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '30d',
}; 