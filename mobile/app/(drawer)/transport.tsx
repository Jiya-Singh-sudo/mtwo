// import { Redirect } from 'expo-router';
// export default function TransportShim() {
//   return <Redirect href="/transport/TransportScreen" />;
// }
import React from 'react';
import TransportScreen from '../(app)/transport/TransportScreen';

export default function TransportShim() {
  return <TransportScreen />;
}
