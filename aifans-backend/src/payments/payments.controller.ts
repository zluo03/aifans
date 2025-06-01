import { Controller, Post, Get, Body, Param, Req, UseGuards, Query, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrderDto } from './dto/payment.dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

// 扩展 Request 类型，添加 user 属性
interface RequestWithUser extends Request {
  user: { id: number };
}

@ApiTags('支付管理')
@Controller('payments')
export class PaymentsController {
  private readonly testMode: boolean;
  
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService
  ) {
    this.testMode = this.configService.get<string>('NODE_ENV') !== 'production';
  }

  @Post('create-order')
  @ApiOperation({ summary: '创建支付订单' })
  @UseGuards(AuthGuard('jwt'))
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.paymentsService.createOrder(userId, createOrderDto);
  }

  @Post('alipay-notify')
  @ApiOperation({ summary: '支付宝回调接口' })
  async alipayNotify(@Body() notifyData: any) {
    return this.paymentsService.handleAlipayNotification(notifyData);
  }

  @Get('order-status/:orderId')
  @ApiOperation({ summary: '查询订单状态' })
  @ApiParam({ name: 'orderId', description: '订单ID' })
  @UseGuards(AuthGuard('jwt'))
  async getOrderStatus(@Param('orderId') orderId: string, @Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.paymentsService.getOrderStatus(+orderId, userId);
  }
  
  @Get('mock-pay')
  @ApiOperation({ summary: '模拟支付（仅测试环境可用）' })
  async mockPay(
    @Query('orderId') orderId: string,
    @Res() res: Response
  ) {
    if (!this.testMode) {
      return res.status(403).send('此功能仅在测试环境可用');
    }
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>模拟支付</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            h1 { color: #333; }
            .btn { background: #1677ff; color: white; border: none; padding: 10px 20px; border-radius: 4px; 
                  cursor: pointer; font-size: 16px; margin-top: 20px; }
            .btn:hover { background: #0e5ebd; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>测试模式 - 模拟支付</h1>
            <p>订单ID: ${orderId}</p>
            <button class="btn" onclick="mockSuccess()">模拟支付成功</button>
          </div>
          
          <script>
            function mockSuccess() {
              fetch('/api/payments/mock-success?orderId=${orderId}', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                  if(data.success) {
                    alert('支付成功！');
                    window.location.href = '/membership/payment-result?orderId=${orderId}';
                  } else {
                    alert('处理失败：' + data.message);
                  }
                })
                .catch(err => {
                  alert('请求失败：' + err.message);
                });
            }
          </script>
        </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
  
  @Post('mock-success')
  @ApiOperation({ summary: '模拟支付成功（仅测试环境可用）' })
  async mockSuccess(@Query('orderId') orderId: string) {
    return this.paymentsService.mockPaymentSuccess(+orderId);
  }
} 