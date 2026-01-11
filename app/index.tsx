import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import Logo from "../components/common/Logo";
import CustomSplashScreen from "./splash";

// Keep the native splash screen visible while we fetch fonts
SplashScreen.preventAutoHideAsync();

export default function IndexScreen() {
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
