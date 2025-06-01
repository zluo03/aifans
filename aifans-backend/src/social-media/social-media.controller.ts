import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { SocialMediaService } from './social-media.service';
import { CreateSocialMediaDto } from './dto/create-social-media.dto';
import { UpdateSocialMediaDto } from './dto/update-social-media.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../types/prisma-enums';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';

// 文件上传配置
const multerConfig = {
  storage: diskStorage({
    destination: './uploads/social-media',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/svg+xml',
      'image/webp', 
      'image/png'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 SVG、WebP 和 PNG 格式的图片'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};

@ApiTags('社交媒体管理')
@Controller('social-media')
export class SocialMediaController {
  constructor(private readonly socialMediaService: SocialMediaService) {}

  @ApiOperation({ summary: '创建社交媒体' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'qrCode', maxCount: 1 }
  ], multerConfig))
  create(
    @Body() createSocialMediaDto: CreateSocialMediaDto,
    @UploadedFiles() files: { logo?: Express.Multer.File[], qrCode?: Express.Multer.File[] }
  ) {
    console.log('收到创建社交媒体请求:', createSocialMediaDto);
    console.log('上传的文件:', files);

    if (!files.logo || !files.qrCode) {
      throw new BadRequestException('必须上传logo和二维码图片');
    }

    const logoUrl = `/uploads/social-media/${files.logo[0].filename}`;
    const qrCodeUrl = `/uploads/social-media/${files.qrCode[0].filename}`;

    const dataToCreate = {
      ...createSocialMediaDto,
      logoUrl,
      qrCodeUrl,
    };

    console.log('准备创建的数据:', dataToCreate);

    return this.socialMediaService.create(dataToCreate);
  }

  @ApiOperation({ summary: '获取所有社交媒体（管理员）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Get('admin')
  findAll() {
    return this.socialMediaService.findAll();
  }

  @ApiOperation({ summary: '获取启用的社交媒体（前端用户）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Get('active')
  findActive() {
    return this.socialMediaService.findActive();
  }

  @ApiOperation({ summary: '获取单个社交媒体' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.socialMediaService.findOne(id);
  }

  @ApiOperation({ summary: '更新社交媒体' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'qrCode', maxCount: 1 }
  ], multerConfig))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSocialMediaDto: UpdateSocialMediaDto,
    @UploadedFiles() files: { logo?: Express.Multer.File[], qrCode?: Express.Multer.File[] }
  ) {
    const updateData = { ...updateSocialMediaDto };

    if (files.logo) {
      updateData.logoUrl = `/uploads/social-media/${files.logo[0].filename}`;
    }

    if (files.qrCode) {
      updateData.qrCodeUrl = `/uploads/social-media/${files.qrCode[0].filename}`;
    }

    return this.socialMediaService.update(id, updateData);
  }

  @ApiOperation({ summary: '删除社交媒体' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.socialMediaService.remove(id);
  }

  @ApiOperation({ summary: '更新排序顺序' })
  @ApiResponse({ status: 200, description: '排序更新成功' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Post('sort')
  updateSortOrder(@Body() items: { id: number; sortOrder: number }[]) {
    return this.socialMediaService.updateSortOrder(items);
  }
} 