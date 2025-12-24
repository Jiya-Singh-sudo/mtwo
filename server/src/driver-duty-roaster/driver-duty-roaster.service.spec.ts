import { Test, TestingModule } from '@nestjs/testing';
import { DriverDutyRoasterService } from './driver-duty-roaster.service';

describe('DriverDutyRoasterService', () => {
  let service: DriverDutyRoasterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DriverDutyRoasterService],
    }).compile();

    service = module.get<DriverDutyRoasterService>(DriverDutyRoasterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
