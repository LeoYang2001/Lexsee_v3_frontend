import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { getCurrentUser } from "aws-amplify/auth";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchUserInfo, clearUser } from "../store/slices/userSlice";
import {
  setProfile,
  setProfileLoading,
  setProfileError,
  clearProfile,
} from "../store/slices/profileSlice";
import Logo from "../components/common/Logo";
import CustomSplashScreen from "./splash";
import { client } from "./client";

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

  // Helper function to serialize profile data and fetch wordsList
  const serializeProfile = async (profile: any) => {
    const { wordsList, ...cleanProfile } = profile;

    try {
      // Fetch the actual wordsList data
      const wordsList_res = await wordsList();
      const wordsListData = wordsList_res.data;

      return {
        ...cleanProfile,
        // Store the wordsList ID if needed
        wordsListId: wordsListData?.id || null,
      };
    } catch (error) {
      console.error("Error fetching wordsList:", error);
      return {
        ...cleanProfile,
        wordsListId: null,
      };
    }
  };

  // Function to check if user has setup profile
  const checkUserProfile = async (userId: string): Promise<boolean> => {
    dispatch(setProfileLoading(true));

    try {
      // client models may not be properly typed by the generated client; cast to any to access runtime model
      const profileResult = await (client as any).models.UserProfile.list({
        filter: { userId: { eq: userId } },
      });

      console.log(profileResult);
      if (profileResult.data.length > 0) {
        const profile = profileResult.data[0];
        console.log("Profile found:", profile);

        // Save serialized profile to Redux store (now async)
        const serializedProfile = await serializeProfile(profile);
        dispatch(setProfile(serializedProfile));
        return true;
      } else {
        // Create user profile with a wordsList and username "user"
        console.log("No profile found, creating new profile...");

        const newProfileResult = await (
          client as any
        ).models.UserProfile.create({
          userId: userId,
          username: "user",
        });

        if (newProfileResult.data) {
          console.log("Profile created:", newProfileResult.data);

          // Create a wordsList for the new profile
          const wordsListResult = await (client as any).models.WordsList.create(
            {
              userProfileId: newProfileResult.data.id,
            }
          );

          if (wordsListResult.data) {
            console.log("WordsList created:", wordsListResult.data);
          } else {
            console.error(
              "Failed to create WordsList:",
              wordsListResult.errors
            );
          }

          // Save serialized newly created profile to Redux store (now async)
          const serializedProfile = await serializeProfile(
            newProfileResult.data
          );
          dispatch(setProfile(serializedProfile));
          return true;
        } else {
          console.error("Failed to create profile:", newProfileResult.errors);
          dispatch(setProfileError("Failed to create profile"));
          return false;
        }
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
      dispatch(setProfileError("Error checking user profile"));
      return false;
    }
  };

  const checkAuthState = async () => {
    try {
      // First check if user is authenticated
      const currentUser = await getCurrentUser();
      console.log("User authenticated:", currentUser);

      // If authenticated, fetch user info and store in Redux
      const resultAction = await dispatch(fetchUserInfo());

      if (fetchUserInfo.fulfilled.match(resultAction)) {
        // Wait a bit more to ensure auth is fully established
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check if user has setup profile before redirecting to home
        const userHasProfile = await checkUserProfile(
          resultAction.payload.userId
        );

        if (userHasProfile) {
          // User has profile (existing or newly created), redirect to home
          router.replace("/(home)");
        } else {
          // Failed to create profile, redirect to auth
          router.replace("/(auth)");
        }
      } else {
        // Failed to fetch user info, clear user and redirect to auth
        dispatch(clearUser());
        dispatch(clearProfile()); // Clear profile on auth failure
        router.replace("/(auth)");
      }
    } catch (error) {
      // User is not authenticated, clear any existing user data and redirect to auth
      console.log("User not authenticated:", error);
      dispatch(clearUser());
      dispatch(clearProfile()); // Clear profile on auth failure
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
