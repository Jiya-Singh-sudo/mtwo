const primitives = require('expo-router/build/primitives');
console.log('Expo Router Screen:', typeof primitives.Screen);
console.log('Expo Router Group:', typeof primitives.Group);

const { createNavigatorFactory } = require('@react-navigation/native');
const nav = createNavigatorFactory({})();
console.log('Nav keys:', Object.keys(nav));
console.log('Nav Screen:', typeof nav.Screen);
