import { Stack } from 'expo-router';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react-native';
import outputs from '../amplify_outputs.json';
import '../global.css';

Amplify.configure(outputs);

export default function RootLayout() {
  return (
    <Authenticator.Provider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(home)" options={{ headerShown: false }} />
        <Stack.Screen name="(about)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
    </Authenticator.Provider>
  );
}
