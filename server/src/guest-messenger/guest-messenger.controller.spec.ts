import { Test, TestingModule } from '@nestjs/testing';
import { GuestMessengerController } from './guest-messenger.controller';

describe('GuestMessengerController', () => {
  let controller: GuestMessengerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestMessengerController],
    }).compile();

    controller = module.get<GuestMessengerController>(GuestMessengerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
