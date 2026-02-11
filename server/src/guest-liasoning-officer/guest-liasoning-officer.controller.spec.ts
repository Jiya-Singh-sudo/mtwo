import { Test, TestingModule } from '@nestjs/testing';
import { GuestLiasoningOfficerController } from './guest-liasoning-officer.controller';

describe('GuestLiasoningOfficerController', () => {
  let controller: GuestLiasoningOfficerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestLiasoningOfficerController],
    }).compile();

    controller = module.get<GuestLiasoningOfficerController>(GuestLiasoningOfficerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
