import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  LayoutChangeEvent,
  Animated,
  Easing,
  StyleSheet,
  Text,
} from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Line,
  G,
  Text as SvgText,
} from "react-native-svg";

interface TimelineNode {
  date: string;
  interval: number;
  ease: number;
  type: "actual" | "estimated";
  retention?: number;
  reviewDelta?: number;
  familiarityLevel?: string;
}

interface SpacedRepetitionChartProps {
  data: TimelineNode[];
  masteryInterval?: number;
  initialDelay?: number;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const COLORS = {
  history: "#FA541C",
  current: "#22C55E",
  projection: "#8B5CF6",
  grid: "rgba(255, 255, 255, 0.1)",
  text: "#9CA3AF",
  background: "#000000",
  axis: "rgba(255,255,255,0.16)",
};

const PADDING_LEFT = 18;
const PADDING_RIGHT = 18;
const PADDING_TOP = 30;
const PADDING_BOTTOM = 40;

const getSegmentColor = (index: number) => {
  if (index === 0) return COLORS.history;
  if (index === 1) return COLORS.current;
  return COLORS.projection;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const SpacedRepetitionChart: React.FC<SpacedRepetitionChartProps> = ({
  data,
  masteryInterval = 180,
  initialDelay = 450,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const [historyLength, setHistoryLength] = useState(0);
  const [lastReviewLength, setLastReviewLength] = useState(0);
  const [projectionLength, setProjectionLength] = useState(0);

  const historyAnim = useRef(new Animated.Value(0)).current;
  const lastReviewAnim = useRef(new Animated.Value(0)).current;
  const projectionAnim = useRef(new Animated.Value(0)).current;
  const nodeAnim = useRef(new Animated.Value(0)).current;

  const historyMeasureRef = useRef<any>(null);
  const lastReviewMeasureRef = useRef<any>(null);
  const projectionMeasureRef = useRef<any>(null);

  const [xAxisWidthSegments, setXAxisWidthSegments] = useState<number[]>([]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerWidth(width);
    setContainerHeight(height);
  };

  const sortedData = useMemo(() => {
    if (!data || data.length < 2) return [];
    return [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [data]);

  const chartW = Math.max(0, containerWidth - PADDING_LEFT - PADDING_RIGHT);
  const chartH = Math.max(0, containerHeight - PADDING_TOP - PADDING_BOTTOM);

  const getPathWidth = (pathString: any) => {
    const numbers = pathString.match(/-?\d+(\.\d+)?/g).map(Number);
    if (!numbers || numbers.length < 2) return 0;

    const startX = numbers[0]; // First number after 'M'
    const endX = numbers[numbers.length - 2]; // First number of the final 'L' pair

    return Math.abs(endX - startX);
  };

  const geometry = useMemo(() => {
    if (
      sortedData.length < 2 ||
      containerWidth <= 0 ||
      containerHeight <= 0 ||
      chartW <= 0 ||
      chartH <= 0
    ) {
      return null;
    }

    const firstDateMs = new Date(sortedData[0].date).getTime();

    const getElapsedDays = (dateStr: string) => {
      const ms = new Date(dateStr).getTime();
      return Math.max(0, Math.round((ms - firstDateMs) / 86400000));
    };

    const totalDays = Math.max(
      1,
      getElapsedDays(sortedData[sortedData.length - 1].date),
    );

    const getScaledTimeRatio = (dateStr: string) => {
      const elapsed = getElapsedDays(dateStr);
      const raw = elapsed / totalDays;
      return Math.pow(raw, 0.65);
    };

    // X position based on interval progress toward mastery
    const getX = (node: TimelineNode) => {
      const progressRatio = Math.min(
        Math.max(node.interval, 1) / masteryInterval,
        1,
      );
      return PADDING_LEFT + progressRatio * chartW;
    };

    const getY = (retention: number) => {
      const safeRetention = clamp(retention, 0, 1);
      return PADDING_TOP + (1 - safeRetention) * chartH;
    };

    const topY = getY(1);
    const bottomY = getY(0);

    let historyPath = "";
    let lastReviewPath = "";
    let projectionPath = "";
    let historyArea = "";
    let projectionArea = "";

    const actualIndices = sortedData
      .map((node, index) => (node.type === "actual" ? index : -1))
      .filter((index) => index !== -1);

    const lastActualIndex =
      actualIndices.length > 0 ? actualIndices[actualIndices.length - 1] : -1;
    const secondLastActualIndex =
      actualIndices.length > 1 ? actualIndices[actualIndices.length - 2] : -1;

    sortedData.forEach((node, i) => {
      const x = getX(node);

      const progressRatio = Math.min(
        Math.max(node.interval, 1) / masteryInterval,
        1,
      );

      const floorRetention = 0.7 + progressRatio * 0.25;
      const yFloor = getY(floorRetention);

      if (i === 0) {
        if (node.type === "actual") {
          if (actualIndices.length === 1) {
            lastReviewPath = `M ${x} ${topY}`;
          } else {
            historyPath = `M ${x} ${topY}`;
          }
          historyArea = `M ${x} ${bottomY} L ${x} ${topY}`;
        } else {
          projectionPath = `M ${x} ${topY}`;
          projectionArea = `M ${x} ${bottomY} L ${x} ${topY}`;
        }
        return;
      }

      const prevNode = sortedData[i - 1];
      const x1 = getX(prevNode);
      const x2 = x;

      const cpX = x1 + (x2 - x1) * 0.5;
      const cpY = yFloor + (yFloor - topY) * 0.3;

      const segment = ` Q ${cpX} ${cpY} ${x2} ${yFloor} L ${x2} ${topY}`;

      if (node.type === "actual") {
        const isLastActualSegment =
          i === lastActualIndex && i - 1 === secondLastActualIndex;

        if (isLastActualSegment) {
          if (!lastReviewPath) {
            lastReviewPath = `M ${x1} ${topY}`;
          }
          lastReviewPath += segment;
        } else {
          if (!historyPath) {
            historyPath = `M ${x1} ${topY}`;
          }
          historyPath += segment;
        }

        historyArea += segment;

        if (sortedData[i + 1]?.type === "estimated") {
          historyArea += ` L ${x2} ${bottomY} Z`;
        }
      } else {
        if (!projectionPath) {
          projectionPath = `M ${x1} ${topY}`;
          projectionArea = `M ${x1} ${bottomY} L ${x1} ${topY}`;
        }

        projectionPath += segment;
        projectionArea += segment;

        if (i === sortedData.length - 1) {
          projectionArea += ` L ${x2} ${bottomY} Z`;
        }
      }
    });

    const points = sortedData.map((node, index) => ({
      ...node,
      x: getX(node),
      y: topY,
      isLastActual: index === lastActualIndex,
    }));

    setXAxisWidthSegments(xAxisWidthSegments);

    return {
      topY,
      bottomY,
      historyPath,
      lastReviewPath,
      projectionPath,
      historyArea,
      projectionArea,
      points,
    };
  }, [
    sortedData,
    containerWidth,
    containerHeight,
    chartW,
    chartH,
    masteryInterval,
  ]);

  useEffect(() => {
    if (!geometry) return;

    let retries = 0;
    const maxRetries = 3;

    const measurePaths = () => {
      requestAnimationFrame(() => {
        try {
          const hLen = geometry.historyPath
            ? (historyMeasureRef.current?.getTotalLength?.() ?? 0)
            : 0;

          const lLen = geometry.lastReviewPath
            ? (lastReviewMeasureRef.current?.getTotalLength?.() ?? 0)
            : 0;

          const pLen = geometry.projectionPath
            ? (projectionMeasureRef.current?.getTotalLength?.() ?? 0)
            : 0;

          // If all paths have 0 length and we have paths to render, retry
          if (
            (hLen === 0 || lLen === 0 || pLen === 0) &&
            (geometry.historyPath ||
              geometry.lastReviewPath ||
              geometry.projectionPath) &&
            retries < maxRetries
          ) {
            retries++;
            setTimeout(measurePaths, 50);
            return;
          }

          // Set measured lengths (they might be 0 if paths don't exist)
          setHistoryLength(Math.max(hLen, 1)); // Fallback to 1 to prevent division by zero
          setLastReviewLength(Math.max(lLen, 1));
          setProjectionLength(Math.max(pLen, 1));
        } catch (err) {
          console.error("Error measuring paths:", err);
          setHistoryLength(1);
          setLastReviewLength(1);
          setProjectionLength(1);
        }
      });
    };

    measurePaths();
  }, [geometry]);

  useEffect(() => {
    if (!geometry) return;

    // Only wait for measurements if we actually have paths to animate
    const hasPathsToAnimate =
      geometry.historyPath ||
      geometry.lastReviewPath ||
      geometry.projectionPath;

    if (!hasPathsToAnimate) return;

    // Check if we have valid lengths or have given up waiting
    const hasValidLengths =
      (geometry.historyPath ? historyLength > 0 : true) &&
      (geometry.lastReviewPath ? lastReviewLength > 0 : true) &&
      (geometry.projectionPath ? projectionLength > 0 : true);

    if (!hasValidLengths) {
      // Still waiting for measurements
      return;
    }

    historyAnim.stopAnimation();
    lastReviewAnim.stopAnimation();
    projectionAnim.stopAnimation();
    nodeAnim.stopAnimation();

    historyAnim.setValue(0);
    lastReviewAnim.setValue(0);
    projectionAnim.setValue(0);
    nodeAnim.setValue(0);

    const BASE_HISTORY_DURATION = 1300;
    const BASE_LAST_REVIEW_DURATION = 700;
    const BASE_PROJECTION_DURATION = 1300;
    const REFERENCE_LENGTH = 700;

    const computedHistoryDuration = Math.max(
      700,
      Math.round(
        (Math.max(historyLength, 1) / REFERENCE_LENGTH) * BASE_HISTORY_DURATION,
      ),
    );

    const computedLastReviewDuration = Math.max(
      300,
      Math.round(
        (Math.max(lastReviewLength, 1) / 220) * BASE_LAST_REVIEW_DURATION,
      ),
    );

    const computedProjectionDuration = Math.max(
      800,
      Math.round(
        (Math.max(projectionLength, 1) / REFERENCE_LENGTH) *
          BASE_PROJECTION_DURATION,
      ),
    );

    const steps: Animated.CompositeAnimation[] = [Animated.delay(initialDelay)];

    if (geometry.historyPath) {
      steps.push(
        Animated.timing(historyAnim, {
          toValue: 1,
          duration: computedHistoryDuration,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      );
    } else {
      historyAnim.setValue(1);
    }

    if (geometry.lastReviewPath) {
      steps.push(
        Animated.timing(lastReviewAnim, {
          toValue: 1,
          duration: computedLastReviewDuration,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      );
    } else {
      lastReviewAnim.setValue(1);
    }

    if (geometry.projectionPath) {
      steps.push(
        Animated.timing(projectionAnim, {
          toValue: 1,
          duration: computedProjectionDuration,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      );
    } else {
      projectionAnim.setValue(1);
    }

    steps.push(
      Animated.timing(nodeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    );

    Animated.sequence(steps).start();
  }, [
    geometry,
    historyLength,
    lastReviewLength,
    projectionLength,
    historyAnim,
    lastReviewAnim,
    projectionAnim,
    nodeAnim,
    initialDelay,
  ]);

  if (!geometry) {
    return <View onLayout={onLayout} style={styles.container} />;
  }

  const {
    historyPath,
    lastReviewPath,
    projectionPath,
    historyArea,
    projectionArea,
    points,
  } = geometry;

  const animatedHistoryOffset = historyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [historyLength || 1, 0],
  });

  const animatedLastReviewOffset = lastReviewAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [lastReviewLength || 1, 0],
  });

  const animatedProjectionOffset = projectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [projectionLength || 1, 0],
  });

  const historyAreaOpacity = historyAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.18, 1],
  });

  const projectionAreaOpacity = projectionAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.16, 1],
  });

