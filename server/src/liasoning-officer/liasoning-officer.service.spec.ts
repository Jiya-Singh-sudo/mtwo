import { Test, TestingModule } from '@nestjs/testing';
import { LiasoningOfficerService } from './liasoning-officer.service';

describe('LiasoningOfficerService', () => {
  let service: LiasoningOfficerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LiasoningOfficerService],
    }).compile();

    service = module.get<LiasoningOfficerService>(LiasoningOfficerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
