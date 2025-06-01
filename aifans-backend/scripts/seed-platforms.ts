import { PrismaClient, AIPlatformType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const platforms = [
    {
      name: 'Midjourney',
      type: AIPlatformType.IMAGE,
      logoUrl: 'https://cdn.midjourney.com/logo.png',
    },
    {
      name: 'DALL-E',
      type: AIPlatformType.IMAGE,
      logoUrl: 'https://cdn.openai.com/dalle-logo.png',
    },
    {
      name: 'Stable Diffusion',
      type: AIPlatformType.IMAGE,
      logoUrl: 'https://stability.ai/logo.png',
    },
    {
      name: 'RunwayML',
      type: AIPlatformType.VIDEO,
      logoUrl: 'https://cdn.runwayml.com/logo.png',
    },
    {
      name: 'Pika Labs',
      type: AIPlatformType.VIDEO,
      logoUrl: 'https://pika.art/logo.png',
    },
  ];

  console.log('开始添加AI平台数据...');

  for (const platform of platforms) {
    try {
      await prisma.aIPlatform.create({
        data: platform,
      });
      console.log(`成功添加平台: ${platform.name} (${platform.type})`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`平台已存在，跳过: ${platform.name} (${platform.type})`);
      } else {
        console.error(`添加平台失败: ${platform.name}`, error);
      }
    }
  }

  console.log('AI平台数据添加完成！');
}

main()
  .catch((e) => {
    console.error('执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 