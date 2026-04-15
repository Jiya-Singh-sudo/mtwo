// import { Redirect } from 'expo-router';
// export default function RoomShim() {
//   return <Redirect href="/room/RoomManagementScreen" />;
// }
import React from 'react';
import RoomManagementScreen from '../(app)/room/RoomManagementScreen';

export default function RoomShim() {
  return <RoomManagementScreen />;
}
