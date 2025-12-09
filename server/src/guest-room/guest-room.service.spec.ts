import { Test, TestingModule } from '@nestjs/testing';
import { GuestRoomService } from './guest-room.service';

describe('GuestRoomService', () => {
  let service: GuestRoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestRoomService],
    }).compile();

    service = module.get<GuestRoomService>(GuestRoomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
