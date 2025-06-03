import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { CreateCreatorDto } from './dto/create-creator.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserStatusGuard } from '../auth/guards/user-status.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../types/prisma-enums';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Get()
  findAll() {
    return this.creatorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creatorsService.findOne(+id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.creatorsService.findByUserId(+userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, UserStatusGuard)
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

  // 同步所有创作者信息与用户信息
  @Post('sync-all-with-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async syncAllWithUsers() {
    try {
      const result = await this.creatorsService.syncAllCreatorsWithUserInfo();
      return { 
        message: `同步完成，共更新了 ${result.updated}/${result.total} 个创作者信息`,
        ...result
      };
    } catch (error) {
      return { error: '同步失败', message: error.message };
    }
  }
} 