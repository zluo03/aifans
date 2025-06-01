import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建社交媒体数据...');

  // 确保上传目录存在
  const socialMediaDir = path.join(process.cwd(), 'uploads', 'social-media');
  if (!fs.existsSync(socialMediaDir)) {
    fs.mkdirSync(socialMediaDir, { recursive: true });
    console.log(`创建目录: ${socialMediaDir}`);
  }

  // 创建示例数据
  const socialMediaData = [
    {
      name: '微信',
      logoUrl: '/uploads/social-media/wechat-logo.svg',
      qrCodeUrl: '/uploads/social-media/wechat-qrcode.png',
      sortOrder: 0,
      isActive: true,
    },
    {
      name: '抖音',
      logoUrl: '/uploads/social-media/douyin-logo.svg',
      qrCodeUrl: '/uploads/social-media/douyin-qrcode.png',
      sortOrder: 1,
      isActive: true,
    },
    {
      name: '微博',
      logoUrl: '/uploads/social-media/weibo-logo.svg',
      qrCodeUrl: '/uploads/social-media/weibo-qrcode.png',
      sortOrder: 2,
      isActive: true,
    },
    {
      name: '小红书',
      logoUrl: '/uploads/social-media/xiaohongshu-logo.svg',
      qrCodeUrl: '/uploads/social-media/xiaohongshu-qrcode.png',
      sortOrder: 3,
      isActive: true,
    }
  ];

  // 创建示例SVG文件
  for (const media of socialMediaData) {
    const logoPath = path.join(process.cwd(), media.logoUrl);
    const qrCodePath = path.join(process.cwd(), media.qrCodeUrl);
    
    // 如果文件不存在，创建简单的SVG和PNG
    if (!fs.existsSync(logoPath)) {
      const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dominant-baseline="middle" fill="#333">
          ${media.name}
        </text>
      </svg>`;
      fs.writeFileSync(logoPath, logoSvg);
      console.log(`创建Logo: ${logoPath}`);
    }

    if (!fs.existsSync(qrCodePath)) {
      // 创建一个简单的1x1像素PNG
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(qrCodePath, pngBuffer);
      console.log(`创建二维码: ${qrCodePath}`);
    }
  }

  // 清空现有数据
  await prisma.socialMedia.deleteMany();
  console.log('已清空现有社交媒体数据');

  // 插入新数据
  for (const data of socialMediaData) {
    await prisma.socialMedia.create({
      data,
    });
  }

  console.log(`成功创建 ${socialMediaData.length} 条社交媒体数据`);
}

main()
  .catch((e) => {
    console.error('创建社交媒体数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 