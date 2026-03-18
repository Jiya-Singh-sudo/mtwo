import { withLayoutContext } from 'expo-router';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const { Navigator } = createNativeStackNavigator();
const Stack = withLayoutContext(Navigator);

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login/index" options={{ title: 'Login' }} />
    </Stack>
  );
}
