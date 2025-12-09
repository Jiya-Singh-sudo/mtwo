import { Test, TestingModule } from '@nestjs/testing';
import { GuestInoutController } from './guest-inout.controller';

describe('GuestInoutController', () => {
  let controller: GuestInoutController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestInoutController],
    }).compile();

    controller = module.get<GuestInoutController>(GuestInoutController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
