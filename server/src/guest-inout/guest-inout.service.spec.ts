import { Test, TestingModule } from '@nestjs/testing';
import { GuestInoutService } from './guest-inout.service';

describe('GuestInoutService', () => {
  let service: GuestInoutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestInoutService],
    }).compile();

    service = module.get<GuestInoutService>(GuestInoutService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
