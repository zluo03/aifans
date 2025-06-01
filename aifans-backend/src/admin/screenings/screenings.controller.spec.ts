import { Test, TestingModule } from '@nestjs/testing';
import { ScreeningsController } from './screenings.controller';

describe('ScreeningsController', () => {
  let controller: ScreeningsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScreeningsController],
    }).compile();

    controller = module.get<ScreeningsController>(ScreeningsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
