import { IsNumber, IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ApiProperty({ description: '会员产品ID', example: 1 })
  @IsInt({ message: '产品ID必须是整数' })
  @IsPositive({ message: '产品ID必须是正数' })
  productId: number;
}

export class OrderStatusResponseDto {
  @ApiProperty({ description: '订单ID', example: 1 })
  orderId: number;

  @ApiProperty({ description: '订单状态', example: 'PENDING', enum: ['PENDING', 'SUCCESS', 'FAILED'] })
  status: string;

  @ApiProperty({ description: '订单金额', example: 29.9 })
  amount: number;

  @ApiProperty({ 
    description: '产品信息',
    example: {
      id: 1,
      title: '月度会员',
      price: 29.9
    }
  })
  product: {
    id: number;
    title: string;
    price: number;
  };

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class CreateOrderResponseDto {
  @ApiProperty({ description: '订单ID', example: 1 })
  orderId: number;

  @ApiProperty({ description: '支付链接', example: 'https://openapi.alipay.com/gateway.do?...' })
  paymentUrl: string;
}
