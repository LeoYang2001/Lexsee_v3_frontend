import { View, Text, TouchableOpacity } from "react-native";
import React from "react";

type ReviewStatus = "review_begin" | "review_in_progress" | "viewProgress";

interface ReviewStatusDisplayProps {
  reviewStatus: ReviewStatus;
  todayStats: {
    totalToReview: number;
    reviewedCount: number;
    toBeReviewedCount: number;
  };
  totalWords: number;
  onToggleExpand: () => void;
}

const ReviewStatusDisplay: React.FC<ReviewStatusDisplayProps> = ({
  reviewStatus,
  todayStats,
  totalWords,
  onToggleExpand,
}) => {
  return (
    <TouchableOpacity
      className=" w-full h-full flex items-center justify-center px-6"
      onPress={onToggleExpand}
    >
      {reviewStatus === "review_begin" && (
        <View className=" w-full  h-full flex  flex-col justify-center items-start">
          <View className=" flex flex-row items-baseline ">
            <Text
              className="font-semibold"
              style={{ fontSize: 32, color: "white" }}
            >
              {todayStats.toBeReviewedCount}
            </Text>
            <Text
              className="text-white opacity-80"
              style={{
                fontSize: 12,
                color: "white",
                marginLeft: 6,
                marginBottom: 2,
              }}
            >
              {todayStats.toBeReviewedCount === 1
                ? "Word to review"
                : "Words to review"}
            </Text>
          </View>
        </View>
      )}

      {reviewStatus === "review_in_progress" && (
        <View
          className="  w-full h-full justify-center items-start px-0"
          style={{ flexDirection: "column" }}
        >
          <View className=" flex flex-row justify-center items-baseline gap-1">
            <Text
              className="font-semibold"
              style={{ fontSize: 32, color: "white", lineHeight: 36 }}
            >
              {todayStats.reviewedCount}
            </Text>
            <Text
              className="text-white opacity-80"
              style={{
                fontSize: 12,
                color: "white",
                marginLeft: 4,
                marginBottom: 2,
              }}
            >
              /{todayStats.totalToReview} words reviewed
            </Text>
          </View>
        </View>
      )}

      {reviewStatus === "viewProgress" && (
        <View className=" flex flex-col w-full h-full  items-start justify-center">
          <View className=" flex flex-row justify-center items-baseline gap-1">
            <Text
              className="font-semibold"
              style={{ fontSize: 28, color: "white", lineHeight: 32 }}
            >
              {totalWords}
            </Text>
            <Text
              className="text-white opacity-80"
              style={{
                fontSize: 12,
                color: "white",
                lineHeight: 14,
                marginTop: 4,
              }}
            >
              days streak
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ReviewStatusDisplay;
