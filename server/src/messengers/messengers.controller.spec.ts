import { Test, TestingModule } from '@nestjs/testing';
import { MessengersController } from './messengers.controller';

describe('MessengersController', () => {
  let controller: MessengersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessengersController],
    }).compile();

    controller = module.get<MessengersController>(MessengersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
