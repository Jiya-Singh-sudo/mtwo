import { Redirect } from 'expo-router';
export default function GuestShim() {
  return <Redirect href="/guest/GuestManagementScreen" />;
}
