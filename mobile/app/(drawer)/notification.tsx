import { Redirect } from 'expo-router';
export default function NotificationShim() {
  return <Redirect href="/notification/NotificationScreen" />;
}
