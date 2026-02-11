import { Test, TestingModule } from '@nestjs/testing';
import { MedicalEmergencyServiceController } from './medical-emergency-service.controller';

describe('MedicalEmergencyServiceController', () => {
  let controller: MedicalEmergencyServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalEmergencyServiceController],
    }).compile();

    controller = module.get<MedicalEmergencyServiceController>(MedicalEmergencyServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
