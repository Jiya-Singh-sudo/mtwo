import { Test, TestingModule } from '@nestjs/testing';
import { GuestMessenegerService } from './guest-messeneger.service';

describe('GuestMessenegerService', () => {
  let service: GuestMessenegerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestMessenegerService],
    }).compile();

    service = module.get<GuestMessenegerService>(GuestMessenegerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
