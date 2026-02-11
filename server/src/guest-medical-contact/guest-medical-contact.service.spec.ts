import { Test, TestingModule } from '@nestjs/testing';
import { GuestMedicalContactService } from './guest-medical-contact.service';

describe('GuestMedicalContactService', () => {
  let service: GuestMedicalContactService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestMedicalContactService],
    }).compile();

    service = module.get<GuestMedicalContactService>(GuestMedicalContactService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
