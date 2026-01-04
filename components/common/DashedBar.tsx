// DashedBar.tsx
import React from "react";
import { View, StyleSheet } from "react-native";

interface DashedBarProps {
  segments?: number; // optional
  totalWidth?: number; // optional
  barWidth?: number;
  barHeight?: number;
  barColor?: string;
  gap?: number;
  backgroundColor?: string;
  borderRadius?: number;
}

const DashedBar: React.FC<DashedBarProps> = ({
  segments,
  totalWidth,
  barWidth = 6,
  barHeight = 20,
  barColor = "#aaa",
  gap = 4,
  backgroundColor = "#1f1f1f",
  borderRadius = 12,
}) => {
  // --- Logic: decide which mode to use ---
  let finalSegments = segments ?? 20; // fallback default

  if (!segments && totalWidth) {
    // how many bars fit into the width?
    // each "unit" = barWidth + gap
    const unit = barWidth + gap;
    finalSegments = Math.floor(totalWidth / unit);
  }

  const bars = Array.from({ length: finalSegments });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderRadius,
          width: totalWidth ?? "auto",
        },
      ]}
    >
      {bars.map((_, i) => (
        <View
          key={i}
          style={{
            width: barWidth,
            height: barHeight,
            backgroundColor: barColor,
            borderRadius: barWidth / 2,
            marginRight: i === finalSegments - 1 ? 0 : gap,
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default DashedBar;
