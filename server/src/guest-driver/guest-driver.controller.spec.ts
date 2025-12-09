import { Test, TestingModule } from '@nestjs/testing';
import { GuestDriverController } from './guest-driver.controller';

describe('GuestDriverController', () => {
  let controller: GuestDriverController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestDriverController],
    }).compile();

    controller = module.get<GuestDriverController>(GuestDriverController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
