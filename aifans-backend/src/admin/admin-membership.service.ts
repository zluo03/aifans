import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipProductDto, UpdateMembershipProductDto } from './dto/membership.dto';

@Injectable()
export class AdminMembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.membershipProduct.findMany({
      orderBy: {
        price: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.membershipProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`ID为${id}的会员产品不存在`);
    }

    return product;
  }

  async create(createDto: CreateMembershipProductDto) {
    return this.prisma.membershipProduct.create({
      data: {
        ...createDto,
        price: typeof createDto.price === 'string' 
          ? parseFloat(createDto.price) 
          : createDto.price,
      },
    });
  }

  async update(id: number, updateDto: UpdateMembershipProductDto) {
    // 检查产品是否存在
    await this.findOne(id);

    return this.prisma.membershipProduct.update({
      where: { id },
      data: {
        ...updateDto,
        price: updateDto.price !== undefined 
          ? (typeof updateDto.price === 'string' 
            ? parseFloat(updateDto.price) 
            : updateDto.price)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    // 检查产品是否存在
    await this.findOne(id);

    // 检查是否有关联的订单
    const orderCount = await this.prisma.paymentOrder.count({
      where: { productId: id },
    });

    if (orderCount > 0) {
      throw new Error(`该会员产品已有${orderCount}个关联订单，无法删除`);
    }

    await this.prisma.membershipProduct.delete({
      where: { id },
    });

    return { id, deleted: true };
  }

  async findAllOrders() {
    return this.prisma.paymentOrder.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            email: true,
            avatarUrl: true,
          },
        },
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
} 