import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../gaurds/jwt/jwt.guard';
import { PermissionsGuard } from '../gaurds/permissions/permissions.guard';
import { Permissions } from '../decorators/permissions/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('vehicle.view')
@Controller('vehicles')
describe('VehiclesController', () => {
  let controller: VehiclesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
