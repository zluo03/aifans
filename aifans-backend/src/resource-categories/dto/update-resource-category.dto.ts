import { PartialType } from '@nestjs/mapped-types';
import { CreateResourceCategoryDto } from './create-resource-category.dto';

export class UpdateResourceCategoryDto extends PartialType(CreateResourceCategoryDto) {} 