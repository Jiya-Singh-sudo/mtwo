const { createNativeStackNavigator } = require('@react-navigation/native-stack');
const stack = createNativeStackNavigator();
console.log('Stack keys:', Object.keys(stack));
console.log('Navigator:', typeof stack.Navigator);
console.log('Screen:', typeof stack.Screen);

const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
const tabs = createBottomTabNavigator();
console.log('Tabs keys:', Object.keys(tabs));

const { createDrawerNavigator } = require('@react-navigation/drawer');
const drawer = createDrawerNavigator();
console.log('Drawer keys:', Object.keys(drawer));
