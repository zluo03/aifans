import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NoteCategoriesService } from '../../note-categories/note-categories.service';
import { CreateNoteCategoryDto, UpdateNoteCategoryDto } from '../../note-categories/dto';
import { Role } from '../../types/prisma-enums';

@ApiTags('管理员-笔记分类')
@Controller('admin/note-categories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class NoteCategoriesController {
  constructor(private readonly noteCategoriesService: NoteCategoriesService) {}

  @ApiOperation({ summary: '创建笔记分类' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误或分类名已存在' })
  @Post()
  create(@Body() createNoteCategoryDto: CreateNoteCategoryDto) {
    return this.noteCategoriesService.create(createNoteCategoryDto);
  }

  @ApiOperation({ summary: '获取所有笔记分类' })
  @ApiResponse({ status: 200, description: '成功' })
  @Get()
  findAll() {
    return this.noteCategoriesService.findAll();
  }

  @ApiOperation({ summary: '获取特定笔记分类' })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noteCategoriesService.findOne(+id);
  }

  @ApiOperation({ summary: '更新笔记分类' })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误或分类名已存在' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNoteCategoryDto: UpdateNoteCategoryDto,
  ) {
    return this.noteCategoriesService.update(+id, updateNoteCategoryDto);
  }

  @ApiOperation({ summary: '删除笔记分类' })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noteCategoriesService.remove(+id);
  }
}
