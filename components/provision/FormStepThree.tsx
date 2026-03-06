import React, { useState } from "react";
import {
  View,
  Text,
  Dimensions,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { GrowthStyle } from "../../store/slices/profileSlice";
import { MODES } from "./defaultConfig";

const { width: windowWidth } = Dimensions.get("window");
const CARD_WIDTH = windowWidth * 0.65;
const SPACER = (windowWidth - CARD_WIDTH) / 2;

export const FormStepThree = ({
  onNext,
  onBack,
  isLoading = false,
  step,
}: {
  onNext: (data: { growthStyle: GrowthStyle }) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  step: number;
}) => {
  const scrollX = useSharedValue(0);
  const [selectedMode, setSelectedMode] = useState("FLUENCY");

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  return (
    <View className="flex-1 flex-col justify-between px-6 pt-24 pb-4">
      <View className="gap-2 mb-8">
        <Text className="text-3xl font-bold text-white leading-tight">
          Select your study mode
        </Text>
        {/* <Text className="text-[#9CA3AF] text-sm leading-5">
          Your selection determines how LexSee structures your daily plan,
          pacing, and long-term mastery.
        </Text> */}
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
          className="overflow-visible"
        >
          {MODES.map((mode, index) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              index={index}
              scrollX={scrollX}
              isSelected={selectedMode === mode.id}
              onSelect={() => setSelectedMode(mode.id)}
            />
          ))}
        </Animated.ScrollView>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          className="mr-auto p-2"
          disabled={isLoading}
          onPress={() => {
            console.log("Back pressed");
            onBack();
          }}
        >
          <Text
            style={{
              opacity: isLoading ? 0.3 : 1,
            }}
            className="text-white text-xl font-bold"
          >
            Previous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="ml-auto p-2"
          disabled={isLoading}
          onPress={() => {
            console.log("Next pressed with mode:", selectedMode);
            onNext({
              growthStyle: selectedMode as GrowthStyle,
            });
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-xl font-bold">Next</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ModeCard = ({ mode, index, scrollX, isSelected, onSelect }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.78, 1, 0.78],
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
          borderRadius: 14,
          overflow: "hidden",
        },
      ]}
    >
      <TouchableOpacity className=" flex-1" onPress={onSelect}>
        <LinearGradient
          colors={mode.gradientColors}
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            flex: 1,
            padding: 20,
            justifyContent: "flex-start",
            paddingVertical: 26,
          }}
        >
          {mode.badge === "Recommended" && (
            <View
              style={{
                borderRadius: 12,
              }}
              className="absolute top-0 right-0  px-3 py-1  shadow-lg"
            >
              <Text className="text-white text-[10px]  font-bold tracking-wide">
                ✨ <Text className=" opacity-60">RECOMMENDED</Text>
              </Text>
            </View>
          )}
          <View
            className=" w-full  overflow-hidden"
            style={{
              height: 100,
            }}
          >
            {/* Title */}
            <Text
              style={{
                color: mode.badge === "Recommended" ? "#FFF" : "#000",
              }}
              className="text-xl font-bold text-center mb-3"
            >
              {mode.title}
            </Text>

            {/* Description */}
            <Text
              style={{
                color: mode.badge === "Recommended" ? "#FFF" : "#000",
              }}
              className=" opacity-70 text-center text-sm leading-5 mb-3"
            >
              {mode.desc}
            </Text>
          </View>

          <View className=" flex-1 w-full flex flex-col  justify-between mb-6">
            {mode.features.map((feature: any, idx: number) => (
              <View key={idx} className=" mb-4 last:mb-0">
                <View className=" flex flex-row justify-between mb-1">
                  <Text
                    className={`${mode.badge === "Recommended" ? "text-gray-300" : "text-gray-800"} text-sm`}
                  >
                    {feature.spec}
                  </Text>
                </View>
                <ValueBar
                  isRecommended={mode.badge === "Recommended"}
                  value={feature.value}
                />
              </View>
            ))}
          </View>

          {/* Features */}
          <View style={{ gap: 8 }}></View>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              opacity: !isSelected ? 1 : 0.2,
            }}
            className="px-10 py-2 rounded-lg mt-auto flex justify-center items-center"
          >
            <Text
              style={{
                color: "#000000",
              }}
              className="font-semibold text-lg"
            >
              {isSelected ? "Selected ✓" : "Select"}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ValueBar = ({
  isRecommended,
  value,
}: {
  isRecommended: boolean;
  value: number;
}) => {
  return (
    <View
      style={{
        height: 6,
        width: "100%",
        backgroundColor: isRecommended ? "#FFFFFF33" : "#00000033",
        opacity: 0.3,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${value * 100}%`,
          backgroundColor: isRecommended ? "#fff" : "#000",
          opacity: 0.8,
        }}
      />
    </View>
  );
};
