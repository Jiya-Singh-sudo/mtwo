// src/driver-duty-roaster/dto/update-driver-duty-roaster.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverDutyDto } from './createDriverDuty.dto';

export class UpdateDriverDutyDto extends PartialType(CreateDriverDutyDto) {}
