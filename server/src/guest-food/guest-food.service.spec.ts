import { Test, TestingModule } from '@nestjs/testing';
import { GuestFoodService } from './guest-food.service';

describe('GuestFoodService', () => {
  let service: GuestFoodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestFoodService],
    }).compile();

    service = module.get<GuestFoodService>(GuestFoodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
