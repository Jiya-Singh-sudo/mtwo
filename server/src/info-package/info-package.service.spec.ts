import { Test, TestingModule } from '@nestjs/testing';
import { InfoPackageService } from './info-package.service';

describe('InfoPackageService', () => {
  let service: InfoPackageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfoPackageService],
    }).compile();

    service = module.get<InfoPackageService>(InfoPackageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
