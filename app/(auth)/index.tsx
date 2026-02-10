import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated as RNAnimated, Dimensions, Pressable } from "react-native";
import { router } from "expo-router";
import GradientBackground from "../../components/common/GradientBackground";
import Animated ,{ Extrapolation, interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const ACTIVE_WIDTH = 148;
const INACTIVE_WIDTH = 45;


export function IndicatorBar({
  active,
  onPress,
}: {
  active: boolean;
  onPress?: () => void;
}) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 280 });
  }, [active, progress]);

  const rStyle = useAnimatedStyle(() => {
    const width = interpolate(
      progress.value,
      [0, 1],
      [INACTIVE_WIDTH, ACTIVE_WIDTH],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(progress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP);

    const backgroundColor = interpolateColor(progress.value, [0, 1], [
      "rgba(255,255,255,0.9)",
      "#FA541C",
    ]);

    return { width, opacity, backgroundColor };
  }, []);

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      // optional: prevent accidental double taps
      disabled={!onPress}
      style={{ paddingVertical: 8 }} // increases tappable height without changing bar
    >
      <Animated.View
        style={[
          {
            height: 5,
            borderRadius: 4,
            marginHorizontal: 2,
          },
          rStyle,
        ]}
      />
    </TouchableOpacity>
  );
}
// Carousel data
const carouselData = [
  {
    id: 1,
    image: require("../../assets/onboardingImages/page_1.png"),
    title: "Learn English with memory science",
    description:
      "LexSee helps you remember words better using proven learning principles.",
  },
  {
    id: 2,
    image: require("../../assets/onboardingImages/page_2.png"),
    title: "LexSee isn’t a shortcut to fluency",
    description:
      "Real English comes from reading, listening, and using the language in real life.",
  },
  {
    id: 3,
    image: require("../../assets/onboardingImages/page_3.png"),
    title: "Small daily learning beats intense bursts",
    description:
      "A few minutes a day, done consistently, is how progress compounds.",
  },
  {
    id: 4,
    image: require("../../assets/onboardingImages/page_4.png"),
    title: "Trust the process",
    description: "LexSee handles the science so you can focus on learning.",
  },
];

export default function AuthIndexScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isAnimatingRef = useRef(false);

  // Create animated values once
  const fadeAnims = useMemo(
    () => carouselData.map((_, i) => new RNAnimated.Value(i === 0 ? 1 : 0)),
    []
  );

 

  const isLast = currentIndex === carouselData.length - 1;
  const currentSlide = carouselData[currentIndex];

  const goToIndex = (nextIndex: number) => {
    if (isAnimatingRef.current) return;
    if (nextIndex < 0 || nextIndex >= carouselData.length) return;
    if (nextIndex === currentIndex) return;

    isAnimatingRef.current = true;

    // Fade out current & fade in next
    const fadeOut = RNAnimated.timing(fadeAnims[currentIndex], {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    });

    const fadeIn = RNAnimated.timing(fadeAnims[nextIndex], {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    });

    // Run in parallel then update index (or update first; either is fine)
    RNAnimated.parallel([fadeOut, fadeIn]).start(() => {
      setCurrentIndex(nextIndex);
      isAnimatingRef.current = false;
    });
  };

  const onNext = () => {
    if (isLast) {
      router.replace("/(auth)/sign-in");
      return;
    }
    goToIndex(currentIndex + 1);
  };

  const onStart = () => {
    console.log('onboarding finished ')
    router.replace("/(auth)/sign-in");
  }

  return (
    <View className="flex-1 relative">
      {/* Fallback background */}
      <View
        style={{
          position: "absolute",
          width,
          height,
          backgroundColor: "#080A10",
        }}
      />

      {/* Background Images */}
      {carouselData.map((slide, index) => (
        <RNAnimated.View
          key={slide.id}
          style={{
            position: "absolute",
            width,
            height,
            opacity: fadeAnims[index],
          }}
        >
          <GradientBackground imagePath={slide.image} />
        </RNAnimated.View>
      ))}

      {/* Content Overlay */}
      <View className="flex-1 justify-between">
        <View className="h-[46%]" />

        <View className="flex-1 flex-col mt-auto px-6 justify-start items-center">
          {/* Top Section - Title and Description */}
          <View style={{ height: 200 }} className="pt-12 flex-col">
            <Text style={{ fontSize: 32 }} className="font-bold text-white text-center">
              {currentSlide.title}
            </Text>
            <Text
              style={{ fontSize: 16 }}
              className="text-white opacity-70 text-center my-3 leading-6 px-4"
            >
              {currentSlide.description}
            </Text>
          </View>

          {/* Indicators */}
          <View className="flex-row justify-center items-center  my-14">
          {carouselData.map((_, index) => (
                    <IndicatorBar
                    key={index}
                    active={index === currentIndex}
                    onPress={() => goToIndex(index)}
                  />
          ))}
        </View>

          {/* Buttons row: Skip + Next */}
          <View className="w-full flex-row justify-between items-center mb-6">
            {
              !isLast && (
                <TouchableOpacity
              onPress={onStart}
              className="py-3 px-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-white opacity-70 font-semibold">Skip</Text>
            </TouchableOpacity>
              )
            }

            <TouchableOpacity
              style={[{
                height: 44,
                backgroundColor: "#FA541C",
                borderRadius: 9,
                paddingHorizontal: 18,
                minWidth: 120,
                
              }, isLast && {marginLeft: 'auto'}]}
              className="flex justify-center items-center"
              onPress={()=>{
                if(isLast) {
                  onStart();
                } else {
                  onNext();
                }
              }}
            >
              <Text style={{ fontSize: 15 }} className="text-white font-semibold">
                {isLast ? "Get Started" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
