import { Test, TestingModule } from '@nestjs/testing';
import { DriverDutyController } from './driver-duty.controller';

describe('DriverDutyController', () => {
  let controller: DriverDutyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverDutyController],
    }).compile();

    controller = module.get<DriverDutyController>(DriverDutyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
