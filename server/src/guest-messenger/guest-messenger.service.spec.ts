import { Test, TestingModule } from '@nestjs/testing';
import { GuestMessengerService } from './guest-messenger.service';

describe('GuestMessengerService', () => {
  let service: GuestMessengerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestMessengerService],
    }).compile();

    service = module.get<GuestMessengerService>(GuestMessengerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
