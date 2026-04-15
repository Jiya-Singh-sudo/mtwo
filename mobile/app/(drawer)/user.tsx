// import { Redirect } from 'expo-router';
// export default function UserShim() {
//   return <Redirect href="/user/UserManagementScreen" />;
// }
import React from 'react';
import UserManagementScreen from '../(app)/user/UserManagementScreen';

export default function UserShim() {
  return <UserManagementScreen />;
}