  const axisTicks = [
    { ratio: 0, label: "Learned" },
    { ratio: 0.5, label: "Halfway" },
    { ratio: 1, label: "Achieved" },
  ];

  return (
    <View className=" relative">
      {/* X-axis  */}
      <View
        style={{
          paddingHorizontal: PADDING_LEFT,
        }}
        className=" w-full h-6 absolute z-30 bottom-2 left-0 flex flex-row justify-center items-start"
      >
        {xAxisWidthSegments.map((width, index) => (
          <Animated.View
            key={index}
            className=" h-full border-t-2"
            style={{ width, borderColor: getSegmentColor(index) }}
          />
        ))}
      </View>
      <View onLayout={onLayout} style={styles.container}>
        {containerWidth > 0 && containerHeight > 0 && (
          <Svg width={containerWidth} height={containerHeight}>
            <Defs>
              <LinearGradient id="gradHistory" x1="0" y1="0" x2="0" y2="1">
                <Stop
                  offset="0"
                  stopColor={COLORS.history}
                  stopOpacity="0.22"
                />
                <Stop offset="1" stopColor={COLORS.history} stopOpacity="0" />
              </LinearGradient>

              <LinearGradient id="gradProjection" x1="0" y1="0" x2="0" y2="1">
                <Stop
                  offset="0"
                  stopColor={COLORS.projection}
                  stopOpacity="0.18"
                />
                <Stop
                  offset="1"
                  stopColor={COLORS.projection}
                  stopOpacity="0"
                />
              </LinearGradient>
            </Defs>

            {axisTicks.map((tick) => {
              const x = PADDING_LEFT + tick.ratio * chartW;
              return (
                <G key={tick.label}>
                  <Line
                    x1={x}
                    y1={PADDING_TOP}
                    x2={x}
                    y2={containerHeight - PADDING_BOTTOM}
                    stroke={tick.ratio === 0.5 ? COLORS.axis : COLORS.grid}
                    strokeWidth={1}
                  />
                  <SvgText
                    x={x}
                    y={containerHeight - 12}
                    fill={COLORS.text}
                    fontSize="10"
                    textAnchor={
                      tick.ratio === 0
                        ? "start"
                        : tick.ratio === 1
                          ? "end"
                          : "middle"
                    }
                  >
                    {tick.label}
                  </SvgText>
                </G>
              );
            })}

            {[1, 0.85, 0.7].map((level) => (
              <Line
                key={level}
                x1={PADDING_LEFT}
                y1={PADDING_TOP + (1 - level) * chartH}
                x2={containerWidth - PADDING_RIGHT}
                y2={PADDING_TOP + (1 - level) * chartH}
                stroke={COLORS.grid}
                strokeWidth={1}
                strokeDasharray="6 6"
              />
            ))}

            {historyArea ? (
              <AnimatedPath
                d={historyArea}
                fill="url(#gradHistory)"
                opacity={historyAreaOpacity}
              />
            ) : null}

            {projectionArea ? (
              <AnimatedPath
                d={projectionArea}
                fill="url(#gradProjection)"
                opacity={projectionAreaOpacity}
              />
            ) : null}

            {historyPath ? (
              <Path
                ref={historyMeasureRef}
                d={historyPath}
                stroke="transparent"
                fill="none"
              />
            ) : null}

            {lastReviewPath ? (
              <Path
                ref={lastReviewMeasureRef}
                d={lastReviewPath}
                stroke="transparent"
                fill="none"
              />
            ) : null}

            {projectionPath ? (
              <Path
                ref={projectionMeasureRef}
                d={projectionPath}
                stroke="transparent"
                fill="none"
              />
            ) : null}

            {historyPath && historyLength > 0 ? (
              <AnimatedPath
                d={historyPath}
                stroke={COLORS.history}
                strokeWidth={3.5}
                strokeDasharray={`${historyLength} ${historyLength}`}
                strokeDashoffset={animatedHistoryOffset}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {lastReviewPath && lastReviewLength > 0 ? (
              <AnimatedPath
                d={lastReviewPath}
                stroke={COLORS.current}
                strokeWidth={3.5}
                strokeDasharray={`${lastReviewLength} ${lastReviewLength}`}
                strokeDashoffset={animatedLastReviewOffset}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {projectionPath && projectionLength > 0 ? (
              <AnimatedPath
                d={projectionPath}
                stroke={COLORS.projection}
                strokeWidth={3}
                strokeDasharray={`${projectionLength} ${projectionLength}`}
                strokeDashoffset={animatedProjectionOffset}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {points.map((node, i) => {
              const opacity = nodeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              });

              const isGreenPoint = node.isLastActual;

              return (
                <AnimatedCircle
                  key={`${node.date}-${i}`}
                  cx={node.x}
                  cy={node.y}
                  r={node.type === "actual" ? 5 : 4.5}
                  fill={
                    isGreenPoint
                      ? COLORS.current
                      : node.type === "actual"
                        ? COLORS.history
                        : COLORS.background
                  }
                  stroke={
                    isGreenPoint
                      ? COLORS.current
                      : node.type === "actual"
                        ? COLORS.history
                        : COLORS.projection
                  }
                  strokeWidth={3}
                  opacity={opacity}
                />
              );
            })}

            <SvgText x={14} y={14} fill={COLORS.text} fontSize="10">
              Retention
            </SvgText>
          </Svg>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.background,
    borderRadius: 20,
    overflow: "hidden",
  },
});

export default SpacedRepetitionChart;
