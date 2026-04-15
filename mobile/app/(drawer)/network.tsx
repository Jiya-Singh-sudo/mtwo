// import { Redirect } from 'expo-router';
// export default function NetworkShim() {
//   return <Redirect href="/network/NetworkScreen" />;
// }
import React from 'react';
import NetworkScreen from '../(app)/network/NetworkScreen';

export default function NetworkShim() {
  return <NetworkScreen />;
}
