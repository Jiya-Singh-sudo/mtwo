import { resolveGuestSummaryReportCode } from "../resolvers/guest-report.resolver";
import { GuestReportEngine } from "../engines/guest.engine";
import { exportGuestSummaryExcel } from "../exporters/guest.excel.exporter";
import { resolveRoomSummaryReportCode } from "../resolvers/room-report.resolver";
import { RoomReportEngine } from "../engines/room.engine";
import { exportRoomOccupancyExcel } from "../exporters/room.excel.exporter";
import { resolveVehicleDriverReportCode } from "../resolvers/vehicle-driver-report.resolver";
import { VehicleDriverReportEngine } from "../engines/vehicle-driver.engine";
import { exportVehicleDriverExcel } from "../exporters/vehicle-driver.excel.exporter";
import { resolveDriverDutyReportCode } from "../resolvers/driver-duty-report.resolver";
import { DriverDutyReportEngine } from "../engines/driver-duty.engine";
import { exportDriverDutyExcel } from "../exporters/driver-duty.excel.exporter";
import { resolveFoodServiceReportCode } from "../resolvers/food-service-report.resolver";
import { FoodServiceReportEngine } from "../engines/food-service.engine";
import { exportFoodServiceExcel } from "../exporters/food-service.excel.exporter";
import { resolveNetworkReportCode } from "../resolvers/network-report.resolver";
import { NetworkReportEngine } from "../engines/network.engine";
import { exportNetworkExcel } from "../exporters/network.excel.exporter";

export const SectionRegistry = {
    guest: {
        resolveCode: resolveGuestSummaryReportCode,
        engine: GuestReportEngine,
        excelExporter: exportGuestSummaryExcel,
        templateFolder: 'guest-summary',
    },

    room: {
        resolveCode: resolveRoomSummaryReportCode,
        engine: RoomReportEngine,
        excelExporter: exportRoomOccupancyExcel,
        templateFolder: 'room',
    },

    vehicle: {
        resolveCode: resolveVehicleDriverReportCode,
        engine: VehicleDriverReportEngine,
        excelExporter: exportVehicleDriverExcel,
        templateFolder: 'vehicle-driver',
    },

    'driver-duty': {
        resolveCode: resolveDriverDutyReportCode,
        engine: DriverDutyReportEngine,
        excelExporter: exportDriverDutyExcel,
        templateFolder: 'driver-duty',
    },

    food: {
        resolveCode: resolveFoodServiceReportCode,
        engine: FoodServiceReportEngine,
        excelExporter: exportFoodServiceExcel,
        templateFolder: 'food-service',
    },

    network: {
        resolveCode: resolveNetworkReportCode,
        engine: NetworkReportEngine,
        excelExporter: exportNetworkExcel,
        templateFolder: 'network',
    },
};
