import { Test, TestingModule } from '@nestjs/testing';
import { ButlersController } from './butlers.controller';

describe('ButlersController', () => {
  let controller: ButlersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ButlersController],
    }).compile();

    controller = module.get<ButlersController>(ButlersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
