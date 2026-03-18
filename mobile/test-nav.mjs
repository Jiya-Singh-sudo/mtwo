import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const stack = createNativeStackNavigator();
console.log('Stack keys:', Object.keys(stack));
console.log('Stack.Navigator:', typeof stack.Navigator);
console.log('Stack.Screen:', typeof stack.Screen);

const drawer = createDrawerNavigator();
console.log('Drawer keys:', Object.keys(drawer));
console.log('Drawer.Navigator:', typeof drawer.Navigator);
console.log('Drawer.Screen:', typeof drawer.Screen);

const tabs = createBottomTabNavigator();
console.log('Tabs keys:', Object.keys(tabs));
console.log('Tabs.Navigator:', typeof tabs.Navigator);
console.log('Tabs.Screen:', typeof tabs.Screen);
