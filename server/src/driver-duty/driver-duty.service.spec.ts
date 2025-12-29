import { Test, TestingModule } from '@nestjs/testing';
import { DriverDutyService } from './driver-duty.service';

describe('DriverDutyService', () => {
  let service: DriverDutyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DriverDutyService],
    }).compile();

    service = module.get<DriverDutyService>(DriverDutyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
