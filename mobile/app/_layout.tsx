import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

export const unstable_settings = {
  anchor: '(drawer)',
};

function InitialLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to the login page if the user is not authenticated
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to the home page if the user is authenticated
      router.replace('/(drawer)');
    }
  }, [isAuthenticated, segments, navigationState, isLoading]);

  return (
    <Stack>
      <Stack.Screen name="(auth)/login/index" options={{ headerShown: false }} />
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)/guest/GuestManagementScreen" options={{ title: 'Guest Management', headerShown: false }} />
      <Stack.Screen name="(app)/activity/ActivityLogScreen" options={{ title: 'Activity Log', headerShown: false }} />
      <Stack.Screen name="(app)/user/UserManagementScreen" options={{ title: 'User Management', headerShown: false }} />
      <Stack.Screen name="(app)/room/RoomManagementScreen" options={{ title: 'Room Management', headerShown: false }} />
      <Stack.Screen name="(app)/transport/TransportScreen" options={{ title: 'Transport', headerShown: false }} />
      <Stack.Screen name="(app)/food/FoodServiceScreen" options={{ title: 'Food Service', headerShown: false }} />
      <Stack.Screen name="(app)/vehicle/VehicleScreen" options={{ title: 'Vehicle Management', headerShown: false }} />
      <Stack.Screen name="(app)/network/NetworkScreen" options={{ title: 'Network Management', headerShown: false }} />
      <Stack.Screen name="(app)/driver-duty/DriverDutyScreen" options={{ title: 'Driver Duty Roster', headerShown: false }} />
      <Stack.Screen name="(app)/duty/DutyRosterScreen" options={{ title: 'Duty Roster', headerShown: false }} />
      <Stack.Screen name="(app)/report/ReportScreen" options={{ title: 'Reports', headerShown: false }} />
      <Stack.Screen name="(app)/info-package/InfoPackageScreen" options={{ title: 'Info Package', headerShown: false }} />
      <Stack.Screen name="(app)/notification/NotificationScreen" options={{ title: 'Notifications', headerShown: false }} />
      <Stack.Screen name="(app)/settings/SystemSettingsScreen" options={{ title: 'System Settings', headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <InitialLayout />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
