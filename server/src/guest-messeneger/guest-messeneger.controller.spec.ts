import { Test, TestingModule } from '@nestjs/testing';
import { GuestMessenegerController } from './guest-messeneger.controller';

describe('GuestMessenegerController', () => {
  let controller: GuestMessenegerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestMessenegerController],
    }).compile();

    controller = module.get<GuestMessenegerController>(GuestMessenegerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
