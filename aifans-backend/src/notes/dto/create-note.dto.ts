import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional, IsEnum, Min } from 'class-validator';
import { NoteStatus } from '../../types';

export class CreateNoteDto {
  @ApiProperty({
    description: '笔记标题',
    example: '如何使用Midjourney生成精美图片',
  })
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString({ message: '标题必须是字符串' })
  title: string;

  @ApiProperty({
    description: '笔记内容（可以是HTML字符串或JSON对象）',
    example: '<p>这是一段HTML内容</p>',
  })
  @IsNotEmpty({ message: '内容不能为空' })
  content: any; // 支持字符串或对象

  @ApiProperty({
    description: '笔记分类ID',
    example: 1,
  })
  @IsInt({ message: '分类ID必须是整数' })
  @Min(1, { message: '分类ID必须大于0' })
  categoryId: number;

  @ApiProperty({
    description: '封面图片URL',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '封面图片URL必须是字符串' })
  coverImageUrl?: string;

  @ApiProperty({
    description: '笔记状态',
    enum: NoteStatus,
    default: NoteStatus.VISIBLE,
    required: false,
  })
  @IsOptional()
  @IsEnum(NoteStatus, { message: '状态必须是有效的NoteStatus枚举值' })
  status?: NoteStatus;
} 