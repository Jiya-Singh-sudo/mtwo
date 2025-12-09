import { Test, TestingModule } from '@nestjs/testing';
import { GuestHousekeepingService } from './guest-housekeeping.service';

describe('GuestHousekeepingService', () => {
  let service: GuestHousekeepingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestHousekeepingService],
    }).compile();

    service = module.get<GuestHousekeepingService>(GuestHousekeepingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
