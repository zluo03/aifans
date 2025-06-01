import { Test, TestingModule } from '@nestjs/testing';
import { AiPlatformsController } from './ai-platforms.controller';

describe('AiPlatformsController', () => {
  let controller: AiPlatformsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiPlatformsController],
    }).compile();

    controller = module.get<AiPlatformsController>(AiPlatformsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
