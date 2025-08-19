import React from "react";
import { Stack } from "expo-router";

export default function DefinitionLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
    </Stack>
  );
}
