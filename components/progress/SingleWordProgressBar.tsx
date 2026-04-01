import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";

interface SingleWordProgressBarProps {
  wordData: any;
  maxInterval?: number; // The goal interval (e.g., 180 for mastery)
}

const COLORS = {
  previous: "#454545", // Dark Gray (Past progress)
  gain: "#34D399", // Emerald (Progress made)
  loss: "#EF4444", // Red (If the interval dropped)
  track: "rgba(255,255,255,0.05)",
  text: "#9CA3AF",
};

const SingleWordProgressBar: React.FC<SingleWordProgressBarProps> = ({
  wordData,
  maxInterval = 180,
}) => {
  // 1. Logic: Compare the two most recent timeline entries
  const timeline = wordData?.timeline || [];
  const current = timeline[0]?.interval || 0;
  const previous = timeline[1]?.interval || 0;
  const progressGain = current - previous;

  // Percentages relative to the mastery goal
  const prevPct = Math.min((previous / maxInterval) * 100, 100);
  const currentPct = Math.min((current / maxInterval) * 100, 100);
  const gainPct = Math.abs(currentPct - prevPct);

  // 2. Animation Shared Values
  const barProgress = useSharedValue(0);
  const displayPercentage = useSharedValue(0);

  useEffect(() => {
    barProgress.value = withTiming(1, { duration: 1200 });
    displayPercentage.value = withTiming(currentPct, { duration: 1200 });
  }, [wordData]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${prevPct + gainPct * barProgress.value}%`,
  }));

  const animatedPercentageStyle = useAnimatedStyle(() => ({
    opacity: barProgress.value,
  }));

  if (timeline.length < 1) return null;

  return (
    <View className="w-full py-4">
      {/* Header with Percentage */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-gray-400 text-sm font-medium">Progress</Text>
        <Animated.Text
          style={animatedPercentageStyle}
          className="text-emerald-400 font-bold text-lg"
        >
          {Math.round(currentPct)}%
        </Animated.Text>
      </View>

      {/* The Bar Track */}
      <View
        className="w-full h-3 rounded-full overflow-hidden flex-row"
        style={{ backgroundColor: COLORS.track }}
      >
        {/* Previous Progress Segment + Gain Combined */}
        <Animated.View
          style={[
            {
              backgroundColor: progressGain > 0 ? COLORS.gain : COLORS.loss,
              height: "100%",
              borderRadius: 999,
            },
            animatedBarStyle,
          ]}
        />
      </View>

      {/* Markers/Ticks */}
      <View className="flex-row justify-between mt-2 px-1">
        <Text className="text-gray-600 text-[10px]">0d</Text>
        <Text className="text-gray-600 text-[10px]">
          {Math.round(maxInterval / 2)}d
        </Text>
        <Text className="text-gray-600 text-[10px]">
          {maxInterval}d (Mastery)
        </Text>
      </View>
    </View>
  );
};

export default SingleWordProgressBar;
