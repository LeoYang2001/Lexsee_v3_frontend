import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import Logo from "../components/common/Logo";

// Keep the native splash screen visible while we fetch fonts
SplashScreen.preventAutoHideAsync();

export default function IndexScreen() {
  useEffect(() => {
    // Hide the native splash screen once this component mounts
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn("Error hiding splash:", error);
      }
    };
    
    hideSplash();
  }, []);

  // Show a simple loading screen while Hub listener handles auth
  return (
    <LinearGradient
      colors={["#1F2734", "#131416"]}
      className="flex-1 items-center justify-center"
    >
      <View className="w-full h-full flex justify-center items-center gap-8">
        <Logo size={80} />
        <View className="flex items-center gap-3">
          <ActivityIndicator size="large" color="#FA541C" />
        </View>
      </View>
    </LinearGradient>
  );
}
