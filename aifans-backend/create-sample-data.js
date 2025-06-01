const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('开始创建示例数据...');

    // 检查是否已有用户和AI平台
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('没有找到用户，请先注册一个用户');
      return;
    }

    const aiPlatform = await prisma.aIPlatform.findFirst();
    if (!aiPlatform) {
      console.log('没有找到AI平台，创建一个测试平台...');
      await prisma.aIPlatform.create({
        data: {
          name: 'Midjourney',
          type: 'IMAGE',
          logoUrl: '/uploads/ai-platforms/midjourney.png',
          status: 'ACTIVE'
        }
      });
    }

    // 获取最新的用户和AI平台
    const testUser = await prisma.user.findFirst();
    const testAIPlatform = await prisma.aIPlatform.findFirst();

    if (!testUser || !testAIPlatform) {
      console.log('无法获取测试用户或AI平台');
      return;
    }

    console.log(`使用用户: ${testUser.username || testUser.nickname} (ID: ${testUser.id})`);
    console.log(`使用AI平台: ${testAIPlatform.name} (ID: ${testAIPlatform.id})`);

    // 创建测试帖子数据
    const samplePosts = [
      {
        type: 'IMAGE',
        title: '美丽的风景',
        fileUrl: '/uploads/posts/sample1.jpg',
        originalFilename: 'sample1.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
        userId: testUser.id,
        aiPlatformId: testAIPlatform.id,
        modelUsed: 'Midjourney v6',
        prompt: 'Beautiful landscape with mountains and lake, sunset, cinematic',
        status: 'VISIBLE',
        allowDownload: true,
        likesCount: 15,
        favoritesCount: 8,
        viewsCount: 120
      },
      {
        type: 'IMAGE',
        title: '未来城市',
        fileUrl: '/uploads/posts/sample2.jpg',
        originalFilename: 'sample2.jpg',
        mimeType: 'image/jpeg',
        size: 1200000,
        userId: testUser.id,
        aiPlatformId: testAIPlatform.id,
        modelUsed: 'Midjourney v6',
        prompt: 'Futuristic city skyline at night, neon lights, cyberpunk style',
        status: 'VISIBLE',
        allowDownload: true,
        likesCount: 25,
        favoritesCount: 12,
        viewsCount: 180
      },
      {
        type: 'IMAGE',
        title: '可爱的动物',
        fileUrl: '/uploads/posts/sample3.jpg',
        originalFilename: 'sample3.jpg',
        mimeType: 'image/jpeg',
        size: 800000,
        userId: testUser.id,
        aiPlatformId: testAIPlatform.id,
        modelUsed: 'Midjourney v6',
        prompt: 'Cute fluffy cat with big eyes, cartoon style, kawaii',
        status: 'VISIBLE',
        allowDownload: true,
        likesCount: 40,
        favoritesCount: 20,
        viewsCount: 300
      }
    ];

    // 检查帖子是否已存在
    const existingPosts = await prisma.post.count();
    if (existingPosts > 0) {
      console.log(`数据库中已有 ${existingPosts} 个帖子，是否要清除并重新创建？`);
      console.log('为了安全起见，跳过创建...');
      
      // 显示现有帖子
      const posts = await prisma.post.findMany({
        include: {
          user: {
            select: { username: true, nickname: true }
          },
          aiPlatform: {
            select: { name: true }
          }
        }
      });
      
      console.log('\n现有帖子:');
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title || '无标题'} (状态: ${post.status})`);
      });
      
      return;
    }

    console.log('创建示例帖子...');
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];
      console.log(`创建帖子 ${i + 1}: ${postData.title}`);
      
      await prisma.post.create({
        data: postData
      });
    }

    console.log(`\n✅ 成功创建了 ${samplePosts.length} 个示例帖子！`);
    
    // 验证创建结果
    const createdPosts = await prisma.post.findMany({
      include: {
        user: {
          select: { username: true, nickname: true }
        },
        aiPlatform: {
          select: { name: true }
        }
      }
    });
    
    console.log('\n创建的帖子列表:');
    createdPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title} (ID: ${post.id}, 状态: ${post.status})`);
    });

  } catch (error) {
    console.error('创建示例数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData(); 