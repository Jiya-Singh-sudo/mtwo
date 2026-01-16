import { Test, TestingModule } from '@nestjs/testing';
import { InfoPackageController } from './info-package.controller';

describe('InfoPackageController', () => {
  let controller: InfoPackageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InfoPackageController],
    }).compile();

    controller = module.get<InfoPackageController>(InfoPackageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
