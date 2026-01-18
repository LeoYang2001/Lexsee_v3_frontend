import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import Logo from "../components/common/Logo";
import { useAppSelector } from "../store/hooks";

// Keep the native splash screen visible while we run launch sequence
SplashScreen.preventAutoHideAsync();

export default function IndexScreen() {
  
  // Check global variables to determine splash visibility
  const chinaCheckLoading = useAppSelector((state) => state.ifChina.isLoading);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const words = useAppSelector((state) => state.wordsList.words);
  const isSynced = useAppSelector((state) => state.wordsList.isSynced);
  const allSchedules = useAppSelector((state) => state.reviewSchedule.allSchedules);

  useEffect(() => {
    // Hide splash once launch sequence completes
    const hideSplash = async () => {
      try {
        // Wait for minimum display time (optional, for branding)
        await new Promise(resolve => setTimeout(resolve, 1000));
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn("Error hiding splash:", error);
      }
    };
    
    // Case 1: User is not authenticated - hide splash
    // (navigation handled by useLaunchSequence in _layout.tsx)
    if (!chinaCheckLoading && isAuthenticated === false) {
      console.log("🔓 User not authenticated - hiding splash");
      hideSplash();
      return;
    }
    
    // Case 2: User is authenticated - wait for all data to load
    if (!chinaCheckLoading && isAuthenticated === true) {
      // Check if both wordsList and schedules are loaded
      const wordsReady = isSynced && words.length >= 0; // isSynced means subscription is complete
      const schedulesReady = allSchedules !== undefined; // allSchedules has been fetched
     
      
      if (wordsReady && schedulesReady) {
        hideSplash();
      }
    }
  }, [chinaCheckLoading, isAuthenticated, isSynced, words.length, allSchedules]);

  // Show loading screen matching native splash style
  return (
    <LinearGradient
      colors={["#1F2734", "#131416"]}
      className="flex-1 items-center justify-center"
    >
      <View className="w-full h-full flex justify-center items-center gap-8">
        <Logo size={80} />
       
      </View>
    </LinearGradient>
  );
}
