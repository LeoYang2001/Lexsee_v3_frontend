import React, { useState } from "react";
import { View, Dimensions, ScrollView } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  G,
  Line,
  Text as SvgText,
} from "react-native-svg";
import { parseISO, format } from "date-fns";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
  history: "#FA541C",
  projection: "#8B5CF6",
  grid: "rgba(255, 255, 255, 0.1)",
  text: "#9CA3AF",
  background: "#000",
};

export const ScrollableSRSChart = ({ data }: { data: any[] }) => {
  if (!data || data.length < 2) return null;

  // 1. Zoom Logic
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      // Clamp zoom between 1x and 5x
      if (scale.value < 1) scale.value = withTiming(1);
      if (scale.value > 5) scale.value = withTiming(5);
      savedScale.value = scale.value;
    });

  // 2. Dynamic Width Calculation
  // We start with a base width, then multiply by our scale shared value
  const BASE_WIDTH = SCREEN_WIDTH * 1.5;
  const PADDING_X = 50;
  const height = 250;
  const chartH = height - 60;

  // 3. Coordinate Helpers (Standard JS for Path generation)
  const firstTime = parseISO(data[0].date).getTime();
  const lastTime = parseISO(data[data.length - 1].date).getTime();
  const totalDuration = Math.max(lastTime - firstTime, 1);

  const getX = (dateStr: string, currentWidth: number) => {
    const time = parseISO(dateStr).getTime();
    return (
      PADDING_X +
      ((time - firstTime) / totalDuration) * (currentWidth - PADDING_X * 2)
    );
  };

  const getY = (retention: number) => 30 + (1 - retention) * chartH;

  // 4. Animated Styles for the Scroll Content
  const animatedContainerStyle = useAnimatedStyle(() => ({
    width: BASE_WIDTH * scale.value,
  }));

  // Helper to render the SVG content based on a specific width
  const renderSVG = (currentWidth: number) => {
    let historyPath = "";
    let projectionPath = "";

    // Path logic remains the same, but uses the dynamic 'currentWidth'
    data.forEach((node, i) => {
      const x = getX(node.date, currentWidth);
      if (i === 0) {
        historyPath = `M ${x} ${getY(1)}`;
        return;
      }
      const x1 = getX(data[i - 1].date, currentWidth);
      const cpX = x1 + (x - x1) * 0.5;
      const segment = ` Q ${cpX} ${getY(1.05)} ${x} ${getY(0.75)} L ${x} ${getY(1)}`;

      if (node.type === "actual") historyPath += segment;
      else
        projectionPath +=
          (projectionPath === "" ? `M ${x1} ${getY(1)}` : "") + segment;
    });

    return (
      <Svg width={currentWidth} height={height}>
        <Defs>
          <LinearGradient id="gradH" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.history} stopOpacity="0.2" />
            <Stop offset="1" stopColor={COLORS.history} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid Lines & Date Labels */}
        {data.map((node, i) => (
          <G key={`label-${i}`}>
            <Line
              x1={getX(node.date, currentWidth)}
              y1={0}
              x2={getX(node.date, currentWidth)}
              y2={height}
              stroke={COLORS.grid}
              strokeWidth={1}
            />
            <SvgText
              x={getX(node.date, currentWidth)}
              y={height - 10}
              fill={COLORS.text}
              fontSize="10"
              textAnchor="middle"
            >
              {format(parseISO(node.date), "MMM d")}
            </SvgText>
          </G>
        ))}

        <Path
          d={historyPath}
          stroke={COLORS.history}
          strokeWidth="3"
          fill="none"
        />
        <Path
          d={projectionPath}
          stroke={COLORS.projection}
          strokeWidth="2"
          strokeDasharray="5 5"
          fill="none"
        />

        {data.map((node, i) => (
          <Circle
            key={i}
            cx={getX(node.date, currentWidth)}
            cy={getY(1)}
            r={4}
            fill={node.type === "actual" ? COLORS.history : COLORS.background}
            stroke={node.type === "actual" ? COLORS.history : COLORS.projection}
            strokeWidth={2}
          />
        ))}
      </Svg>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={pinchGesture}>
        <Animated.View style={{ height }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Animated.View style={[animatedContainerStyle, { height }]}>
              {/* Note: In a production app, you'd re-render the SVG Paths inside an 
                  AnimatedProps or use a simpler scale transform for performance. */}
              {renderSVG(BASE_WIDTH * scale.value)}
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
