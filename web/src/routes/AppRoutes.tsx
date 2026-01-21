import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

// Public
import LoginPage from '@/components/LoginPage/Page';

// Dashboard
import { DashboardStats } from '@/components/modules/DashboardStats/Page';

// Modules
import GuestManagement from '@/components/modules/GuestManagement/Page';
import RoomManagement from '@/components/modules/RoomManagement/page';
import { VehicleManagement } from '@/components/modules/VehicleManagement/Page';
import DutyRoster from '@/components/modules/DutyRoaster/Page';
import DriverDutyRoaster from '@/components/modules/DriverDutyRoaster/Page';
import InfoPackage from '@/components/modules/InfoPackage/Page';
import { Notifications } from '@/components/modules/Notification/Page';
import { Reports } from '@/components/modules/Report/Page';
import UserManagement from '@/components/modules/UserManagement/Page';
import { SystemSettings } from '@/components/modules/SystemSettings/Page';
import GuestTransportManagement from '@/components/modules/GuestTransportManagement/Page';
import FoodService from '@/components/modules/FoodService/Page';
import ActivityLogPage from '@/components/modules/ActivityLog/Page';
import NetworkManagement from '@/components/modules/NetworkManagement/Page';

// Common
import Unauthorized from '@/components/common/Unauthorized';

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Default */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardStats />
                    </ProtectedRoute>
                }
            />

            {/* Modules */}
            <Route
                path="/guest-management"
                element={
                    <ProtectedRoute permission="guest.view">
                        <GuestManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/room-management"
                element={
                    <ProtectedRoute permission="room.view">
                        <RoomManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/vehicle-management"
                element={
                    <ProtectedRoute permission="vehicle.view">
                        <VehicleManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/duty-roster"
                element={
                    <ProtectedRoute permission="duty.view">
                        <DutyRoster />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/driver-duty-roaster"
                element={
                    <ProtectedRoute permission="driver.view">
                        <DriverDutyRoaster />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/network-management"
                element={
                    <ProtectedRoute permission="network.view">
                        <NetworkManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/info-package"
                element={
                    <ProtectedRoute permission="info.view">
                        <InfoPackage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/notifications"
                element={
                    <ProtectedRoute permission="notification.view">
                        <Notifications />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/reports"
                element={
                    <ProtectedRoute permission="report.view">
                        <Reports />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/user-management"
                element={
                    <ProtectedRoute permission="user.view">
                        <UserManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings"
                element={
                    <ProtectedRoute permission="settings.view">
                        <SystemSettings />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/guest-transport-management"
                element={
                    <ProtectedRoute permission="transport.view">
                        <GuestTransportManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/food-service"
                element={
                    <ProtectedRoute permission="food.view">
                        <FoodService />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/activity-log"
                element={
                    <ProtectedRoute permission="audit.view">
                        <ActivityLogPage />
                    </ProtectedRoute>
                }
            />

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}
