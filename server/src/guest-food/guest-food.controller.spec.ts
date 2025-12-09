import { Test, TestingModule } from '@nestjs/testing';
import { GuestFoodController } from './guest-food.controller';

describe('GuestFoodController', () => {
  let controller: GuestFoodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestFoodController],
    }).compile();

    controller = module.get<GuestFoodController>(GuestFoodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
