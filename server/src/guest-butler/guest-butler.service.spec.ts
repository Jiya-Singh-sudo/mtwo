import { Test, TestingModule } from '@nestjs/testing';
import { GuestButlerService } from './guest-butler.service';

describe('GuestButlerService', () => {
  let service: GuestButlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestButlerService],
    }).compile();

    service = module.get<GuestButlerService>(GuestButlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
