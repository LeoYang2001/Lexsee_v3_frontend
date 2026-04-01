// WordBarChart.tsx - React Components instead of SVG
import React, { useEffect, useMemo } from "react";
import { View, ScrollView, Text, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SlideInLeft,
} from "react-native-reanimated";
import { UserProfile } from "../../store/slices/profileSlice";

interface WordBarChartProps {
  words: any[];
  width: number;
  maxHeight?: number;
  onSelectWord?: (wordId: string, index: number) => void;
  profile?: UserProfile | null;
}

const CHART_CONFIG = {
  barHeight: 28,
  barGap: 20,
  fontSize: 15,
  labelColor: "#9CA3AF",
  trackColor: "#454545",
  labelFontSize: 12,
  marginTop: 24,
  xAxisHeight: 50,
  barCornerRadius: 4,
};

const LABEL_WIDTH = 100;
const ANIMATION_DURATION = 1200;

// Animated bar component
interface AnimatedBarProps {
  width: number;
  barColor: string;
  opacity?: number;
  zIndex?: number;
  progressGain?: number;
  totalProgress?: number;
  MAX_INTERVAL: number;
}

const AnimatedBar: React.FC<AnimatedBarProps> = ({
  width,
  barColor,
  opacity = 1,
  zIndex = 0,
  progressGain = 0,
  totalProgress = 0,
  MAX_INTERVAL,
}) => {
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(width, {
      duration: ANIMATION_DURATION,
    });
  }, [width, animatedWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: animatedWidth.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height: "100%",
          backgroundColor: barColor,
          borderRadius: CHART_CONFIG.barCornerRadius,
          opacity,
          position: zIndex > 0 ? "absolute" : "relative",
          zIndex,
        },
        animatedStyle,
      ]}
    >
      {totalProgress < 85 ? (
        <View
          className=" absolute   w-[30px]  h-full   justify-center items-center "
          style={{
            left: "100%",
          }}
        >
          <Animated.Text
            entering={SlideInLeft}
            style={{
              color: barColor,
              fontSize: 10,
              fontWeight: "600",
              opacity: 0.8,
            }}
            numberOfLines={1}
          >
            +{Math.round((progressGain / MAX_INTERVAL) * 100)}%
          </Animated.Text>
        </View>
      ) : (
        <View
          className=" absolute   w-[30px]  h-full   justify-center items-center "
          style={{
            right: "0%",
          }}
        >
          <Animated.Text
            entering={SlideInLeft}
            style={{
              color: "#fff",
              fontSize: 10,
              fontWeight: "600",
              opacity: 0.8,
            }}
            numberOfLines={1}
          >
            +{Math.round(progressGain)}
          </Animated.Text>
        </View>
      )}
    </Animated.View>
  );
};

const WordBarChart: React.FC<WordBarChartProps> = ({
  words,
  width,
  onSelectWord,
  profile,
}) => {
  const chartWidth = width - LABEL_WIDTH - 30;
  const MAX_INTERVAL = profile?.masteryIntervalDays || 180;

  return (
    <View className="  w-full h-full  flex-col  py-12">
      <View className=" w-full h-full  relative">
        {/* Grid Background */}
        <View
          className=" absolute top-0  w-[80%] h-full left-[20%]"
          style={{
            zIndex: 0,
          }}
        >
          {/* Vertical Grid Lines */}
          {[0, 25, 50, 75, 100].map((value) => {
            return (
              <View
                key={`v-grid-${value}`}
                style={{
                  position: "absolute",
                  left: `${value}%`,
                  top: 0,
                  width: 1,
                  height: "100%",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                }}
              />
            );
          })}
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, width: "100%" }}
          className=""
        >
          {/* Bars */}
          <View style={{ marginTop: CHART_CONFIG.marginTop }}>
            {words.map((word, index) => {
              const targetInterval = word.timeline[0]?.interval || 0;
              const previousInterval = word.timeline[1]?.interval || 0;
              const progressGain = targetInterval - previousInterval;

              let barColor = "#FA541C";
              if (progressGain > 0) {
                barColor = "#34D399";
              } else if (progressGain < 0) {
                barColor = "#EF4444";
              }

              const targetBarWidth =
                (targetInterval / MAX_INTERVAL) * chartWidth;
              const previousBarWidth =
                (previousInterval / MAX_INTERVAL) * chartWidth;

              return (
                <TouchableOpacity
                  key={word.id}
                  style={{
                    marginBottom: CHART_CONFIG.barGap,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() => onSelectWord?.(word.id, index)}
                >
                  {/* Word Label */}
                  <View className=" " style={{ width: "20%" }}>
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 12,
                        fontWeight: "500",
                        textAlign: "right",
                      }}
                      className=" mr-2"
                      numberOfLines={1}
                    >
                      {word.content}
                    </Text>
                  </View>

                  {/* Bar Container */}
                  <View
                    style={{
                      flex: 1,
                      height: CHART_CONFIG.barHeight,
                      backgroundColor: CHART_CONFIG.trackColor,
                      borderRadius: CHART_CONFIG.barCornerRadius,
                      overflow: "hidden",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {/* Target Bar */}
                    <AnimatedBar
                      MAX_INTERVAL={MAX_INTERVAL}
                      totalProgress={(targetInterval / MAX_INTERVAL) * 100}
                      width={targetBarWidth}
                      progressGain={progressGain}
                      barColor={barColor}
                      opacity={1}
                    />

                    {/* Previous Bar - Ghost overlay */}
                    {previousInterval > 0 && (
                      <View
                        style={{
                          position: "absolute",
                          height: "100%",
                          width: previousBarWidth,
                          backgroundColor: "#FA541C",
                          zIndex: 10,
                        }}
                      />
                    )}

                    {/* Progress Indicator Text */}
                    {progressGain !== 0 && (
                      <View
                        style={{
                          position: "absolute",
                          left: previousBarWidth + 4,
                          top: 0,
                          height: "100%",
                          justifyContent: "center",
                          paddingHorizontal: 4,
                        }}
                      ></View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* X-Axis Footer */}
      <View
        style={{
          height: CHART_CONFIG.xAxisHeight,
          width: "100%",
          borderTopWidth: 1.5,
          borderTopColor: "rgba(255, 255, 255, 0.2)",
          flexDirection: "row",
          alignItems: "flex-start",
        }}
        className=" w-full"
      >
        <View className=" w-[20%] h-full" />
        {[0, 25, 50, 75].map((value) => {
          return (
            <View
              key={`axis-${value}`}
              style={{
                alignItems: "center",
              }}
              className="  -left-[10%]  flex-1 h-full  "
            >
              <View
                style={{
                  width: 1,
                  height: 8,
                  backgroundColor: CHART_CONFIG.labelColor,
                  marginBottom: 4,
                }}
              />
              <Text
                style={{
                  color: CHART_CONFIG.labelColor,
                  fontSize: CHART_CONFIG.labelFontSize,
                }}
                className=" font-semibold"
              >
                {value}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default WordBarChart;
