import { Test, TestingModule } from '@nestjs/testing';
import { GuestLiasoningOfficerService } from './guest-liasoning-officer.service';

describe('GuestLiasoningOfficerService', () => {
  let service: GuestLiasoningOfficerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestLiasoningOfficerService],
    }).compile();

    service = module.get<GuestLiasoningOfficerService>(GuestLiasoningOfficerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
