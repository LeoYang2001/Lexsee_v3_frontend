import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  LayoutChangeEvent,
  Animated,
  Easing,
  StyleSheet,
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
  const [projectionLength, setProjectionLength] = useState(0);

  const historyAnim = useRef(new Animated.Value(0)).current;
  const projectionAnim = useRef(new Animated.Value(0)).current;
  const nodeAnim = useRef(new Animated.Value(0)).current;

  const historyMeasureRef = useRef<any>(null);
  const projectionMeasureRef = useRef<any>(null);

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

    // compressed x spacing for mobile while preserving ordering
    const getScaledTimeRatio = (dateStr: string) => {
      const elapsed = getElapsedDays(dateStr);
      const raw = elapsed / totalDays;
      return Math.pow(raw, 0.65);
    };

    const getX = (dateStr: string) =>
      PADDING_LEFT + getScaledTimeRatio(dateStr) * chartW;

    const getY = (retention: number) => {
      const safeRetention = clamp(retention, 0, 1);
      return PADDING_TOP + (1 - safeRetention) * chartH;
    };

    const topY = getY(1);
    const bottomY = getY(0);

    let historyPath = "";
    let projectionPath = "";
    let historyArea = "";
    let projectionArea = "";

    sortedData.forEach((node, i) => {
      const x = getX(node.date);

      const progressRatio = Math.min(
        Math.max(node.interval, 1) / masteryInterval,
        1,
      );

      // larger interval => shallower dip
      const floorRetention = 0.7 + progressRatio * 0.25;
      const yFloor = getY(floorRetention);

      if (i === 0) {
        if (node.type === "actual") {
          historyPath = `M ${x} ${topY}`;
          historyArea = `M ${x} ${bottomY} L ${x} ${topY}`;
        } else {
          projectionPath = `M ${x} ${topY}`;
          projectionArea = `M ${x} ${bottomY} L ${x} ${topY}`;
        }
        return;
      }

      const prevNode = sortedData[i - 1];
      const x1 = getX(prevNode.date);
      const x2 = x;

      const cpX = x1 + (x2 - x1) * 0.5;
      const cpY = yFloor + (yFloor - topY) * 0.3;

      const segment = ` Q ${cpX} ${cpY} ${x2} ${yFloor} L ${x2} ${topY}`;

      if (node.type === "actual") {
        if (!historyPath) {
          historyPath = `M ${x1} ${topY}`;
          historyArea = `M ${x1} ${bottomY} L ${x1} ${topY}`;
        }

        historyPath += segment;
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

    const points = sortedData.map((node) => ({
      ...node,
      x: getX(node.date),
      y: topY,
    }));

    return {
      topY,
      bottomY,
      historyPath,
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

  // measure real path lengths
  useEffect(() => {
    if (!geometry) return;

    requestAnimationFrame(() => {
      try {
        const hLen = geometry.historyPath
          ? (historyMeasureRef.current?.getTotalLength?.() ?? 0)
          : 0;
        const pLen = geometry.projectionPath
          ? (projectionMeasureRef.current?.getTotalLength?.() ?? 0)
          : 0;

        setHistoryLength(hLen);
        setProjectionLength(pLen);
      } catch {
        setHistoryLength(0);
        setProjectionLength(0);
      }
    });
  }, [geometry]);

  // animate only after lengths are ready
  useEffect(() => {
    if (!geometry) return;

    if (
      (geometry.historyPath && historyLength <= 0) ||
      (geometry.projectionPath && projectionLength <= 0)
    ) {
      return;
    }

    historyAnim.stopAnimation();
    projectionAnim.stopAnimation();
    nodeAnim.stopAnimation();

    historyAnim.setValue(0);
    projectionAnim.setValue(0);
    nodeAnim.setValue(0);

    const BASE_HISTORY_DURATION = 1500;
    const BASE_PROJECTION_DURATION = 1300;
    const REFERENCE_LENGTH = 700;

    const computedHistoryDuration = Math.max(
      900,
      Math.round(
        (Math.max(historyLength, 1) / REFERENCE_LENGTH) * BASE_HISTORY_DURATION,
      ),
    );

    const computedProjectionDuration = Math.max(
      800,
      Math.round(
        (Math.max(projectionLength, 1) / REFERENCE_LENGTH) *
          BASE_PROJECTION_DURATION,
      ),
    );

    Animated.sequence([
      Animated.delay(initialDelay),

      Animated.timing(historyAnim, {
        toValue: 1,
        duration: computedHistoryDuration,
        easing: Easing.linear,
        useNativeDriver: false,
      }),

      Animated.timing(projectionAnim, {
        toValue: 1,
        duration: computedProjectionDuration,
        easing: Easing.linear,
        useNativeDriver: false,
      }),

      Animated.timing(nodeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [
    geometry,
    historyLength,
    projectionLength,
    historyAnim,
    projectionAnim,
    nodeAnim,
    initialDelay,
  ]);

  if (!geometry) {
    return <View onLayout={onLayout} style={styles.container} />;
  }

  const { historyPath, projectionPath, historyArea, projectionArea, points } =
    geometry;

  const animatedHistoryOffset = historyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [historyLength || 1, 0],
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
    <View onLayout={onLayout} style={styles.container}>
      {containerWidth > 0 && containerHeight > 0 && (
        <Svg width={containerWidth} height={containerHeight}>
          <Defs>
            <LinearGradient id="gradHistory" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.history} stopOpacity="0.22" />
              <Stop offset="1" stopColor={COLORS.history} stopOpacity="0" />
            </LinearGradient>

            <LinearGradient id="gradProjection" x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0"
                stopColor={COLORS.projection}
                stopOpacity="0.18"
              />
              <Stop offset="1" stopColor={COLORS.projection} stopOpacity="0" />
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

          {/* area fills */}
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

          {/* hidden measurement paths */}
          {historyPath ? (
            <Path
              ref={historyMeasureRef}
              d={historyPath}
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

          {/* visible animated lines */}
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

          {/* nodes */}
          {points.map((node, i) => {
            const opacity = nodeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            });

            return (
              <AnimatedCircle
                key={`${node.date}-${i}`}
                cx={node.x}
                cy={node.y}
                r={node.type === "actual" ? 5 : 4.5}
                fill={
                  node.type === "actual" ? COLORS.history : COLORS.background
                }
                stroke={
                  node.type === "actual" ? COLORS.history : COLORS.projection
                }
                strokeWidth={3}
                opacity={opacity}
              />
            );
          })}

          {/* labels */}
          <SvgText x={14} y={14} fill={COLORS.text} fontSize="10">
            Retention
          </SvgText>
        </Svg>
      )}
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
