import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { withLayoutContext, router, useSegments, useRootNavigationState } from 'expo-router';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Text, View, Animated } from 'react-native';
console.log('RN View type:', typeof View);
console.log('RN Animated type:', typeof Animated);
console.log('RN Animated.View type:', typeof Animated?.View);
import { enableScreens } from 'react-native-screens';
enableScreens(false);

const { Navigator } = createNativeStackNavigator();
const Stack = withLayoutContext(Navigator);

import { NavigationContext, NavigationRouteContext } from '@react-navigation/native';
console.log('NavigationContext type:', typeof NavigationContext);
console.log('NavigationContext.Provider type:', typeof NavigationContext?.Provider);
console.log('NavigationRouteContext type:', typeof NavigationRouteContext);
console.log('NavigationRouteContext.Provider type:', typeof NavigationRouteContext?.Provider);

import { HeaderHeightContext, HeaderShownContext, Background, Screen as ElementsScreen, Header } from '@react-navigation/elements';
console.log('HeaderHeightContext type:', typeof HeaderHeightContext);
console.log('HeaderHeightContext.Provider type:', typeof HeaderHeightContext?.Provider);
console.log('HeaderShownContext type:', typeof HeaderShownContext);
console.log('HeaderShownContext.Provider type:', typeof HeaderShownContext?.Provider);

console.log('Stack component type:', typeof Stack);
console.log('Stack.Screen component type:', typeof Stack.Screen);
if (Stack.Screen === undefined) {
  console.error('CRITICAL: Stack.Screen is undefined!');
}


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
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(drawer)');
    }
  }, [isAuthenticated, segments, navigationState, isLoading]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
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