import { Test, TestingModule } from '@nestjs/testing';
import { MessengersService } from './messengers.service';

describe('MessengersService', () => {
  let service: MessengersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessengersService],
    }).compile();

    service = module.get<MessengersService>(MessengersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
