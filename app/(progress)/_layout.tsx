import { Stack } from "expo-router";

export default function ProgressLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "Progress",
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Your Progress",
        }}
      />
    </Stack>
  );
}
