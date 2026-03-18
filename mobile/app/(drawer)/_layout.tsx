import { withLayoutContext } from "expo-router";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { Text, View } from 'react-native';

const { Navigator } = createDrawerNavigator();
const Drawer = withLayoutContext(Navigator);

console.log('Drawer component type:', typeof Drawer);
console.log('Drawer.Screen component type:', typeof Drawer.Screen);

export default function DrawerLayout() {
  const { hasPermission } = useAuth();

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '700',
        },
        drawerStyle: {
          backgroundColor: colors.primary,
          width: 280,
        },
        drawerActiveBackgroundColor: colors.accent,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.white,
        drawerLabelStyle: {
          fontWeight: '600',
          marginLeft: -10,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Dashboard",
          drawerLabel: "Dashboard",
          drawerIcon: ({ color }: { color: string }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="guest"
        options={{
          title: "Guest Management",
          drawerLabel: "Guest Management",
          drawerIcon: ({ color }: { color: string }) => (
            <Ionicons name="people-outline" size={22} color={color} />
          ),
          drawerItemStyle: { display: hasPermission('guest.view') ? 'flex' : 'none' }
        }}
      />

      <Drawer.Screen
        name="room"
        options={{
          title: "Room Management",
          drawerLabel: "Room Management",
          drawerIcon: ({ color }: { color: string }) => (
            <Ionicons name="business-outline" size={22} color={color} />
          ),
          drawerItemStyle: { display: hasPermission('room.view') ? 'flex' : 'none' }
        }}
      />

      <Drawer.Screen
        name="transport"
        options={{
          title: "Transport Management",
          drawerLabel: "Transport Management",
          drawerIcon: ({ color }: { color: string }) => (
            <Ionicons name="car-outline" size={22} color={color} />
          ),
          drawerItemStyle: { display: hasPermission('transport.view') ? 'flex' : 'none' }
        }}
      />

      <Drawer.Screen
        name="driver-duty"
        options={{
          title: "Driver Duty",
          drawerLabel: "Driver Duty",
          drawerIcon: ({ color }: { color: string }) => (
            <Ionicons name="calendar-outline" size={22} color={color} />
          ),
          drawerItemStyle: { display: hasPermission('transport.view') ? 'flex' : 'none' }
        }}
      />

      <Drawer.Screen
        name="food"
        options={{
          title: "Food Service",
          drawerLabel: "Food Service",
          drawerIcon: ({ color }: { color: string }) => (
            <Ionicons name="restaurant-outline" size={22} color={color} />
          ),
          drawerItemStyle: { display: hasPermission('food.view') ? 'flex' : 'none' }
        }}
      />

      <Drawer.Screen
        name="network"
        options={{
          title: "Network Management",
          drawerLabel: "Network Management",
          drawerIcon: ({ color }: { color: string }) => (
            <Ionicons name="wifi-outline" size={22} color={color} />
          ),
          drawerItemStyle: { display: hasPermission('network.view') ? 'flex' : 'none' }
        }}
      />

      <Drawer.Screen
        name="info-package"
        options={{
          title: "Info Package",
          drawerLabel: "Info Package",
          drawerIcon: ({ color }: { color: string }) => (
            <Ionicons name="document-text-outline" size={22} color={color} />
          ),
          drawerItemStyle: { display: true ? 'flex' : 'none' }
        }}
      />

      <Drawer.Screen
        name="notification"
        options={{
          title: "Notifications",
          drawerLabel: "Notifications",
          drawerIcon: ({ color }: { color: string }) => (
            <Ionicons name="notifications-outline" size={22} color={color} />
          ),
          drawerItemStyle: { display: true ? 'flex' : 'none' }
        }}
      />

      <Drawer.Screen
        name="report"
        options={{
          title: "Reports",
          drawerLabel: "Reports",
          drawerIcon: ({ color }: { color: string }) => (
            <Ionicons name="bar-chart-outline" size={22} color={color} />
          ),
          drawerItemStyle: { display: hasPermission('report.view') ? 'flex' : 'none' }
        }}
      />

      <Drawer.Screen
        name="user"
        options={{
          title: "User Management",
          drawerLabel: "User Management",
          drawerIcon: ({ color }: { color: string }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
          drawerItemStyle: { display: hasPermission('user.view') ? 'flex' : 'none' }
        }}
      />
    </Drawer>
  );
}
