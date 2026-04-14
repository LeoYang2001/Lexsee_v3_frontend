import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  AppState,
} from "react-native";
import React, { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from "react-native-reanimated";

import { useRouter } from "expo-router";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { setProfile } from "../../store/slices/profileSlice";
import ReviewStatusDisplay from "./ReviewStatusDisplay";
import ReviewActionButton from "./ReviewActionButton";
import { wordsListSelector } from "../../store/selectors/wordsListSelector";
import { useDailyStats } from "../../hooks/useDailyStats";
import { client } from "../../app/client";
const duration = 200;

const DashCard = () => {
  const { collectedList, masteredList } = useAppSelector(wordsListSelector);

  const [ifReviewCard, setIfReviewCard] = useState(true);

  const profile = useAppSelector((state) => state.profile.data);
  const dispatch = useAppDispatch();

  // Force recalculation of daily stats when app comes to foreground
  const [appState, setAppState] = useState(AppState.currentState);

  const { completed, total, progress, status, shouldResetStreak } =
    useDailyStats();

  const height = useSharedValue(104);
  const reviewOpacity = useSharedValue(0);

  const router = useRouter();

  // Listen for app state changes to recalculate daily stats
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: string) => {
    if (appState.match(/inactive|background/) && nextAppState === "active") {
      // App has come to foreground, trigger re-evaluation of daily stats
      console.log(
        "📱 App returned to foreground, recalculating daily stats...",
      );
      setAppState(nextAppState as any);
    } else {
      setAppState(nextAppState as any);
    }
  };

  useEffect(() => {
    height.value = withTiming(ifReviewCard ? 191 : 104, { duration });
    reviewOpacity.value = withTiming(ifReviewCard ? 1 : 0, { duration });

    if (shouldResetStreak) {
      if (!profile || !profile.id)
        return alert("Profile data is missing. Cannot reset streak.");

      const resetStreak = async () => {
        try {
          console.log("Streak should be reset today!");

          // 1. Update backend and wait for completion
          await (client as any).models.UserProfile.update({
            id: profile.id,
            currentStreak: 0,
          });

          // 2. Update Redux immediately so UI reflects the change
          dispatch(
            setProfile({
              ...profile,
              currentStreak: 0,
            }),
          );

          console.log("🔥 Streak reset successfully");
        } catch (err) {
          console.error("⚠️ Failed to reset streak:", err);
        }
      };

      resetStreak();
    }
  }, [ifReviewCard, shouldResetStreak]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  const reviewAnimatedStyle = useAnimatedStyle(() => ({
    opacity: reviewOpacity.value,
  }));

  // Get status label and color
  const getStatusDisplay = () => {
    switch (status) {
      case "review_begin":
        return {
          label: "Review Begin",
          color: "#FF511B",
          bgColor: "rgba(255, 81, 27, 0.2)",
        };
      case "review_in_progress":
        return {
          label: "In Progress",
          color: "#FFA500",
          bgColor: "rgba(255, 165, 0, 0.2)",
        };
      case "viewProgress":
      default:
        return {
          label: "View Progress",
          color: "#4CAF50",
          bgColor: "rgba(76, 175, 80, 0.2)",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Pressable>
      <Animated.View
        entering={FadeIn}
        style={[animatedStyle]}
        className="w-full relative"
      >
        <LinearGradient
          colors={["#FF511B", "#FF602F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: 104,
            borderRadius: 16,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 20,
          }}
        >
          <View className="w-full h-full flex flex-row justify-between items-center">
            <View className=" flex-1">
              {/* Review Status Display */}
              <ReviewStatusDisplay
                currentStreak={profile?.currentStreak || 0}
                reviewStatus={status}
                stats={{ completed, total, progress }}
              />
            </View>

            <View
              style={{
                width: 1,
                height: 12,
                backgroundColor: "#fff",
                opacity: 0.2,
                borderRadius: 1,
              }}
            />

            <View className=" flex-1">
              {/* Review Action Button */}
              <ReviewActionButton
                reviewStatus={status}
                statusColor={statusDisplay.color}
                statusBgColor={statusDisplay.bgColor}
                statusLabel={statusDisplay.label}
              />
            </View>
          </View>
        </LinearGradient>

        {/* ReviewCard - Additional Stats */}
        <Animated.View
          style={[
            {
              height: 100,
              borderBottomRightRadius: 12,
              borderBottomLeftRadius: 12,
            },
            reviewAnimatedStyle,
          ]}
          className="absolute w-full bottom-0 bg-white overflow-hidden"
        >
          <LinearGradient
            colors={["#292526", "#5b3023", "#292526"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/(inventory)");
              }}
              className="flex flex-row items-center justify-between w-full"
            >
              {/* Review Words Count */}
              <View className="flex flex-col h-full justify-center px-6 flex-1">
                <Text
                  style={{
                    fontSize: 24,
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  {collectedList.length}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "white",
                    opacity: 0.7,
                    marginTop: 2,
                  }}
                >
                  Collected
                </Text>
              </View>

              <View
                style={{
                  width: 1,
                  height: 12,
                  backgroundColor: "#fff",
                  opacity: 0.2,
                  borderRadius: 1,
                }}
              />

              {/* Mastered Words Count */}
              <View className="flex flex-col h-full justify-center px-6 flex-1">
                <Text
                  style={{
                    fontSize: 24,
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  {masteredList.length}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "white",
                    opacity: 0.7,
                    marginTop: 2,
                  }}
                >
                  Mastered
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

export default DashCard;
