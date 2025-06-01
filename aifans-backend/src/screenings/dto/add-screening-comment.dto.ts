import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddScreeningCommentDto {
  @ApiProperty({ description: '评论内容/弹幕内容' })
  @IsNotEmpty({ message: '评论内容不能为空' })
  @IsString({ message: '评论内容必须是字符串' })
  content: string;
} 