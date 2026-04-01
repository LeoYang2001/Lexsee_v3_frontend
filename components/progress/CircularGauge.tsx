import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

interface CircularGaugeProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  valueSuffix?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  progress,
  size = 85,
  strokeWidth = 6,
  color = "#FF9500",
  label,
  valueSuffix = "%",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Animated progress value
  const animatedProgress = useSharedValue(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  // Trigger animation when progress changes
  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 1200 });
  }, [progress]);

  // React to animated value changes
  useAnimatedReaction(
    () => animatedProgress.value,
    (value) => {
      runOnJS(setDisplayProgress)(value);
    },
  );

  const offset = circumference - displayProgress * circumference;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2A2B2E"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Fill */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text
          style={{ color: "#fff", fontSize: size * 0.22, fontWeight: "400" }}
        >
          {Math.round(progress * 100)}
          {valueSuffix}
        </Text>
        {label && (
          <Text style={{ color: "#9CA3AF", fontSize: size * 0.09 }}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
};
