import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MembershipService } from './membership.service';
import { 
  CreateMembershipProductDto, 
  UpdateMembershipProductDto,
  CreateRedemptionCodeDto,
  RedeemCodeDto,
  UpdatePaymentSettingsDto,
  MembershipQueryDto
} from './dto';
import { User } from '../types';

@Controller('membership')
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  // 用户兑换码（需要登录）
  @UseGuards(JwtAuthGuard)
  @Post('redeem')
  async redeemCode(@CurrentUser() user: User, @Body() redeemDto: RedeemCodeDto) {
    return this.membershipService.redeemCode(user, redeemDto);
  }

  // 获取会员产品列表（所有人可见）
  @Get('products')
  async getMembershipProducts() {
    return this.membershipService.getMembershipProducts();
  }
}

@Controller('admin/membership')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminMembershipController {
  constructor(private membershipService: MembershipService) {}

  // 会员管理
  @Get('members')
  async getMembers(@Query() query: MembershipQueryDto) {
    return this.membershipService.getMembers(query);
  }

  // 会员产品管理
  @Post('products')
  async createMembershipProduct(@Body() createDto: CreateMembershipProductDto) {
    return this.membershipService.createMembershipProduct(createDto);
  }

  @Get('products')
  async getMembershipProducts() {
    return this.membershipService.getMembershipProducts();
  }

  @Get('products/:id')
  async getMembershipProduct(@Param('id', ParseIntPipe) id: number) {
    return this.membershipService.getMembershipProduct(id);
  }

  @Put('products/:id')
  async updateMembershipProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMembershipProductDto
  ) {
    return this.membershipService.updateMembershipProduct(id, updateDto);
  }

  @Delete('products/:id')
  async deleteMembershipProduct(@Param('id', ParseIntPipe) id: number) {
    return this.membershipService.deleteMembershipProduct(id);
  }

  // 兑换码管理
  @Post('redemption-codes')
  async createRedemptionCode(@Body() createDto: CreateRedemptionCodeDto) {
    return this.membershipService.createRedemptionCode(createDto);
  }

  @Get('redemption-codes')
  async getRedemptionCodes(@Query() query: MembershipQueryDto) {
    return this.membershipService.getRedemptionCodes(query);
  }

  // 会员订单管理
  @Get('orders')
  async getMembershipOrders(@Query() query: MembershipQueryDto) {
    return this.membershipService.getMembershipOrders(query);
  }

  // 支付设置管理
  @Get('payment-settings')
  async getPaymentSettings() {
    return this.membershipService.getPaymentSettings();
  }

  @Put('payment-settings')
  async updatePaymentSettings(@Body() updateDto: UpdatePaymentSettingsDto) {
    return this.membershipService.updatePaymentSettings(updateDto);
  }

  @Post('payment-settings/test')
  async testPaymentSettings() {
    return this.membershipService.testPaymentSettings();
  }
} 