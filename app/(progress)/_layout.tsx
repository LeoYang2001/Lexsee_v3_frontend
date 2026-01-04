import { Stack } from "expo-router";

export default function ProgressLayout() {
  return (
    <Stack>
      {/* The List Screen */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          // Remove "animation" property here
        }}
      />

      {/* The Detail Screen */}
      <Stack.Screen
        name="badgeDetail/[id]"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
    </Stack>
  );
}
