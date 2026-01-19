import { View, Text, TouchableOpacity, Pressable } from "react-native";
import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInLeft,
  FadeIn,
} from "react-native-reanimated";

import { useRouter } from "expo-router";
import { useAppSelector } from "../../store/hooks";
import ReviewStatusDisplay from "./ReviewStatusDisplay";
import ReviewActionButton from "./ReviewActionButton";

type ReviewStatus = "review_begin" | "review_in_progress" | "viewProgress";

const DashCard = () => {
  const [ifReviewCard, setIfReviewCard] = useState(true);
  const [reviewStatus, setReviewStatus] =
    useState<ReviewStatus>("viewProgress");
  const [todayStats, setTodayStats] = useState({
    totalToReview: 0,
    reviewedCount: 0,
    toBeReviewedCount: 0,
  });

  const height = useSharedValue(104);
  const reviewOpacity = useSharedValue(0);

  const router = useRouter();

  // Get from Redux
  const words = useAppSelector((state) => state.wordsList.words);
  //todayReviewList
  const todaySchedule = useAppSelector(
    (state) => state.todayReviewList.words
  );
  const isLoadingTodaySchedule = useAppSelector(
    (state) => state.todayReviewList.isLoading
  );
  
  // Calculate statistics
  const totalWords = words.length;
  const savedWords = words.filter((word) => word.status === "COLLECTED").length;
  const learnedWords = words.filter((word) => word.status === "LEARNED").length;

  const duration = 200;

  // Update review status when schedule changes
  useEffect(() => {
    // If still loading, don't set status yet
    if (isLoadingTodaySchedule) {
      return;
    }

    if (!todaySchedule) {
      setReviewStatus("viewProgress");
      setTodayStats({
        totalToReview: 0,
        reviewedCount: 0,
        toBeReviewedCount: 0,
      });
      return;
    }

    const toBeReviewedCount = todaySchedule.length || 0;
    const reviewedCount = todaySchedule.filter((word: any) => word.reviewed).length || 0;
    const totalToReview = toBeReviewedCount + reviewedCount;


    // Determine review status
    let status: ReviewStatus;

    if (totalToReview === 0) {
      status = "viewProgress";
    } else if (reviewedCount === 0) {
      status = "review_begin";
    } else if (reviewedCount < totalToReview) {
      status = "review_in_progress";
    } else {
      status = "viewProgress";
    }

    console.log(`🎯 Review status: ${status}`);

    setReviewStatus(status);

    setTodayStats({
      totalToReview,
      reviewedCount,
      toBeReviewedCount,
    });
  }, [todaySchedule, isLoadingTodaySchedule]);

  React.useEffect(() => {
    height.value = withTiming(ifReviewCard ? 191 : 104, { duration });
    reviewOpacity.value = withTiming(ifReviewCard ? 1 : 0, { duration });
  }, [ifReviewCard]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  const reviewAnimatedStyle = useAnimatedStyle(() => ({
    opacity: reviewOpacity.value,
  }));

  // Get status label and color
  const getStatusDisplay = () => {
    switch (reviewStatus) {
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
    <Pressable onPress={() => router.push("/(reviewQueue)")}>
      <Animated.View entering={FadeIn} style={[animatedStyle]} className="w-full relative">
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
                reviewStatus={reviewStatus}
                todayStats={todayStats}
                totalWords={totalWords}
                onToggleExpand={() => setIfReviewCard(!ifReviewCard)}
                isLoadingTodaySchedule={isLoadingTodaySchedule}
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
                reviewStatus={reviewStatus}
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
              onPress={() => router.push("/(inventory)")}
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
                  {savedWords}
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
                  {learnedWords}
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
