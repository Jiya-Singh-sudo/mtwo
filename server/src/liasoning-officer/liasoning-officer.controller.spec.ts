import { Test, TestingModule } from '@nestjs/testing';
import { LiasoningOfficerController } from './liasoning-officer.controller';

describe('LiasoningOfficerController', () => {
  let controller: LiasoningOfficerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LiasoningOfficerController],
    }).compile();

    controller = module.get<LiasoningOfficerController>(LiasoningOfficerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
