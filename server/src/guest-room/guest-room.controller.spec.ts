import { Test, TestingModule } from '@nestjs/testing';
import { GuestRoomController } from './guest-room.controller';

describe('GuestRoomController', () => {
  let controller: GuestRoomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestRoomController],
    }).compile();

    controller = module.get<GuestRoomController>(GuestRoomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
