import { Stack } from "expo-router";

export default function DailyLexseeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Daily Lexsee",
        }}
      />
      <Stack.Screen
        name="detail"
        options={{
          title: "Discover Detail",
        }}
      />
      <Stack.Screen
        name="youtubePlayer"
        options={{
          title: "YouTube Player",
        }}
      />
    </Stack>
  );
}
