import { Test, TestingModule } from '@nestjs/testing';
import { DesginationController } from './designation.controller';

describe('DesginationController', () => {
  let controller: DesginationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DesginationController],
    }).compile();

    controller = module.get<DesginationController>(DesginationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
