import { Controller, Get, Post, Body, Delete, Param, UseGuards, Req, ParseIntPipe, UseInterceptors, UploadedFiles, BadRequestException, Query, DefaultValuePipe } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ScreeningsService } from '../../screenings/screenings.service';
import { CreateScreeningDto } from '../../screenings/dto/create-screening.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { Role } from '../../types/prisma-enums';

@ApiTags('admin-screenings')
@Controller('admin/screenings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class ScreeningsController {
  constructor(private readonly screeningsService: ScreeningsService) {}

  @Get()
  @ApiOperation({ summary: '管理员获取影院列表' })
  @ApiResponse({ status: 200, description: '返回影院列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'search', required: false, type: String, description: '搜索关键词' })
  @ApiQuery({ name: 'orderBy', required: false, type: String, description: '排序方式' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    return this.screeningsService.findAllScreenings(page, limit, search, orderBy);
  }

  @Post()
  @ApiOperation({ summary: '管理员上传放映视频' })
  @ApiResponse({ status: 201, description: '返回上传的放映视频详情' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '放映标题' },
        description: { type: 'string', description: '放映描述(可选)' },
        video: { type: 'string', format: 'binary', description: '视频文件' },
        thumbnail: { type: 'string', format: 'binary', description: '缩略图(可选)' },
      },
      required: ['title', 'video'],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/screenings',
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (file.fieldname === 'video') {
            if (!file.mimetype.includes('video/')) {
              return cb(new BadRequestException('请上传有效的视频文件'), false);
            }
          } else if (file.fieldname === 'thumbnail') {
            if (!file.mimetype.includes('image/')) {
              return cb(new BadRequestException('请上传有效的图片作为缩略图'), false);
            }
          }
          cb(null, true);
        },
      }
    )
  )
  async create(
    @Body() createScreeningDto: CreateScreeningDto,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    @Req() req: RequestWithUser,
  ) {
    if (!files.video || files.video.length === 0) {
      throw new BadRequestException('请上传视频文件');
    }

    const videoFile = files.video[0];
    const thumbnailFile = files.thumbnail && files.thumbnail.length > 0 ? files.thumbnail[0] : null;

    const videoUrl = `${req.protocol}://${req.get('host')}/uploads/screenings/${videoFile.filename}`;
    const thumbnailUrl = thumbnailFile
      ? `${req.protocol}://${req.get('host')}/uploads/screenings/${thumbnailFile.filename}`
      : undefined;

    const userId = req.user.id;
    return this.screeningsService.createScreening(userId, createScreeningDto, videoUrl, thumbnailUrl);
  }

  @Get(':id')
  @ApiOperation({ summary: '管理员获取单个影片详情' })
  @ApiResponse({ status: 200, description: '返回影片详情' })
  @ApiResponse({ status: 404, description: '影片不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.screeningsService.findOneScreening(id);
  }

  @Post(':id')
  @ApiOperation({ summary: '管理员更新影片' })
  @ApiResponse({ status: 200, description: '返回更新后的影片详情' })
  @ApiResponse({ status: 404, description: '影片不存在' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '放映标题' },
        description: { type: 'string', description: '放映描述(可选)' },
        video: { type: 'string', format: 'binary', description: '视频文件(可选)' },
        thumbnail: { type: 'string', format: 'binary', description: '缩略图(可选)' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/screenings',
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (file.fieldname === 'video') {
            if (!file.mimetype.includes('video/')) {
              return cb(new BadRequestException('请上传有效的视频文件'), false);
            }
          } else if (file.fieldname === 'thumbnail') {
            if (!file.mimetype.includes('image/')) {
              return cb(new BadRequestException('请上传有效的图片作为缩略图'), false);
            }
          }
          cb(null, true);
        },
      }
    )
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateScreeningDto: Partial<CreateScreeningDto>,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    @Req() req: RequestWithUser,
  ) {
    const videoFile = files.video && files.video.length > 0 ? files.video[0] : null;
    const thumbnailFile = files.thumbnail && files.thumbnail.length > 0 ? files.thumbnail[0] : null;

    let videoUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    if (videoFile) {
      videoUrl = `${req.protocol}://${req.get('host')}/uploads/screenings/${videoFile.filename}`;
    }

    if (thumbnailFile) {
      thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/screenings/${thumbnailFile.filename}`;
    }

    const userId = req.user.id;
    return this.screeningsService.updateScreening(userId, id, updateScreeningDto, videoUrl, thumbnailUrl);
  }

  @Delete(':id')
  @ApiOperation({ summary: '管理员删除放映视频' })
  @ApiResponse({ status: 200, description: '返回成功信息' })
  @ApiResponse({ status: 404, description: '放映不存在' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.screeningsService.deleteScreening(userId, id);
  }
}
