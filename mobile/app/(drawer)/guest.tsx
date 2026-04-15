// import { Redirect } from 'expo-router';
// export default function GuestShim() {
//   return <Redirect href="../(app)/guest/GuestManagementScreen" />;
// }

import React from 'react';
import GuestManagementScreen from '../(app)/guest/GuestManagementScreen';

export default function GuestShim() {
  return <GuestManagementScreen />;
}
