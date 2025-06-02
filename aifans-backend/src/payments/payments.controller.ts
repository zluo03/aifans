import { Controller, Post, Get, Body, Param, Req, UseGuards, Query, Res, Logger, All } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrderDto } from './dto/payment.dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../types/prisma-enums';

// 扩展 Request 类型，添加 user 属性
interface RequestWithUser extends Request {
  user: {
    id: number;
  };
}

@ApiTags('支付管理')
@Controller('payments')
export class PaymentsController {
  private readonly testMode: boolean;
  private readonly logger = new Logger(PaymentsController.name);
  
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService
  ) {
    this.testMode = this.configService.get<string>('NODE_ENV') !== 'production';
  }

  @Post('create-order')
  @ApiOperation({ summary: '创建支付订单' })
  @UseGuards(AuthGuard('jwt'))
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.paymentsService.createOrder(userId, createOrderDto);
  }

  @Post('alipay-notify')
  @ApiOperation({ summary: '支付宝回调接口' })
  async alipayNotify(@Body() notifyData: any, @Req() req: Request) {
    this.logger.log('收到支付宝回调通知:', {
      headers: req.headers,
      body: notifyData,
      query: req.query
    });
    
    try {
      const result = await this.paymentsService.handleAlipayNotification(notifyData);
      this.logger.log('支付宝回调处理结果:', result);
      return result;
    } catch (error) {
      this.logger.error('处理支付宝回调时出错:', error);
      return { success: false, message: error.message };
    }
  }
  
  @All('alipay/notify')
  @ApiOperation({ summary: '支付宝回调接口(兼容路径)' })
  async alipayNotifyAlternative(@Body() notifyData: any, @Req() req: Request) {
    this.logger.log('收到支付宝回调通知(兼容路径):', {
      headers: req.headers,
      body: notifyData,
      query: req.query,
      method: req.method,
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl
    });
    
    // 合并请求体和查询参数，确保能处理GET和POST请求
    const combinedData = {
      ...req.query,
      ...notifyData
    };
    
    try {
      const result = await this.paymentsService.handleAlipayNotification(combinedData);
      this.logger.log('支付宝回调处理结果:', result);
      return result;
    } catch (error) {
      this.logger.error('处理支付宝回调时出错:', error);
      return { success: false, message: error.message };
    }
  }

  @Get('order-status/:id')
  @ApiOperation({ summary: '查询订单状态' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @UseGuards(AuthGuard('jwt'))
  async getOrderStatus(
    @Param('id') orderId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.paymentsService.getOrderStatus(+orderId, userId);
  }
  
  @Post('refresh-alipay-config')
  @ApiOperation({ summary: '刷新支付宝配置' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async refreshAlipayConfig() {
    return this.paymentsService.refreshAlipayConfig();
  }
  
  @Get('mock-pay')
  @ApiOperation({ summary: '模拟支付（仅测试环境可用）' })
  async mockPay(
    @Query('orderId') orderId: string,
    @Res() res: Response
  ) {
    // 如果没有通过orderId参数，尝试从orderid参数获取（处理大小写不一致问题）
    if (!orderId && res.req.query.orderid) {
      orderId = res.req.query.orderid as string;
    }
    
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