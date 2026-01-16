import { Test, TestingModule } from '@nestjs/testing';
import { NetworkMngService } from './network-mng.service';

describe('NetworkMngService', () => {
  let service: NetworkMngService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NetworkMngService],
    }).compile();

    service = module.get<NetworkMngService>(NetworkMngService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
