import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../store/hooks";
import { client } from "../client";
import { router } from "expo-router";
import { ChevronLeft, EllipsisVertical } from "lucide-react-native";
import ProgressBar from "../../components/common/ProgressBar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Card1Content from "../../components/progress/Card1Content";
import Card2Content from "../../components/progress/Card2Content";
type ViewMode = "default" | "card1Expanded" | "card2Expanded";

// Constants
const { width, height } = Dimensions.get("window");
const BORDER_RADIUS = Math.min(width, height) * 0.06;
const COLLAPSED_CARD_HEIGHT_PX = 60;
const COLLAPSED_BORDER_RADIUS = 16; // top corners for collapsed card2
const EXPANDED_BORDER_RADIUS = BORDER_RADIUS * 2;

const ProgressPage = () => {
  const words = useAppSelector((state) => state.wordsList.words);
  const userProfile = useAppSelector((state) => state.profile.data);
  const todaySchedule = useAppSelector(
    (state) => state.reviewSchedule.todaySchedule
  );
  const allSchedules = useAppSelector(
    (state) => state.reviewSchedule.allSchedules
  );

  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [containerHeight, setContainerHeight] = useState(0);

  // Animated values for card heights
  const card1Height = useSharedValue(0);
  const card2Height = useSharedValue(0);

  // Animated values for border radii (separate top / bottom)
  const card1TopRadius = useSharedValue(EXPANDED_BORDER_RADIUS);
  const card1BottomRadius = useSharedValue(EXPANDED_BORDER_RADIUS);
  const card2TopRadius = useSharedValue(EXPANDED_BORDER_RADIUS);
  const card2BottomRadius = useSharedValue(EXPANDED_BORDER_RADIUS);

  // Calculate word statistics
  const totalWords = words.length;
  const collectedWords = words.filter(
    (word) => word.status === "COLLECTED"
  ).length;
  const learnedWords = words.filter((word) => word.status === "LEARNED").length;

  // Calculate collapsed card height as percentage
  const collapsedCardHeightPercentage =
    containerHeight > 0
      ? (COLLAPSED_CARD_HEIGHT_PX / containerHeight) * 100
      : 20;

  // Animated styles
  const card1AnimatedStyle = useAnimatedStyle(() => ({
    height: `${card1Height.value}%`,
    borderTopLeftRadius: card1TopRadius.value,
    borderTopRightRadius: card1TopRadius.value,
    borderBottomLeftRadius: card1BottomRadius.value,
    borderBottomRightRadius: card1BottomRadius.value,
  }));

  const card2AnimatedStyle = useAnimatedStyle(() => ({
    height: `${card2Height.value}%`,
    // top corners animate (card2TopRadius), bottom corners stay expanded
    borderTopLeftRadius: card2TopRadius.value,
    borderTopRightRadius: card2TopRadius.value,
    borderBottomLeftRadius: card2BottomRadius.value,
    borderBottomRightRadius: card2BottomRadius.value,
  }));

  // Animate heights and border radius based on viewMode
  useEffect(() => {
    const duration = 300;

    switch (viewMode) {
      case "default":
        // Card 1: 63%, Card 2: 37%
        card1Height.value = withTiming(63, { duration });
        card2Height.value = withTiming(37, { duration });
        // both cards fully expanded (top & bottom)
        card1TopRadius.value = withTiming(EXPANDED_BORDER_RADIUS, { duration });
        card1BottomRadius.value = withTiming(EXPANDED_BORDER_RADIUS, {
          duration,
        });
        card2TopRadius.value = withTiming(EXPANDED_BORDER_RADIUS, { duration });
        card2BottomRadius.value = withTiming(EXPANDED_BORDER_RADIUS, {
          duration,
        });
        break;

      case "card1Expanded":
        // Card 1: expanded, Card 2: collapsed
        card1Height.value = withTiming(100 - collapsedCardHeightPercentage, {
          duration,
        });
        card2Height.value = withTiming(collapsedCardHeightPercentage, {
          duration,
        });
        // Card1: top expanded, bottom collapsed to visually match collapsed card2
        card1TopRadius.value = withTiming(EXPANDED_BORDER_RADIUS, { duration });
        card1BottomRadius.value = withTiming(COLLAPSED_BORDER_RADIUS, {
          duration,
        });
        // Card2: top collapsed, bottom stays expanded
        card2TopRadius.value = withTiming(COLLAPSED_BORDER_RADIUS, {
          duration,
        });
        card2BottomRadius.value = withTiming(EXPANDED_BORDER_RADIUS, {
          duration,
        });
        break;

      case "card2Expanded":
        // Card 1: collapsed, Card 2: expanded
        card1Height.value = withTiming(collapsedCardHeightPercentage, {
          duration,
        });
        card2Height.value = withTiming(100 - collapsedCardHeightPercentage, {
          duration,
        });
        // Card1 collapsed: top collapsed, bottom stays expanded
        card1TopRadius.value = withTiming(COLLAPSED_BORDER_RADIUS, {
          duration,
        });
        card1BottomRadius.value = withTiming(COLLAPSED_BORDER_RADIUS, {
          duration,
        });
        // Card2 expanded: top collapsed, bottom expanded (special visual)
        card2TopRadius.value = withTiming(COLLAPSED_BORDER_RADIUS, {
          duration,
        });
        card2BottomRadius.value = withTiming(EXPANDED_BORDER_RADIUS, {
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

  // Handle card 2 press
  const handleCard2Press = () => {
    console.log(`🖱️ Card 2 pressed - Current mode: ${viewMode}`);
    if (viewMode === "card2Expanded") {
      setViewMode("default");
    } else {
      setViewMode("card2Expanded");
    }
  };

  // Handle outside press (collapse cards)
  const handleOutsidePress = () => {
    if (viewMode !== "default") {
      console.log(`🖱️ Outside press - Returning to default`);
      setViewMode("default");
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
      <View className="flex w-full p-3 mt-6 flex-col justify-center">
        <View className="flex-row justify-around items-center mb-6">
          <View className="flex flex-col items-center gap-2">
            <Text
              style={{
                fontSize: 32,
                fontWeight: "400",
                color: "#FFFFFF",
              }}
            >
              {learnedWords}
            </Text>
            <View className="flex flex-row items-center justify-center gap-1">
              <Text
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                  color: "#FFFFFF",
                }}
              >
                Mastered
              </Text>
              <View
                style={{
                  height: 8,
                  width: 8,
                  borderRadius: 2,
                  backgroundColor: "#fff",
                  opacity: 0.7,
                }}
              />
            </View>
          </View>
          <View
            style={{
              height: 12,
              width: 1,
              backgroundColor: "#FFFFFF",
              opacity: 0.2,
            }}
          />
          <View className="flex flex-col items-center gap-2">
            <Text
              style={{
                fontSize: 32,
                fontWeight: "400",
                color: "#FFFFFF",
              }}
            >
              {collectedWords}
            </Text>
            <View className="flex flex-row items-center justify-center gap-1">
              <Text
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                  color: "#FFFFFF",
                }}
              >
                Collected
              </Text>
              <View
                style={{
                  height: 8,
                  width: 8,
                  borderRadius: 2,
                  backgroundColor: "#424345",
                  opacity: 0.7,
                }}
              />
            </View>
          </View>
        </View>

        {/* ProgressBar with animation */}
        <ProgressBar
          solidProgress={learnedWords / totalWords}
          dashedProgress={collectedWords / totalWords}
          height={11}
          solidColor="#c4c4c5"
          dashedColor="#424345"
          duration={2500}
        />
      </View>

      {/* Main Content - Expandable Cards Container */}
      <Pressable
        className="mt-10 "
        style={{
          flex: 1,
          width: "100%",
          padding: 6,
          transform: [{ translateY: -6 }],
        }}
        onPress={handleOutsidePress}
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
              backgroundColor: "#202123",
              overflow: "hidden",
            },
            card1AnimatedStyle,
          ]}
        >
          <Pressable
            className="flex flex-col justify-start"
            onPress={handleCard1Press}
            style={{ height: "100%", padding: 12 }}
          >
            <Card1Content
              viewMode={viewMode}
              allSchedules={allSchedules}
              todaySchedule={todaySchedule}
            />
          </Pressable>
        </Animated.View>

        {/* Card 2 - All-Time Schedules */}
        <Animated.View
          style={[
            {
              backgroundColor: "#202123",
              overflow: "hidden",
              marginTop: 6,
            },
            card2AnimatedStyle,
          ]}
        >
          <Pressable
            onPress={handleCard2Press}
            style={{ height: "100%", padding: 12 }}
          >
            <Card2Content
              viewMode={viewMode}
              isLoading={false}
            />
          </Pressable>
        </Animated.View>
      </Pressable>
    </View>
  );
};

export default ProgressPage;
