import { View, Text, TouchableOpacity, Pressable } from "react-native";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from "react-native-reanimated";

import { useRouter } from "expo-router";
import { useAppSelector } from "../../store/hooks";
import ReviewStatusDisplay from "./ReviewStatusDisplay";
import ReviewActionButton from "./ReviewActionButton";
import { getReviewWordsForToday } from "../../store/selectors/todayReviewSelectors";

  const duration = 200;

const DashCard = () => {
  const [ifReviewCard, setIfReviewCard] = useState(true);
  
  
  const {
      stats,
      status
    } = useAppSelector(getReviewWordsForToday);



  const height = useSharedValue(104);
  const reviewOpacity = useSharedValue(0);

  const router = useRouter();

  
  

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
    <Pressable >
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
            <View className=" flex-1 border">
              {/* Review Status Display */}
              <ReviewStatusDisplay
              reviewStatus={status}
              stats= {stats}
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
                  {stats?.pastCount || 0}
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
                  {stats?.todayCount || 0}
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
