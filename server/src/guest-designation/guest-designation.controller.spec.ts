import { Test, TestingModule } from '@nestjs/testing';
import { GuestDesignationController } from './guest-designation.controller';

describe('GuestDesignationController', () => {
  let controller: GuestDesignationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestDesignationController],
    }).compile();

    controller = module.get<GuestDesignationController>(GuestDesignationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
