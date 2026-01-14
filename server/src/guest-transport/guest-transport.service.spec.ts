import { Test, TestingModule } from '@nestjs/testing';
import { GuestTransportService } from './guest-transport.service';

describe('GuestTransportService', () => {
  let service: GuestTransportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestTransportService],
    }).compile();

    service = module.get<GuestTransportService>(GuestTransportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
