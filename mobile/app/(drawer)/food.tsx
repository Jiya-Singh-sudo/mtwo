// import { Redirect } from 'expo-router';
// export default function FoodShim() {
//   return <Redirect href="/food/FoodServiceScreen" />;
// }
import React from 'react';
import FoodServiceScreen from '../(app)/food/FoodServiceScreen';
export default function FoodShim() {
  return <FoodServiceScreen />;
}
