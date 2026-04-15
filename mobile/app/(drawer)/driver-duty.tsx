// import { Redirect } from 'expo-router';
// export default function DriverDutyShim() {
//   return <Redirect href="/driver-duty/DriverDutyScreen" />;
// }
import React from 'react';
import DriverDutyScreen from '../(app)/driver-duty/DriverDutyScreen';
export default function DriverDutyShim() {
  return <DriverDutyScreen />;
}
