import { Test, TestingModule } from '@nestjs/testing';
import { GuestDesignationService } from './guest-designation.service';

describe('GuestDesignationService', () => {
  let service: GuestDesignationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestDesignationService],
    }).compile();

    service = module.get<GuestDesignationService>(GuestDesignationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
