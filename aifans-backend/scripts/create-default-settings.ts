import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDefaultSettings() {
  try {
    console.log('开始创建默认配置...');

    // 创建默认的 OSS 配置
    const ossConfig = await prisma.ossConfig.create({
      data: {
        accessKeyId: '',
        accessKeySecret: '',
        bucket: '',
        region: 'cn-hangzhou',
        endpoint: '',
        domain: '',
      }
    });
    console.log('默认 OSS 配置创建成功:', ossConfig);

    // 创建默认的存储配置
    const storageConfig = await prisma.storageConfig.create({
      data: {
        defaultStorage: 'local',
        maxFileSize: 100,
        enableCleanup: false,
        cleanupDays: 30,
      }
    });
    console.log('默认存储配置创建成功:', storageConfig);

    console.log('所有默认配置创建完成！');
  } catch (error) {
    console.error('创建默认配置时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultSettings(); 