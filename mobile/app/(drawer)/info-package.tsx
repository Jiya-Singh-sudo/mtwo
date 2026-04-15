// import { Redirect } from 'expo-router';
// export default function InfoPackageShim() {
//   return <Redirect href="/info-package/InfoPackageScreen" />;
// }
import React from 'react';
import InfoPackageScreen from '../(app)/info-package/InfoPackageScreen';

export default function InfoPackageShim() {
  return <InfoPackageScreen />;
}
