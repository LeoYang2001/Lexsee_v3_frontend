import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import Logo from "../components/common/Logo";
import CustomSplashScreen from "./splash";

// Keep the native splash screen visible while we fetch fonts
SplashScreen.preventAutoHideAsync();

export default function IndexScreen() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Hide the native splash screen immediately
        await SplashScreen.hideAsync();

        // Show our custom splash screen for 2.5 seconds
        const splashTimer = setTimeout(() => {
          setShowSplash(false);
          // Let the Hub listener in _layout.tsx handle auth checking
        }, 2500);

        return () => clearTimeout(splashTimer);
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, []);

  // Show splash screen
  if (showSplash) {
    return <CustomSplashScreen />;
  }

  // Show a simple loading screen while Hub listener handles auth
  return (
    <LinearGradient
      colors={["#1F2734", "#131416"]}
      className="flex-1 items-center justify-center"
    >
      <View className="w-full h-full flex justify-center items-center">
        <Logo size={60} />
        <ActivityIndicator size="large" color="#FA541C" className="mt-8" />
        <Text className="text-white text-lg mt-4">Initializing...</Text>
      </View>
    </LinearGradient>
  );
}
