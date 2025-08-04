import { Stack } from "expo-router";
import { useEffect } from "react";
import { router } from "expo-router";
import { useAppSelector } from "../../store/hooks";

export default function AuthLayout() {
  const { isAuthenticated } = useAppSelector((state) => state.user);

  // Redirect to home if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(home)");
    }
  }, [isAuthenticated]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}
