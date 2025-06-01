import { PrismaClient } from '@prisma/client';

async function cleanUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('开始清理用户数据...');
    
    // 先获取admin用户的ID，确保该用户存在
    const adminUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { username: 'admin' },
          { email: 'admin@aifans.pro' }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    if (!adminUser) {
      console.error('错误：未找到admin用户，操作已中止');
      return;
    }

    console.log('找到admin用户:', {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role
    });
    
    // 开始事务，确保所有操作要么全部成功，要么全部失败
    await prisma.$transaction(async (tx) => {
      // 1. 清理用户创建的筛选内容
      console.log('清理用户筛选...');
      await tx.screening.deleteMany({
        where: {
          NOT: {
            OR: [
              { adminUploaderId: adminUser.id },
              { creatorId: adminUser.id }
            ]
          }
        }
      });
      
      // 2. 清理评论
      console.log('清理评论...');
      await tx.comment.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 3. 清理点赞
      console.log('清理点赞...');
      await tx.like.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 4. 清理收藏
      console.log('清理收藏...');
      await tx.favorite.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 5. 清理灵贴消息
      console.log('清理灵贴消息...');
      await tx.spiritPostMessage.deleteMany({
        where: {
          OR: [
            { NOT: { senderId: adminUser.id } },
            { NOT: { receiverId: adminUser.id } }
          ]
        }
      });
      
      // 6. 清理灵贴认领
      console.log('清理灵贴认领...');
      await tx.spiritPostClaim.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 7. 清理灵贴
      console.log('清理灵贴...');
      await tx.spiritPost.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 8. 清理公告查看记录
      console.log('清理公告查看记录...');
      await tx.announcementView.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 9. 清理每日登录记录
      console.log('清理每日登录记录...');
      await tx.userDailyLogin.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 10. 清理兑换码使用记录
      console.log('清理兑换码使用记录...');
      await tx.redemptionCode.updateMany({
        where: {
          NOT: { usedByUserId: adminUser.id },
          isUsed: true
        },
        data: {
          isUsed: false,
          usedByUserId: null,
          usedAt: null
        }
      });
      
      // 11. 清理创作者
      console.log('清理创作者资料...');
      await tx.creator.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 12. 清理请求回复
      console.log('清理请求回复...');
      await tx.requestResponse.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 13. 清理请求
      console.log('清理请求...');
      await tx.request.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 14. 清理支付订单
      console.log('清理支付订单...');
      await tx.paymentOrder.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 15. 清理笔记
      console.log('清理笔记...');
      await tx.note.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 16. 清理资源
      console.log('清理资源...');
      await tx.resource.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 17. 清理帖子
      console.log('清理帖子...');
      await tx.post.deleteMany({
        where: {
          NOT: { userId: adminUser.id }
        }
      });
      
      // 18. 清理微信验证码
      console.log('清理微信验证码...');
      await tx.wechatVerificationCode.deleteMany();
      
      // 19. 最后删除所有非admin用户
      console.log('删除非admin用户...');
      const result = await tx.user.deleteMany({
        where: {
          NOT: { id: adminUser.id }
        }
      });
      
      console.log(`已删除 ${result.count} 个非admin用户`);
    });
    
    console.log('用户清理完成，仅保留admin用户');
    
  } catch (error) {
    console.error('清理用户时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行脚本
cleanUsers()
  .then(() => {
    console.log('脚本执行完毕');
    process.exit(0);
  })
  .catch((err) => {
    console.error('脚本执行出错:', err);
    process.exit(1);
  }); 