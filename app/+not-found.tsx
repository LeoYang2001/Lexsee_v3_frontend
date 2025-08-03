import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center p-5 bg-white">
        <Text className="text-2xl font-bold text-gray-800 mb-4">
          This screen doesn't exist.
        </Text>
        <Text className="text-gray-600 mb-6 text-center">
          The page you're looking for couldn't be found.
        </Text>
        <Link href="/" className="mt-4 py-3 px-6 bg-blue-600 rounded-lg">
          <Text className="text-white font-semibold">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
