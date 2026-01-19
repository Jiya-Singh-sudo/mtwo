import { Test, TestingModule } from '@nestjs/testing';
import { ReportsPkgController } from './reports-pkg.controller';

describe('ReportsPkgController', () => {
  let controller: ReportsPkgController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsPkgController],
    }).compile();

    controller = module.get<ReportsPkgController>(ReportsPkgController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
