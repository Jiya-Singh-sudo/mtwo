import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { RolesModule } from './roles/roles.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { GuestsModule } from './guests/guests.module';
import { DriversModule } from './drivers/drivers.module';
import { MealsModule } from './meals/meals.module';
import { RoomsModule } from './rooms/rooms.module';
import { ButlersModule } from './butlers/butlers.module';
import { NetworksModule } from './networks/networks.module';
import { DesginationModule } from './desgination/designation.module';
import { HousekeepingModule } from './housekeeping/housekeeping.module';
import { UsersModule } from './users/users.module';
import { GuestDriverModule } from './guest-driver/guest-driver.module';
import { GuestButlerModule } from './guest-butler/guest-butler.module';
import { GuestInoutModule } from './guest-inout/guest-inout.module';
import { GuestFoodModule } from './guest-food/guest-food.module';
import { GuestRoomModule } from './guest-room/guest-room.module';
import { GuestNetworkModule } from './guest-network/guest-network.module';
import { GuestHousekeepingModule } from './guest-housekeeping/guest-housekeeping.module';
import { GuestDesignationModule } from './guest-designation/guest-designation.module';
import { AuthModule } from './auth/auth.module';
import { GuestVehicleModule } from './guest_vehicle/guest_vehicle.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { DriverDutyModule } from './driver-duty/driver-duty.module';
import { RoomManagementModule } from './room-management/room-management.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { GuestTransportModule } from './guest-transport/guest-transport.module';
import { MessengersModule } from './messengers/messengers.module';
import { GuestMessenegerModule } from './guest-messeneger/guest-messeneger.module';
import { InfoPackageModule } from './info-package/info-package.module';
import { ReportsPkgModule } from './reports-pkg/reports-pkg.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolePermissionModule } from './role-permission/role-permission.module';
import { ThrottlerModule } from '@nestjs/throttler';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,        // time window in seconds
        limit: 100,     // global fallback
      },
    ]),
    DatabaseModule,
    RolesModule,
    VehiclesModule,
    GuestsModule,
    DriversModule,
    MealsModule,
    RoomsModule,
    ButlersModule,
    NetworksModule,
    DesginationModule,
    HousekeepingModule,
    UsersModule,
    GuestDriverModule,
    GuestButlerModule,
    GuestInoutModule,
    GuestFoodModule,
    GuestRoomModule,
    GuestNetworkModule,
    GuestHousekeepingModule,
    GuestDesignationModule,
    AuthModule,
    GuestVehicleModule,
    DashboardModule,
    DocumentsModule,
    DriverDutyModule,
    RoomManagementModule,
    ActivityLogModule,
    GuestTransportModule,
    MessengersModule,
    GuestMessenegerModule,
    InfoPackageModule,
    ReportsPkgModule,
    PermissionsModule,
    RolePermissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
