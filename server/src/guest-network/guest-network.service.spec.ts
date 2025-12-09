import { Test, TestingModule } from '@nestjs/testing';
import { GuestNetworkService } from './guest-network.service';

describe('GuestNetworkService', () => {
  let service: GuestNetworkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestNetworkService],
    }).compile();

    service = module.get<GuestNetworkService>(GuestNetworkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
