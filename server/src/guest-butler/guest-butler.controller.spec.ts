import { Test, TestingModule } from '@nestjs/testing';
import { GuestButlerController } from './guest-butler.controller';

describe('GuestButlerController', () => {
  let controller: GuestButlerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestButlerController],
    }).compile();

    controller = module.get<GuestButlerController>(GuestButlerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
