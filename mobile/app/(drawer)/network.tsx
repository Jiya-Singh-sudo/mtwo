import { Redirect } from 'expo-router';
export default function NetworkShim() {
  return <Redirect href="/network/NetworkScreen" />;
}
