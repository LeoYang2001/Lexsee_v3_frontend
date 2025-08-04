import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { getCurrentUser } from "aws-amplify/auth";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchUserInfo, clearUser } from "../store/slices/userSlice";
import Logo from "../components/common/Logo";
import CustomSplashScreen from "./splash";

// Keep the native splash screen visible while we fetch fonts
SplashScreen.preventAutoHideAsync();

export default function IndexScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const dispatch = useAppDispatch();
  const {
    isLoading: userLoading,
    isAuthenticated,
    error,
  } = useAppSelector((state) => state.user);

  useEffect(() => {
    async function prepare() {
      try {
        // Hide the native splash screen immediately
        await SplashScreen.hideAsync();

        // Show our custom splash screen for 2.5 seconds
        const splashTimer = setTimeout(() => {
          setShowSplash(false);
          checkAuthState();
        }, 2500);

        return () => clearTimeout(splashTimer);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const checkAuthState = async () => {
    try {
      // First check if user is authenticated
      await getCurrentUser();

      // If authenticated, fetch user info and store in Redux
      const resultAction = await dispatch(fetchUserInfo());

      if (fetchUserInfo.fulfilled.match(resultAction)) {
        // User info fetched successfully, redirect to home
        router.replace("/(home)");
      } else {
        // Failed to fetch user info, clear user and redirect to auth
        dispatch(clearUser());
        router.replace("/(auth)");
      }
    } catch (error) {
      // User is not authenticated, clear any existing user data and redirect to auth
      console.log("User not authenticated:", error);
      dispatch(clearUser());
      router.replace("/(auth)");
    }
  };

  // Show splash screen
  if (showSplash) {
    return <CustomSplashScreen />;
  }

  // Show loading after splash while checking auth and fetching user info
  if (userLoading) {
    return (
      <LinearGradient
        colors={["#1F2734", "#131416"]}
        className="flex-1 items-center justify-center"
      >
        <View className="w-full h-full flex justify-center items-center">
          <Logo size={60} />
          <ActivityIndicator size="large" color="#FA541C" className="mt-8" />
          <Text className="text-white text-lg mt-4">Loading user data...</Text>
        </View>
      </LinearGradient>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <LinearGradient
        colors={["#1F2734", "#131416"]}
        className="flex-1 items-center justify-center"
      >
        <View className="items-center px-6">
          <Logo size={60} />
          <Text className="text-red-400 text-lg mt-8 text-center">
            Error loading user data
          </Text>
          <Text className="text-gray-400 text-sm mt-2 text-center">
            {error}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return null;
}
