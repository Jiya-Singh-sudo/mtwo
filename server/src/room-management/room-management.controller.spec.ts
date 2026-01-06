import { Test, TestingModule } from '@nestjs/testing';
import { RoomManagementController } from './room-management.controller';

describe('RoomManagementController', () => {
  let controller: RoomManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomManagementController],
    }).compile();

    controller = module.get<RoomManagementController>(RoomManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
