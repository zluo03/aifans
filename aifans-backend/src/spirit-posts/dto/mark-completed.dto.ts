import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkCompletedDto {
  @ApiProperty({ description: '认领者用户ID列表', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  claimerIds: number[];
} 