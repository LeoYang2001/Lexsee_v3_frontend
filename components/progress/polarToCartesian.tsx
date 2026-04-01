import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  runOnJS,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const a = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

type Props = {
  value: number;
  max: number;
  label?: string;
};

export default function CalorieArcChart({ value, max, label }: Props) {
  const size = 240;
  const strokeWidth = 8;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;

  // Gauge range
  const startAngle = -120;
  const endAngle = 120;
  const totalAngle = endAngle - startAngle;

  // Animated value for progress
  const animatedProgress = useSharedValue(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  // Animate progress on mount
  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(value / max, 1), {
      duration: 1200,
    });
  }, [value, max]);

  // React to animated value changes
  useAnimatedReaction(
    () => animatedProgress.value,
    (progress) => {
      runOnJS(setDisplayProgress)(progress);
    },
  );

  const progressAngle = startAngle + totalAngle * displayProgress;

  const bgArc = describeArc(cx, cy, r, startAngle, endAngle);
  const fgArc = describeArc(cx, cy, r, startAngle, progressAngle);

  return (
    <Animated.View
      entering={FadeIn.delay(200).duration(500)}
      exiting={FadeOut}
      className="items-center justify-center"
    >
      <View className="relative items-center justify-center">
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#F6B340" />
              <Stop offset="55%" stopColor="#EC6A5E" />
              <Stop offset="100%" stopColor="#8B5CF6" />
            </LinearGradient>
          </Defs>

          {/* background arc */}
          <Path
            d={bgArc}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />

          {/* progress arc */}
          <Path
            d={fgArc}
            stroke="url(#grad)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>

        <View className="absolute items-center">
          <Text className="text-5xl font-semibold text-white">
            {value * 100}
          </Text>
          {label && <Text className=" text-gray-300 mt-1">{label}</Text>}
        </View>
      </View>
    </Animated.View>
  );
}
