import { Test, TestingModule } from '@nestjs/testing';
import { ReportsPkgService } from './reports-pkg.service';

describe('ReportsPkgService', () => {
  let service: ReportsPkgService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsPkgService],
    }).compile();

    service = module.get<ReportsPkgService>(ReportsPkgService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
