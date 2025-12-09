import { Test, TestingModule } from '@nestjs/testing';
import { GuestDriverService } from './guest-driver.service';

describe('GuestDriverService', () => {
  let service: GuestDriverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestDriverService],
    }).compile();

    service = module.get<GuestDriverService>(GuestDriverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
