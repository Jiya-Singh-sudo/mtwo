import { Test, TestingModule } from '@nestjs/testing';
import { GuestTransportController } from './guest-transport.controller';

describe('GuestTransportController', () => {
  let controller: GuestTransportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestTransportController],
    }).compile();

    controller = module.get<GuestTransportController>(GuestTransportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
