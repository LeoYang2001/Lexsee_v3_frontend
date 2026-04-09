import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { ChevronLeft, EllipsisVertical } from "lucide-react-native";
import ProgressBar from "../../components/common/ProgressBar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Card1Content from "../../components/progress/Card1Content";
import { useAppSelector } from "../../store/hooks";
import { wordsListSelector } from "../../store/selectors/wordsListSelector";
import ProgressReview from "../../components/progress/ProgressReview";
import { getLocalDate } from "../../util/utli";
import LearningPulse from "../../components/progress/LearningPulse";
type ViewMode = "default" | "card1Expanded" | "card2Expanded";

// Constants
const { width, height } = Dimensions.get("window");
const BORDER_RADIUS = Math.min(width, height) * 0.06;
const COLLAPSED_CARD_HEIGHT_PX = 60;
const COLLAPSED_BORDER_RADIUS = BORDER_RADIUS * 2; // top corners for collapsed card2
const EXPANDED_BORDER_RADIUS = BORDER_RADIUS * 2;
const CARD1_COLLAPSED_HEIGHT = 25; // Card1 height when collapsed (%)
const CARD1_EXPANDED_HEIGHT = 50; // Card1 height when expanded (%)

const ProgressPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [containerHeight, setContainerHeight] = useState(0);
  const [selectedIso, setSelectedIso] = useState<string | null>(getLocalDate());

  const { collectedList, masteredList } = useAppSelector(wordsListSelector);

  // Animated values for card heights
  const card1Height = useSharedValue(0);
  const card2Height = useSharedValue(0);

  // Calculate collapsed card height as percentage
  const collapsedCardHeightPercentage =
    containerHeight > 0
      ? (COLLAPSED_CARD_HEIGHT_PX / containerHeight) * 100
      : 20;

  // Animated styles
  const card1AnimatedStyle = useAnimatedStyle(() => ({
    height: `${card1Height.value}%`,
  }));

  // Animate heights and border radius based on viewMode
  useEffect(() => {
    const duration = 300;

    switch (viewMode) {
      case "default":
        // Card 1: 15%, Card 2: 85%
        card1Height.value = withTiming(CARD1_COLLAPSED_HEIGHT, { duration });
        card2Height.value = withTiming(100 - CARD1_COLLAPSED_HEIGHT, {
          duration,
        });

        break;

      case "card1Expanded":
        // Card 1: 32%, Card 2: 68%
        card1Height.value = withTiming(CARD1_EXPANDED_HEIGHT, { duration });
        card2Height.value = withTiming(100 - CARD1_EXPANDED_HEIGHT, {
          duration,
        });

        break;
    }
  }, [viewMode, containerHeight, collapsedCardHeightPercentage]);

  // Handle card 1 press
  const handleCard1Press = () => {
    if (viewMode === "card1Expanded") {
      setViewMode("default");
    } else {
      setViewMode("card1Expanded");
    }
  };

  return (
    <View
      style={{
        backgroundColor: "#131416",
      }}
      className="w-full h-full flex flex-col"
    >
      {/* Header */}
      <View className="mt-16  mx-3 justify-between flex-row items-center">
        <TouchableOpacity
          onPress={() => {
            router.back();
          }}
        >
          <ChevronLeft color={"#fff"} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18 }} className="opacity-70 text-white">
          Recall Dashboard
        </Text>
        <TouchableOpacity className="p-2" onPress={() => {}}>
          <EllipsisVertical size={18} color={"#fff"} />
        </TouchableOpacity>
      </View>

      {/* Progress Overview */}
      <View className="flex w-full   px-6  mt-2 flex-col justify-center h-[15%]">
        <LearningPulse />
      </View>

      {/* Main Content - Expandable Cards Container */}
      <View
        className="mt-4  "
        style={{
          flex: 1,
          width: "100%",
          padding: 6,
          transform: [{ translateY: -6 }],
        }}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setContainerHeight(height);
          console.log(`📏 Container layout measured: ${height}px`);
        }}
      >
        {/* Card 1 - Today's Review */}
        <Animated.View
          style={[
            {
              overflow: "hidden",
              paddingHorizontal: 12,
            },
            card1AnimatedStyle,
          ]}
        >
          <TouchableOpacity
            className="flex flex-col   rounded-2xl   justify-start"
            onPress={handleCard1Press}
            style={{
              height: "100%",
              padding: 12,
              backgroundColor: "#202123",
            }}
          >
            <Card1Content
              selectedIso={selectedIso}
              setSelectedIso={setSelectedIso}
              viewMode={viewMode}
            />
          </TouchableOpacity>
        </Animated.View>

        <View className=" flex-1 mt-3 w-full  ">
          <ProgressReview viewMode={viewMode} selectedIso={selectedIso} />
        </View>
      </View>
    </View>
  );
};

export default ProgressPage;
