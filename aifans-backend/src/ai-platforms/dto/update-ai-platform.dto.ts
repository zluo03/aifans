import { PartialType } from '@nestjs/swagger';
import { CreateAIPlatformDto } from './create-ai-platform.dto';

export class UpdateAIPlatformDto extends PartialType(CreateAIPlatformDto) {} 