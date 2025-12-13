import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { score_geo } from "../../lib/reviewAlgorithm";

const AnimatedPath = Animated.createAnimatedComponent(Path);

type ArcGaugeProps = {
  size?: number;
  strokeWidth?: number; // outer stroke
  value1: number; // outer progress 0..100
  value2: number; // inner progress 0..100
  durationMs?: number;
  trackColor?: string;
  progressColor?: string; // outer progress color
  innerProgressColor?: string; // inner progress color
  startAngle?: number;
  endAngle?: number;
  // control arc end cap style: "round" (default), "butt" or "square"
  outerCap?: "butt" | "round" | "square";
  innerCap?: "butt" | "round" | "square";
};

function clamp01(x: number) {
  "worklet";
  return Math.max(0, Math.min(1, x));
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const sweep = (((endAngle - startAngle) % 360) + 360) % 360;
  const largeArcFlag = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function ArcGauge({
  size = 260,
  strokeWidth = 12,
  value1,
  value2,
  durationMs = 700,
  trackColor = "#4d4e50",
  progressColor = "#ededed",
  startAngle = 225,
  endAngle = 135,
  outerCap = "butt",
  innerCap = "butt",
}: ArcGaugeProps) {
  const [measuredSize, setMeasuredSize] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const dim = Math.min(width, height);
    if (dim > 0 && dim !== measuredSize) setMeasuredSize(dim);
  };

  const sizeUsed = measuredSize ?? size;
  const cx = sizeUsed / 2;
  const cy = sizeUsed / 2;

  // outer arc geometry
  const outerStroke = strokeWidth;
  const outerR = Math.max(1, (sizeUsed - outerStroke) / 2);
  const outerD = useMemo(
    () => describeArc(cx, cy, outerR, startAngle, endAngle),
    [cx, cy, outerR, startAngle, endAngle]
  );
  const sweepDeg = (((endAngle - startAngle) % 360) + 360) % 360;
  const theta = (sweepDeg * Math.PI) / 180;
  const outerArcLen = Math.max(1, outerR * theta);

  // inner arc geometry - inset from outer arc
  const innerStroke = Math.max(8, Math.round(strokeWidth));
  const gap = 3; // gap in px between arcs
  const innerR = Math.max(1, outerR - (outerStroke + innerStroke) / 2 - gap);
  const innerD = useMemo(
    () => describeArc(cx, cy, innerR, startAngle, endAngle),
    [cx, cy, innerR, startAngle, endAngle]
  );
  const innerArcLen = Math.max(1, innerR * theta);

  // animated shared values
  const progressOuter = useSharedValue(0);
  const progressInner = useSharedValue(0);

  React.useEffect(() => {
    progressOuter.value = withTiming(clamp01(value1 / 100), {
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [value1, durationMs, progressOuter]);

  React.useEffect(() => {
    progressInner.value = withTiming(clamp01(value2 / 100), {
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [value2, durationMs, progressInner]);

  const animatedOuter = useAnimatedProps(() => {
    return { strokeDashoffset: (1 - progressOuter.value) * outerArcLen } as any;
  });

  const animatedInner = useAnimatedProps(() => {
    return { strokeDashoffset: (1 - progressInner.value) * innerArcLen } as any;
  });

  const scoreFont = Math.max(12, Math.round(sizeUsed * 0.18));
  const captionFont = Math.max(10, Math.round(sizeUsed * 0.06));

  const score = score_geo(value1, value2);

  return (
    <View
      style={{ width: "100%", aspectRatio: 1, position: "relative" }}
      onLayout={onLayout}
    >
      {/* Score Data  */}
      <View className=" absolute w-full h-full flex justify-center items-center">
        <Text style={{ color: "#fff", fontSize: 28 }}>{score}</Text>
        <Text
          className=" absolute bottom-4"
          style={{ fontSize: 14, color: "#fff", opacity: 0.4 }}
        >
          Score
        </Text>
      </View>
      <View style={{ width: sizeUsed, height: sizeUsed, alignSelf: "center" }}>
        <Svg
          width={sizeUsed}
          height={sizeUsed}
          viewBox={`0 0 ${sizeUsed} ${sizeUsed}`}
        >
          {/* outer track + progress */}
          <Path
            d={outerD}
            stroke={trackColor}
            strokeWidth={outerStroke}
            strokeLinecap={outerCap}
            fill="none"
          />
          <AnimatedPath
            d={outerD}
            stroke={progressColor}
            strokeWidth={outerStroke}
            strokeLinecap={outerCap}
            fill="none"
            strokeDasharray={`${outerArcLen} ${outerArcLen}`}
            animatedProps={animatedOuter}
          />

          {/* inner track + progress */}
          <Path
            d={innerD}
            stroke={trackColor}
            strokeWidth={innerStroke}
            strokeLinecap={innerCap}
            fill="none"
          />
          <AnimatedPath
            d={innerD}
            stroke={progressColor}
            strokeWidth={innerStroke}
            strokeLinecap={innerCap}
            fill="none"
            strokeDasharray={`${innerArcLen} ${innerArcLen}`}
            animatedProps={animatedInner}
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  value: { color: "white", fontWeight: "300" },
  caption: { marginTop: 6, color: "rgba(255,255,255,0.45)" },
});
