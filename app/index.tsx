import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { getCurrentUser } from "aws-amplify/auth";
import { LinearGradient } from "expo-linear-gradient";
import Logo from "../components/common/Logo";
import SplashScreen from "./splash";

export default function IndexScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show splash screen for 2 seconds, then check auth
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      checkAuthState();
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, []);

  const checkAuthState = async () => {
    setLoading(true);
    try {
      await getCurrentUser();
      // User is authenticated, redirect to home
      router.replace("/(home)");
    } catch (error) {
      // User is not authenticated, redirect to auth
      router.replace("/(auth)");
    } finally {
      setLoading(false);
    }
  };

  // Show splash screen
  if (showSplash) {
    return <SplashScreen />;
  }

  // Show loading after splash
  if (loading) {
    return (
      <LinearGradient
        colors={["#1F2734", "#131416"]}
        className="  flex items-center justify-center "
      >
        <View className=" w-full h-full ">
          <ActivityIndicator size="large" color="#FA541C" />
        </View>
      </LinearGradient>
    );
  }

  return null;
}
