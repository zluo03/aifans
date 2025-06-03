import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateStorageSettings() {
  try {
    console.log('开始迁移存储配置数据...');

    // 从原有的 system_settings 表中读取配置
    const ossConfigSetting = await prisma.$queryRaw`
      SELECT value FROM system_settings WHERE \`key\` = 'oss_config' LIMIT 1
    `;

    const storageConfigSetting = await prisma.$queryRaw`
      SELECT value FROM system_settings WHERE \`key\` = 'storage_config' LIMIT 1
    `;

    // 解析并迁移 OSS 配置
    if (ossConfigSetting && ossConfigSetting[0]) {
      const ossConfig = JSON.parse(ossConfigSetting[0].value);
      await prisma.ossConfig.create({
        data: {
          accessKeyId: ossConfig.accessKeyId || '',
          accessKeySecret: ossConfig.accessKeySecret || '',
          bucket: ossConfig.bucket || '',
          region: ossConfig.region || 'cn-hangzhou',
          endpoint: ossConfig.endpoint || '',
          domain: ossConfig.domain || '',
        }
      });
      console.log('OSS 配置迁移成功');
    } else {
      console.log('未找到原有的 OSS 配置');
    }

    // 解析并迁移存储配置
    if (storageConfigSetting && storageConfigSetting[0]) {
      const storageConfig = JSON.parse(storageConfigSetting[0].value);
      await prisma.storageConfig.create({
        data: {
          defaultStorage: storageConfig.defaultStorage || 'local',
          maxFileSize: storageConfig.maxFileSize || 100,
          enableCleanup: storageConfig.enableCleanup || false,
          cleanupDays: storageConfig.cleanupDays || 30,
        }
      });
      console.log('存储配置迁移成功');
    } else {
      console.log('未找到原有的存储配置');
    }

    // 删除原有的配置数据
    await prisma.$executeRaw`
      DELETE FROM system_settings WHERE \`key\` IN ('oss_config', 'storage_config')
    `;
    console.log('原有配置数据已删除');

    console.log('迁移完成！');
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateStorageSettings(); 