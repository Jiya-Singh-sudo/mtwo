// import { Redirect } from 'expo-router';
// export default function NotificationShim() {
//   return <Redirect href="/notification/NotificationScreen" />;
// }
import React from 'react';
import NotificationScreen from '../(app)/notification/NotificationScreen';

export default function NotificationShim() {
  return <NotificationScreen />;
}
