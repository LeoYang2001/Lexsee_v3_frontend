import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Link, router } from "expo-router";
import Logo from "../../components/common/Logo";
import GradientBackground from "../../components/common/GradientBackground";

const { width, height } = Dimensions.get("window");

// Placeholder carousel data
const carouselData = [
  {
    id: 1,
    image: require("../../assets/carouselImages/bgImage1.png"), // Using icon as placeholder
    title: "Welcome to LexSee",
    description:
      "Your intelligent AI legal assistant, ready to help you navigate complex legal matters with ease and confidence.",
  },
  {
    id: 2,
    image: require("../../assets/carouselImages/bgImage2.png"), // Fixed extension to .jpeg
    title: "AI-Powered Legal Chat",
    description:
      "Ask legal questions and get instant, accurate responses from our advanced AI trained on legal documents and precedents.",
  },
  {
    id: 3,
    image: require("../../assets/carouselImages/bgImage3.png"), // Using splash-icon as placeholder
    title: "Document Analysis",
    description:
      "Upload and analyze legal documents with AI assistance for quick insights and comprehensive understanding.",
  },
];

export default function AuthIndexScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnims = useState(() =>
    carouselData.map((_, index) => new Animated.Value(index === 0 ? 1 : 0))
  )[0];

  // Animated values for indicator bars
  const indicatorWidths = useState(() =>
    carouselData.map((_, index) => new Animated.Value(index === 0 ? 148 : 45))
  )[0];

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % carouselData.length;

      // Fade out current image and fade in next image
      Animated.timing(fadeAnims[currentIndex], {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();

      Animated.timing(fadeAnims[nextIndex], {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Animate indicator bars
      // Shrink current indicator
      Animated.timing(indicatorWidths[currentIndex], {
        toValue: 45,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Expand next indicator
      Animated.timing(indicatorWidths[nextIndex], {
        toValue: 148,
        duration: 300,
        useNativeDriver: false,
      }).start();

      setCurrentIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, fadeAnims, indicatorWidths]);

  const currentSlide = carouselData[currentIndex];

  return (
    <View className="flex-1 relative">
      {/* Fallback background */}
      <View
        style={{
          position: "absolute",
          width: width,
          height: height,
          backgroundColor: "#080A10",
        }}
      />

      {/* Multiple Background Images with Gradient */}
      {carouselData.map((slide, index) => (
        <Animated.View
          key={slide.id}
          style={{
            position: "absolute",
            width: width,
            height: height,
            opacity: fadeAnims[index],
          }}
        >
          <GradientBackground imagePath={slide.image} />
        </Animated.View>
      ))}

      {/* Content Overlay */}
      <View className="flex-1 justify-between ">
        <View className=" h-[40%]" />
        <View className=" flex-1 flex-col   px-6  justify-start items-center">
          {/* Top Section - Title and Description */}
          <View
            style={{
              height: 200,
            }}
            className=" flex  flex-col "
          >
            <Text
              style={{
                fontSize: 46,
              }}
              className=" font-bold text-white  text-center"
            >
              {currentIndex === 0 ? (
                <>
                  Welcome to{" "}
                  <Text style={{ color: "#FA541C", opacity: 0.9 }}>LexSee</Text>
                </>
              ) : (
                currentSlide.title
              )}
            </Text>
            <Text
              style={{
                fontSize: 14,
              }}
              className="   text-white opacity-100 text-center my-3 leading-6 px-4"
            >
              {currentSlide.description}
            </Text>
          </View>

          {/* Middle Section - Indicators */}
          <View className="flex-row justify-center items-center gap-1 my-20">
            {carouselData.map((_, index) => (
              <Animated.View
                key={index}
                style={{
                  width: indicatorWidths[index],
                  height: 5,
                  backgroundColor:
                    index === currentIndex ? "#FA541C" : "#FFFFFF",
                  opacity: index === currentIndex ? 1 : 0.5,
                  borderRadius: 2.5,
                }}
              />
            ))}
          </View>

          {/* Bottom Section - Action Button */}
          <View className="mb-8 w-full">
            <TouchableOpacity
              style={{
                height: 44,
                backgroundColor: "#FA541C",
                borderRadius: 9,
              }}
              className="  flex justify-center items-center"
              onPress={() => router.replace("/(auth)/sign-in")}
            >
              <Text
                style={{
                  fontSize: 15,
                }}
                className="text-white  font-semibold "
              >
                Get Started
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
