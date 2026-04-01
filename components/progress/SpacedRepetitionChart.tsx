import React from "react";
import { View, Dimensions } from "react-native";
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
import { parseISO } from "date-fns";

interface SpacedRepetitionChartProps {
  data: any[]; // Data from your useWordProjection hook
  width?: number;
  height?: number;
}

const COLORS = {
  history: "#FA541C", // Bright Orange (Your original color)
  projection: "#8B5CF6", // Royal Purple (For Estimates)
  grid: "rgba(255, 255, 255, 0.1)",
  text: "#9CA3AF",
  background: "#000",
};

const SpacedRepetitionChart: React.FC<SpacedRepetitionChartProps> = ({
  data,
  width = Dimensions.get("window").width - 32,
  height = 260,
}) => {
  if (!data || data.length < 2) return null;

  const PADDING_X = 40;
  const PADDING_Y = 30;
  const chartW = width - PADDING_X * 2;
  const chartH = height - PADDING_Y * 2;

  // Scale calculations
  const firstTime = parseISO(data[0].date).getTime();
  const lastTime = parseISO(data[data.length - 1].date).getTime();
  const totalDuration = Math.max(lastTime - firstTime, 1);

  const getX = (dateStr: string) => {
    const time = parseISO(dateStr).getTime();
    return PADDING_X + ((time - firstTime) / totalDuration) * chartW;
  };

  const getY = (retention: number) => PADDING_Y + (1 - retention) * chartH;

  // Split your path strings
  let historyPath = "";
  let projectionPath = "";
  let historyArea = "";
  let projectionArea = "";

  data.forEach((node, i) => {
    const x = getX(node.date);
    const yTop = getY(1);
    const yBot = getY(0);

    // Starting Point
    if (i === 0) {
      historyPath = `M ${x} ${yTop}`;
      historyArea = `M ${x} ${yBot} L ${x} ${yTop}`;
      return;
    }

    const prevNode = data[i - 1];
    const x1 = getX(prevNode.date);
    const x2 = getX(node.date);

    // Exponential Decay geometry
    const cpX = x1 + (x2 - x1) * 0.5;
    const cpY = getY(1.05); // Control point above to create the curve 'dip'
    const endDecayY = getY(0.75); // User reviewed just above threshold
    const segment = ` Q ${cpX} ${cpY} ${x2} ${endDecayY} L ${x2} ${yTop}`;

    if (node.type === "actual") {
      historyPath += segment;
      historyArea += segment;

      // Handle the split point
      if (data[i + 1]?.type === "estimated") {
        historyArea += ` L ${x2} ${yBot} Z`; // Close historical area
      }
    } else {
      // PROJECTION SEGMENT
      if (projectionPath === "") {
        projectionPath = `M ${x1} ${yTop}` + segment;
        projectionArea = `M ${x1} ${yBot} L ${x1} ${yTop}` + segment;
      } else {
        projectionPath += segment;
        projectionArea += segment;
      }

      // Final close
      if (i === data.length - 1) {
        projectionArea += ` L ${x2} ${yBot} Z`;
      }
    }
  });

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: COLORS.background,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <Svg width={width} height={height}>
        <Defs>
          {/* Historical Gradient (Orange) */}
          <LinearGradient id="gradHistory" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.history} stopOpacity="0.25" />
            <Stop offset="1" stopColor={COLORS.history} stopOpacity="0" />
          </LinearGradient>

          {/* Projected Gradient (Purple) */}
          <LinearGradient id="gradProjection" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.projection} stopOpacity="0.2" />
            <Stop offset="1" stopColor={COLORS.projection} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* 1. Threshold Line (75%) */}
        <Line
          x1={PADDING_X}
          y1={getY(0.75)}
          x2={width - PADDING_X}
          y2={getY(0.75)}
          stroke={COLORS.grid}
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        {/* 2. Gradient Areas */}
        <Path d={historyArea} fill="url(#gradHistory)" />
        <Path d={projectionArea} fill="url(#gradProjection)" />

        {/* 3. Lines */}
        {/* Estimated Line (Purple, Dashed) */}
        <Path
          d={projectionPath}
          stroke={COLORS.projection}
          strokeWidth="2.5"
          strokeDasharray="6 4"
          fill="none"
        />

        {/* Actual Line (Orange, Solid) */}
        <Path
          d={historyPath}
          stroke={COLORS.history}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* 4. The Points (Review Events) */}
        {data.map((node, i) => {
          const isActual = node.type === "actual";
          return (
            <Circle
              key={`node-${i}`}
              cx={getX(node.date)}
              cy={getY(1)}
              r={isActual ? 4 : 3.5}
              fill={isActual ? COLORS.history : COLORS.background}
              stroke={isActual ? COLORS.history : COLORS.projection}
              strokeWidth="2.5"
            />
          );
        })}
      </Svg>
    </View>
  );
};

export default SpacedRepetitionChart;
