import React, { useEffect, useState, useMemo, use } from "react";
import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideInDown,
} from "react-native-reanimated";
import { X, ChevronDown, ChevronUp } from "lucide-react-native";
import { useWordProjection } from "../../hooks/useWordProjection";
import SpacedRepetitionChart from "../progress/SpacedRepetitionChart";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useWordDataScience } from "../../hooks/useWordDataScience";

interface WordDetailBottomSheetProps {
  isVisible: boolean;
  selectedWord: any | null;
  onClose: () => void;
  masteryGoalDays?: number; // Optional prop to customize mastery goal
}

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");
const SHEET_HEIGHT = screenHeight * 0.8;

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case "success":
      return "#4ADE80"; // Green
    case "info":
      return "#60A5FA"; // Blue
    case "warning":
      return "#FACC15"; // Yellow/Orange
    default:
      return "#94A3B8"; // Gray
  }
};

const WordDetailBottomSheet: React.FC<WordDetailBottomSheetProps> = ({
  isVisible,
  selectedWord,
  onClose,
  masteryGoalDays = 180, // Default mastery goal
}) => {
  const [chartWidth, setChartWidth] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true); // true = Chart, false = Progress Line

  const translateY = useSharedValue(SHEET_HEIGHT);
  const expandedAnim = useSharedValue(isExpanded ? 1 : 0);

  // Reset expanded state and animations when a different word is selected
  useEffect(() => {
    if (selectedWord) {
      setIsExpanded(true); // Reset to expanded view
      expandedAnim.value = 1; // Sync animation value
    }
  }, [selectedWord?.id]); // Depend on word ID to detect changes

  useEffect(() => {
    translateY.value = withTiming(isVisible ? 0 : SHEET_HEIGHT, {
      duration: 300,
    });
    if (!isVisible) setIsExpanded(true); // Reset to chart when closing
  }, [isVisible]);

  useEffect(() => {
    expandedAnim.value = withTiming(isExpanded ? 1 : 0, { duration: 300 });
  }, [isExpanded]);

  // --- Animation Styles ---
  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const chartContainerStyle = useAnimatedStyle(() => ({
    height: withTiming(isExpanded ? 240 : 80), // Adjusted height for progress bar
    opacity: 1,
  }));

  const fadeOutChart = useAnimatedStyle(() => ({
    opacity: withTiming(isExpanded ? 1 : 0),
    transform: [{ scale: withTiming(isExpanded ? 1 : 0.95) }],
    // Prevent the chart from catching touches or blocking layout when hidden
    pointerEvents: isExpanded ? "auto" : "none",
  }));

  const fadeInProgressBar = useAnimatedStyle(() => ({
    opacity: withTiming(isExpanded ? 0 : 1),
    transform: [{ translateY: withTiming(isExpanded ? 10 : 0) }],
    position: "absolute", // Float it so it doesn't get pushed by the hidden chart
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: isExpanded ? "none" : "auto",
  }));

  const {
    timeline: projectedTimeline,
    estimatedMasteryDate,
    daysToMastery,
  } = useWordProjection(selectedWord);

  const wordDataScience = useWordDataScience(selectedWord, masteryGoalDays);

  // Calculate insights using the data science hook
  const insights = useMemo(() => {
    if (!wordDataScience) return null;

    return {
      velocity: {
        ...wordDataScience.velocity,
        sentiment: wordDataScience.velocity?.sentiment || "info",
      },
      daysToMastery: {
        label: "Days to Mastery",
        value: daysToMastery || "N/A",
        desc: "Estimated days until this word reaches full mastery.",
        sentiment: "success", // Always green
      },
      resilience: {
        ...wordDataScience.resilience,
        sentiment: wordDataScience.resilience?.sentiment || "info",
      },
      mentalEffort: {
        ...wordDataScience.mentalEffort,
        sentiment: wordDataScience.mentalEffort?.sentiment || "info",
      },
      unifiedDesc: wordDataScience.unifiedDesc,
    };
  }, [wordDataScience, daysToMastery]);

  // Calculate stats for the progress line
  const stats = useMemo(() => {
    if (!projectedTimeline.length) return { progress: 0, currentInterval: 0 };
    const actuals = projectedTimeline.filter((n) => n.type === "actual");
    const lastActual = actuals[actuals.length - 1] || projectedTimeline[0];
    return {
      progress: Math.min((lastActual.interval / masteryGoalDays) * 100, 100),
      currentInterval: lastActual.interval,
    };
  }, [projectedTimeline, masteryGoalDays]);

  if (!selectedWord) return null;

  return (
    <>
      {/* Full Screen Backdrop - Positioned relative to screen */}
      <Animated.View
        pointerEvents={isVisible ? "auto" : "none"}
        style={{
          position: "absolute",
          width: screenWidth * 2,
          height: screenHeight * 2,
          backgroundColor: isVisible ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
          zIndex: 40,
          top: -screenHeight * 0.5,
          left: -screenWidth * 0.5,
        }}
        onTouchEnd={onClose}
      />

      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: SHEET_HEIGHT,
            backgroundColor: "#121212",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            zIndex: 50,
            paddingHorizontal: 20,
            paddingTop: 12,
          },
          animatedSheetStyle,
        ]}
      >
        <View
          style={{
            width: 40,
            height: 4,
            backgroundColor: "#333",
            alignSelf: "center",
            borderRadius: 2,
            marginBottom: 20,
            opacity: 0,
          }}
        />

        <GestureHandlerRootView style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
            className=" flex flex-col"
          >
            {/* Header Section */}
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-1">
                <Text className="text-white text-4xl font-bold">
                  {selectedWord.content}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Mastery projected by {estimatedMasteryDate}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="bg-[#222] p-2 rounded-full"
              >
                <X color="#888" size={20} />
              </Pressable>
            </View>

            {/* Dynamic Chart/Bar Container */}
            <Pressable onPress={() => setIsExpanded(!isExpanded)}>
              <View className="bg-[#1A1A1A] rounded-3xl p-5 mb-6 overflow-hidden">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-gray-400 text-xs font-bold tracking-widest">
                    {isExpanded ? "LEARNING TRAJECTORY" : "MASTERY PROGRESS"}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-gray-500 text-[10px] font-semibold uppercase">
                      Tap to {isExpanded ? "minimize" : "expand"}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={14} color="#9CA3AF" />
                    ) : (
                      <ChevronDown size={14} color="#9CA3AF" />
                    )}
                  </View>
                </View>

                <Animated.View style={chartContainerStyle}>
                  {/* Full Chart View */}
                  <Animated.View
                    style={[fadeOutChart, { height: 240 }]}
                    onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
                  >
                    {chartWidth > 0 && (
                      <SpacedRepetitionChart data={projectedTimeline} />
                    )}
                  </Animated.View>

                  {/* Progress Line View - Now with absolute positioning fix */}
                  <Animated.View style={fadeInProgressBar}>
                    <View className="flex-row justify-between items-end mb-2">
                      <View>
                        <Text className="text-white text-2xl font-bold">
                          {Math.round(stats.progress)}%
                        </Text>
                        <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">
                          Mastery Strength
                        </Text>
                      </View>
                      <Text className="text-gray-500 text-xs font-mono">
                        {stats.currentInterval} / {masteryGoalDays}d
                      </Text>
                    </View>
                    <View className="h-2 w-full bg-[#333] rounded-full overflow-hidden">
                      <View
                        style={{ width: `${stats.progress}%` }}
                        className="h-full bg-orange-500 rounded-full"
                      />
                    </View>
                  </Animated.View>
                </Animated.View>
              </View>
            </Pressable>

            {/* Data Science Insights Section */}
            <View className="flex-1  space-y-4">
              <Text className="text-gray-400 text-xs font-bold tracking-widest mb-2">
                INSIGHTS
              </Text>

              {/* 2x2 Grid */}
              <View
                className="grid gap-3"
                style={{ columnGap: 12, rowGap: 12 }}
              >
                {/* Row 1 */}
                <View className="flex-row gap-3">
                  {/* Learning Velocity */}
                  <View className="flex-1 bg-[#1A1A1A] p-4 rounded-2xl">
                    <Text className="text-gray-400 text-xs font-semibold mb-2">
                      {insights?.velocity.label}
                    </Text>
                    <Text
                      style={{
                        color: getSentimentColor(
                          insights?.velocity?.sentiment || "info",
                        ),
                        fontSize: 18,
                        fontWeight: "700",
                      }}
                    >
                      {insights?.velocity.value}
                    </Text>
                    {isExpanded === false && (
                      <Text className="text-gray-500 text-xs mt-2 leading-relaxed">
                        {insights?.velocity.desc}
                      </Text>
                    )}
                  </View>

                  {/* Days to Mastery */}
                  <View className="flex-1 bg-[#1A1A1A] p-4 rounded-2xl">
                    <Text className="text-gray-400 text-xs font-semibold mb-2">
                      {insights?.daysToMastery.label}
                    </Text>
                    <Text
                      style={{
                        color: getSentimentColor(
                          insights?.daysToMastery?.sentiment || "success",
                        ),
                        fontSize: 18,
                        fontWeight: "700",
                      }}
                    >
                      {insights?.daysToMastery.value}
                    </Text>
                    {isExpanded === false && (
                      <Text className="text-gray-500 text-xs mt-2 leading-relaxed">
                        {insights?.daysToMastery.desc}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Row 2 */}
                <View className="flex-row gap-3">
                  {/* Memory Resilience */}
                  <View className="flex-1 bg-[#1A1A1A] p-4 rounded-2xl">
                    <Text className="text-gray-400 text-xs font-semibold mb-2">
                      {insights?.resilience.label}
                    </Text>
                    <Text
                      style={{
                        color: getSentimentColor(
                          insights?.resilience?.sentiment || "info",
                        ),
                        fontSize: 18,
                        fontWeight: "700",
                      }}
                    >
                      {insights?.resilience.value}
                    </Text>
                    {isExpanded === false && (
                      <Text className="text-gray-500 text-xs mt-2 leading-relaxed">
                        {insights?.resilience.desc}
                      </Text>
                    )}
                  </View>

                  {/* Mental Effort */}
                  <View className="flex-1 bg-[#1A1A1A] p-4 rounded-2xl">
                    <Text className="text-gray-400 text-xs font-semibold mb-2">
                      {insights?.mentalEffort.label}
                    </Text>
                    <Text
                      style={{
                        color: getSentimentColor(
                          insights?.mentalEffort?.sentiment || "info",
                        ),
                        fontSize: 18,
                        fontWeight: "700",
                      }}
                    >
                      {insights?.mentalEffort.value}
                    </Text>
                    {isExpanded === false && (
                      <Text className="text-gray-500 text-xs mt-2 leading-relaxed">
                        {insights?.mentalEffort.desc}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Unified Description - Always renders, fades based on expanded state */}
              {isExpanded === false && (
                <Animated.View
                  entering={SlideInDown}
                  exiting={FadeOut}
                  className="bg-[#1A1A1A] p-4 rounded-2xl mt-4"
                >
                  <Text className="text-gray-300 text-sm leading-relaxed">
                    {insights?.unifiedDesc}
                  </Text>
                </Animated.View>
              )}
            </View>
          </ScrollView>
        </GestureHandlerRootView>
      </Animated.View>
    </>
  );
};

export default WordDetailBottomSheet;
