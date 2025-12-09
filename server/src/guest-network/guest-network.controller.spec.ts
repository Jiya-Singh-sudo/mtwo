import { Test, TestingModule } from '@nestjs/testing';
import { GuestNetworkController } from './guest-network.controller';

describe('GuestNetworkController', () => {
  let controller: GuestNetworkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestNetworkController],
    }).compile();

    controller = module.get<GuestNetworkController>(GuestNetworkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
