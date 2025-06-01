import { Controller, Get, Post, Body, Param, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { CreateCreatorDto } from './dto/create-creator.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserStatusGuard, RequiredAction, RequireAction } from '../auth/guards/user-status.guard';

@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Get()
  findAll() {
    return this.creatorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creatorsService.findOne(Number(id));
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.creatorsService.findByUserId(Number(userId));
  }

  @Post()
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  @RequireAction(RequiredAction.CREATE_PROFILE)
  createOrUpdate(@Body() dto: CreateCreatorDto, @Req() req) {
    // 使用原始的req.body数据，绕过ValidationPipe的问题
    const fixedDto = {
      ...dto,
      images: req.body.images || [],
      videos: req.body.videos || [],
      audios: req.body.audios || []
    };
    
    return this.creatorsService.createOrUpdate(req.user.id, fixedDto);
  }

  // 更新单个创作者积分
  @Post('score/update/:userId')
  @UseGuards(JwtAuthGuard)
  async updateScore(@Param('userId') userId: string) {
    await this.creatorsService.updateCreatorScore(Number(userId));
    return { message: '积分更新成功' };
  }

  // 批量更新所有创作者积分
  @Post('score/update-all')
  @UseGuards(JwtAuthGuard)
  async updateAllScores() {
    await this.creatorsService.updateAllCreatorScores();
    return { message: '所有创作者积分更新成功' };
  }

  // 记录每日登录
  @Post('daily-login')
  @UseGuards(JwtAuthGuard)
  async recordDailyLogin(@Req() req) {
    await this.creatorsService.recordDailyLogin(req.user.id);
    return { message: '每日登录记录成功' };
  }
} 