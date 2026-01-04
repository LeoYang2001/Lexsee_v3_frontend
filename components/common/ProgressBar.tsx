import { View } from "react-native";
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";

interface ProgressBarProps {
  solidProgress: number; // 0 to 1 (e.g., 0.6)
  dashedProgress: number; // 0 to 1 (e.g., 0.4)
  height?: number;
  solidColor?: string;
  dashedColor?: string;
  duration?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  solidProgress,
  dashedProgress,
  height = 8,
  solidColor = "#4CAF50",
  dashedColor = "#FFA500",
  duration = 1000,
}) => {
  // Shared values for each progress bar
  const solidWidth = useSharedValue(0);
  const dashedWidth = useSharedValue(0);

  // Calculate individual durations
  const totalProgress = solidProgress + dashedProgress;
  const solidDuration = duration * (solidProgress / totalProgress);
  const dashedDuration = duration * (dashedProgress / totalProgress);

  useEffect(() => {
    // First bar animation: solid progress
    solidWidth.value = withTiming(solidProgress, {
      duration: solidDuration,
    });

    // Second bar animation: starts after first one finishes
    dashedWidth.value = withSequence(
      withDelay(
        solidDuration,
        withTiming(dashedProgress, {
          duration: dashedDuration,
        })
      )
    );
  }, [solidProgress, dashedProgress, duration]);

  // Animated styles for each bar
  const solidAnimatedStyle = useAnimatedStyle(() => ({
    width: `${solidWidth.value * 100}%`,
  }));

  const dashedAnimatedStyle = useAnimatedStyle(() => ({
    width: `${dashedWidth.value * 100}%`,
  }));

  return (
    <View
      style={{
        height: height,
        backgroundColor: "transparent",
        overflow: "hidden",
        gap: 2,
      }}
      className="w-full flex flex-row justify-start items-center px-1 "
    >
      {/* First Progress Bar - Solid */}
      <Animated.View
        style={[
          {
            height: "100%",
            backgroundColor: solidColor,
            borderRadius: 10,
          },
          solidAnimatedStyle,
        ]}
      />

      {/* Second Progress Bar - Dashed */}
      <Animated.View
        style={[
          {
            height: "100%",
            backgroundColor: dashedColor,
            borderRadius: 10,
          },
          dashedAnimatedStyle,
        ]}
      />
    </View>
  );
};

export default ProgressBar;
