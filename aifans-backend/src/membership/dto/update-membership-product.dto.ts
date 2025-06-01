import { PartialType } from '@nestjs/mapped-types';
import { CreateMembershipProductDto } from './create-membership-product.dto';

export class UpdateMembershipProductDto extends PartialType(CreateMembershipProductDto) {} 