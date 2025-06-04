import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserMessageDto, UserMessageResponseDto } from './dto/user-message.dto';
import { SensitiveWordsCheckService } from '../common/services/sensitive-words.service';

@Injectable()
export class UsersMessagesService {
  constructor(
    private prisma: PrismaService,
    private sensitiveWordsCheckService: SensitiveWordsCheckService,
  ) {}

  async create(senderId: number, createUserMessageDto: CreateUserMessageDto) {
    // 检查接收者是否存在
    const receiver = await this.prisma.user.findUnique({
      where: { id: createUserMessageDto.receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('接收者不存在');
    }

    // 检查是否是给自己发消息
    if (senderId === createUserMessageDto.receiverId) {
      throw new BadRequestException('不能给自己发送消息');
    }

    // 检查敏感词
    const sensitiveCheck = await this.sensitiveWordsCheckService.checkSensitiveWords(createUserMessageDto.content);
    if (sensitiveCheck.isSensitive) {
      throw new BadRequestException(`消息包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
    }

    // 创建消息
    const message = await this.prisma.userMessage.create({
      data: {
        senderId,
        receiverId: createUserMessageDto.receiverId,
        content: createUserMessageDto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    return message;
  }

  async getContacts(userId: number) {
    // 获取与该用户有消息往来的所有用户
    const sentMessages = await this.prisma.userMessage.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });

    const receivedMessages = await this.prisma.userMessage.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    // 合并并去重
    const contactIds = new Set([
      ...sentMessages.map(m => m.receiverId),
      ...receivedMessages.map(m => m.senderId),
    ]);

    // 获取联系人信息
    const contacts = await Promise.all(
      Array.from(contactIds).map(async (contactId) => {
        const user = await this.prisma.user.findUnique({
          where: { id: contactId },
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        });

        // 获取最后一条消息
        const lastMessage = await this.prisma.userMessage.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: contactId },
              { senderId: contactId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            createdAt: true,
            senderId: true,
          },
        });

        // 获取未读消息数
        const unreadCount = await this.prisma.userMessage.count({
          where: {
            senderId: contactId,
            receiverId: userId,
            read: false,
          },
        });

        return {
          ...user,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            isFromMe: lastMessage.senderId === userId,
          } : null,
          unreadCount,
        };
      }),
    );

    // 按最后一条消息时间排序
    contacts.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
    });

    return contacts;
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.userMessage.count({
      where: {
        receiverId: userId,
        read: false,
      },
    });

    return { count };
  }

  async getMessagesWithUser(
    userId: number,
    otherUserId: number,
    limit: number = 20,
    offset: number = 0,
  ) {
    // 检查对方用户是否存在
    const otherUser = await this.prisma.user.findUnique({
      where: { id: otherUserId },
    });

    if (!otherUser) {
      throw new NotFoundException('用户不存在');
    }

    // 获取双方之间的消息
    const messages = await this.prisma.userMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 自动将收到的消息标记为已读
    await this.markAsRead(userId, otherUserId);

    // 返回按时间正序排列的消息
    return messages.reverse();
  }

  async markAsRead(userId: number, otherUserId: number) {
    // 将所有来自对方的未读消息标记为已读
    await this.prisma.userMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return { success: true };
  }
} 