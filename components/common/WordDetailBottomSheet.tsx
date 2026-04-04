import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { X } from "lucide-react-native";
import { useWordProjection } from "../../hooks/useWordProjection";
import SpacedRepetitionChart from "../progress/SpacedRepetitionChart";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface WordDetailBottomSheetProps {
  isVisible: boolean;
  selectedWord: any | null;
  onClose: () => void;
}

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");
const SHEET_HEIGHT = screenHeight * 0.7;

const WordDetailBottomSheet: React.FC<WordDetailBottomSheetProps> = ({
  isVisible,
  selectedWord,
  onClose,
}) => {
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  });

  const translateY = useSharedValue(SHEET_HEIGHT);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 300 });
    }
  }, [isVisible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: isVisible ? 1 : 0,
  }));

  const handleChartLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setChartDimensions({ width, height });
  };

  const {
    timeline: projectedTimeline,
    estimatedMasteryDate,
    daysToMastery,
  } = useWordProjection(selectedWord);

  // Early return AFTER all hooks
  if (!selectedWord) return null;

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -screenHeight,
            left: -screenWidth,
            right: -screenWidth,
            bottom: -screenHeight,
            width: screenWidth * 3,
            height: screenHeight * 3,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: 40,
            pointerEvents: isVisible ? "auto" : "none",
          },
          backdropStyle,
        ]}
        onTouchEnd={onClose}
      />

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: SHEET_HEIGHT,
            backgroundColor: "#202123",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            zIndex: 50,
            pointerEvents: isVisible ? "auto" : "none",
          },
          animatedStyle,
        ]}
      >
        <GestureHandlerRootView>
          <ScrollView
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            className="flex-1 px-4 pt-4"
          >
            {/* Header with Close Button */}
            <View className="flex-row items-center justify-between mb-6">
              <Text
                style={{
                  color: "#9CA3AF",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                WORD DETAILS
              </Text>
              <Pressable
                onPress={onClose}
                className="p-2"
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <X color="#9CA3AF" size={20} />
              </Pressable>
            </View>

            {/* Word and Mastery Days */}
            <View className="flex-row items-end justify-between mb-6">
              <View className="flex-1">
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 32,
                    fontWeight: "bold",
                  }}
                  numberOfLines={2}
                >
                  {selectedWord.content}
                </Text>
              </View>
              <View className="items-end ml-4">
                <Text
                  style={{
                    color: "#9CA3AF",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Estimated
                </Text>
                <View className="flex-row items-baseline gap-1">
                  <Text
                    style={{
                      color: "#34D399",
                      fontSize: 24,
                      fontWeight: "bold",
                    }}
                  >
                    {daysToMastery}
                  </Text>
                  <Text
                    style={{
                      color: "#9CA3AF",
                      fontSize: 12,
                    }}
                  >
                    days
                  </Text>
                </View>
              </View>
            </View>

            {/* Mastery Date Info */}
            {estimatedMasteryDate && (
              <View className="px-3 py-2 bg-[#1a1a1c] rounded-lg mb-6">
                <Text
                  style={{
                    color: "#9CA3AF",
                    fontSize: 11,
                    fontWeight: "500",
                  }}
                >
                  Estimated mastery:{" "}
                  <Text style={{ color: "#34D399" }}>
                    {new Date(estimatedMasteryDate).toLocaleDateString()}
                  </Text>
                </Text>
              </View>
            )}

            {/* Timeline Chart Section */}
            {selectedWord.timeline && selectedWord.timeline.length > 0 && (
              <View className="w-full mt-4">
                <Text
                  style={{
                    color: "#9CA3AF",
                    fontSize: 12,
                    fontWeight: "600",
                    marginBottom: 12,
                  }}
                >
                  LEARNING TRAJECTORY
                </Text>
                <View
                  onLayout={handleChartLayout}
                  className=""
                  style={{ height: 240 }}
                >
                  {chartDimensions.width > 0 && isVisible && (
                    <SpacedRepetitionChart data={projectedTimeline} />
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </GestureHandlerRootView>
      </Animated.View>
    </>
  );
};

export default WordDetailBottomSheet;
