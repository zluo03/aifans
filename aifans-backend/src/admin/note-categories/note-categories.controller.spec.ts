import { Test, TestingModule } from '@nestjs/testing';
import { NoteCategoriesController } from './note-categories.controller';

describe('NoteCategoriesController', () => {
  let controller: NoteCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoteCategoriesController],
    }).compile();

    controller = module.get<NoteCategoriesController>(NoteCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
