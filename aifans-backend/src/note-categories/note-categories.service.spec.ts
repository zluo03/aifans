import { Test, TestingModule } from '@nestjs/testing';
import { NoteCategoriesService } from './note-categories.service';

describe('NoteCategoriesService', () => {
  let service: NoteCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NoteCategoriesService],
    }).compile();

    service = module.get<NoteCategoriesService>(NoteCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
