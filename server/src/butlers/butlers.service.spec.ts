import { Test, TestingModule } from '@nestjs/testing';
import { ButlersService } from './butlers.service';

describe('ButlersService', () => {
  let service: ButlersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ButlersService],
    }).compile();

    service = module.get<ButlersService>(ButlersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
