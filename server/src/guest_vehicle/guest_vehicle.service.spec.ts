import { Test, TestingModule } from '@nestjs/testing';
import { GuestVehicleService } from './guest_vehicle.service';

describe('GuestVehicleService', () => {
  let service: GuestVehicleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestVehicleService],
    }).compile();

    service = module.get<GuestVehicleService>(GuestVehicleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
