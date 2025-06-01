const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPostsDatabase() {
  try {
    console.log('连接到数据库...');
    
    // 检查帖子总数
    const totalPosts = await prisma.post.count();
    console.log(`\n数据库中总共有 ${totalPosts} 个帖子`);
    
    if (totalPosts > 0) {
      // 按状态分组查看帖子数量
      const postsByStatus = await prisma.post.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });
      
      console.log('\n按状态分组的帖子数量:');
      postsByStatus.forEach(group => {
        console.log(`- ${group.status}: ${group._count.status} 个`);
      });
      
      // 查看前5个帖子的详细信息
      const samplePosts = await prisma.post.findMany({
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatarUrl: true
            }
          },
          aiPlatform: {
            select: {
              id: true,
              name: true,
              logoUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log('\n前5个帖子的详细信息:');
      samplePosts.forEach((post, index) => {
        console.log(`\n${index + 1}. 帖子 ID: ${post.id}`);
        console.log(`   类型: ${post.type}`);
        console.log(`   状态: ${post.status}`);
        console.log(`   文件URL: ${post.fileUrl}`);
        console.log(`   标题: ${post.title || '无标题'}`);
        console.log(`   用户: ${post.user?.username || post.user?.nickname || '未知'} (ID: ${post.user?.id})`);
        console.log(`   AI平台: ${post.aiPlatform?.name || '未知'} (ID: ${post.aiPlatform?.id})`);
        console.log(`   点赞数: ${post.likesCount}`);
        console.log(`   收藏数: ${post.favoritesCount}`);
        console.log(`   浏览数: ${post.viewsCount}`);
        console.log(`   创建时间: ${post.createdAt}`);
      });
    }
    
    // 检查用户数据
    const totalUsers = await prisma.user.count();
    console.log(`\n数据库中总共有 ${totalUsers} 个用户`);
    
    // 检查AI平台数据
    const totalPlatforms = await prisma.aIPlatform.count();
    console.log(`数据库中总共有 ${totalPlatforms} 个AI平台`);
    
    if (totalPlatforms > 0) {
      const platforms = await prisma.aIPlatform.findMany({
        select: {
          id: true,
          name: true,
          status: true
        }
      });
      
      console.log('\nAI平台列表:');
      platforms.forEach(platform => {
        console.log(`- ${platform.name} (ID: ${platform.id}, 状态: ${platform.status})`);
      });
    }
    
  } catch (error) {
    console.error('检查数据库时出错:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPostsDatabase(); 