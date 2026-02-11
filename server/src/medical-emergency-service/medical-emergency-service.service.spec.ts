import { Test, TestingModule } from '@nestjs/testing';
import { MedicalEmergencyServiceService } from './medical-emergency-service.service';

describe('MedicalEmergencyServiceService', () => {
  let service: MedicalEmergencyServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicalEmergencyServiceService],
    }).compile();

    service = module.get<MedicalEmergencyServiceService>(MedicalEmergencyServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
