import { Test, TestingModule } from '@nestjs/testing';
import { GuestHousekeepingController } from './guest-housekeeping.controller';

describe('GuestHousekeepingController', () => {
  let controller: GuestHousekeepingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestHousekeepingController],
    }).compile();

    controller = module.get<GuestHousekeepingController>(GuestHousekeepingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
