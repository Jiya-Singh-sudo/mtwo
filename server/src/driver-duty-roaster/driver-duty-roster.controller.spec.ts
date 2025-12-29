import { Test, TestingModule } from '@nestjs/testing';
import { DriverDutyRoasterController } from './driver-duty-roster.controller';

describe('DriverDutyRoasterController', () => {
  let controller: DriverDutyRoasterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverDutyRoasterController],
    }).compile();

    controller = module.get<DriverDutyRoasterController>(DriverDutyRoasterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
