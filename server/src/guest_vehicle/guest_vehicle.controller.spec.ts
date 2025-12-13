import { Test, TestingModule } from '@nestjs/testing';
import { GuestVehicleController } from './guest_vehicle.controller';

describe('GuestVehicleController', () => {
  let controller: GuestVehicleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestVehicleController],
    }).compile();

    controller = module.get<GuestVehicleController>(GuestVehicleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
