import { Test, TestingModule } from '@nestjs/testing';
import { NetworkMngController } from './network-mng.controller';

describe('NetworkMngController', () => {
  let controller: NetworkMngController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NetworkMngController],
    }).compile();

    controller = module.get<NetworkMngController>(NetworkMngController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
