import React, { useState } from "react";
import { View, Text, Dimensions } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

const { width: windowWidth } = Dimensions.get("window");
const CARD_WIDTH = windowWidth * 0.65;
const SPACER = (windowWidth - CARD_WIDTH) / 2;

const MODES = [
  {
    id: "STABILITY",
    title: "Stability",
    emoji: "🧘",
    desc: "Long-term mastery with slow, steady pacing. Perfect for deep learning.",
    features: [
      "Spaced repetition optimized",
      "Lower daily load",
      "Focus on retention",
    ],
  },
  {
    id: "BALANCED",
    title: "Balanced",
    emoji: "⚖️",
    desc: "A healthy mix of speed and depth. Great for consistent progress.",
    features: [
      "Moderate daily goals",
      "Mixed review cycles",
      "Flexible pacing",
    ],
  },
  {
    id: "EXAM_READY",
    title: "Exam Ready",
    emoji: "🚀",
    desc: "High intensity mode for upcoming tests. Maximize short-term recall.",
    features: [
      "Accelerated reviews",
      "Higher daily load",
      "Cramming optimized",
    ],
  },
];

export const FormStepThree = () => {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  return (
    <View className="flex-1 flex-col justify-between px-6 pt-24 pb-10">
      <View className="gap-2 mb-8">
        <Text className="text-3xl font-bold text-white leading-tight">
          Select your study mode
        </Text>
        <Text className="text-[#9CA3AF] text-sm leading-5">
          Your selection determines how LexSee structures your daily plan,
          pacing, and long-term mastery.
        </Text>
      </View>

      <View style={{ flex: 1, marginHorizontal: -24 }}>
        <Animated.ScrollView
          horizontal
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          snapToInterval={CARD_WIDTH}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: SPACER, // Centers the first and last cards
            alignItems: "center",
          }}
        >
          {MODES.map((mode, index) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              index={index}
              scrollX={scrollX}
            />
          ))}
        </Animated.ScrollView>
      </View>
    </View>
  );
};

const ModeCard = ({ mode, index, scrollX }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.88, 1, 0.88],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolate.CLAMP,
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: CARD_WIDTH,
          height: 340,
          backgroundColor: "#1C1F26",
          borderRadius: 28,
          padding: 28,
          justifyContent: "flex-start",
          borderWidth: 1,
          borderColor: "#2D3036",
        },
      ]}
    >
      {/* Emoji Header */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Text style={{ fontSize: 48 }}>{mode.emoji}</Text>
      </View>

      {/* Title */}
      <Text className="text-white text-2xl font-bold text-center mb-3">
        {mode.title}
      </Text>

      {/* Description */}
      <Text className="text-gray-400 text-center text-sm leading-5 mb-5">
        {mode.desc}
      </Text>

      {/* Features */}
      <View style={{ gap: 8 }}>
        {mode.features.map((feature: string, i: number) => (
          <View
            key={i}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <Text style={{ color: "#FA541C", fontSize: 12 }}>●</Text>
            <Text className="text-gray-300 text-xs">{feature}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};
