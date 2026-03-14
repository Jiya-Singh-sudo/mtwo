import { Redirect } from 'expo-router';
export default function UserShim() {
  return <Redirect href="/user/UserManagementScreen" />;
}
