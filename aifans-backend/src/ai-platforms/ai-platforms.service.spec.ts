import { Test, TestingModule } from '@nestjs/testing';
import { AiPlatformsService } from './ai-platforms.service';

describe('AiPlatformsService', () => {
  let service: AiPlatformsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiPlatformsService],
    }).compile();

    service = module.get<AiPlatformsService>(AiPlatformsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
