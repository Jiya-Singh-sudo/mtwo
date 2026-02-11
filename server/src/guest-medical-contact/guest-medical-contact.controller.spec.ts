import { Test, TestingModule } from '@nestjs/testing';
import { GuestMedicalContactController } from './guest-medical-contact.controller';

describe('GuestMedicalContactController', () => {
  let controller: GuestMedicalContactController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestMedicalContactController],
    }).compile();

    controller = module.get<GuestMedicalContactController>(GuestMedicalContactController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
