import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeOut,
  FadeOutRight,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

export default function InfoDetailed() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // 1. Data Mapping (Matches Carousel)
  const tabs: Record<string, any> = {
    "1": {
      title: "What LexSee Is",
      image: require("../../../../assets/lexseeScience/tab_1.png"),
    },
    "2": {
      title: "How Memory Works",
      image: require("../../../../assets/lexseeScience/tab_2.png"),
    },
    "3": {
      title: "How Memory Works",
      image: require("../../../../assets/lexseeScience/tab_3.png"),
    },
    "4": {
      title: "How to Use LexSee Well",
      image: require("../../../../assets/lexseeScience/tab_1.png"),
    },
  };

  const currentTab = tabs[id as string];

  // 2. Cleanup Logic: We clear the tag when navigation starts
  // to prevent the "Ghost Registration" in the native stack.
  const [hideTitle, setHideTitle] = useState(false);

  const handleBack = () => {
    console.log("route back");
    setHideTitle(true);
    router.back();
  };

  // If the record isn't found, safety check
  if (!currentTab) return null;

  return (
    <View className=" flex-1 w-full bg-[#131416]">
      <Animated.View
        sharedTransitionTag={`card_container_${id}`}
        // 🔑 The KEY is critical: it forces a re-mount if focus changes,
        // which is what fixes the "one-time-only" animation issue.
        className="flex-1 bg-[#131416] flex flex-col "
      >
        {/* 1. HERO IMAGE */}
        <Animated.Image
          sharedTransitionTag={`card_image_${id}`}
          source={currentTab.image}
          style={{ height: 400 }}
          resizeMode="cover"
          className="absolute top-0  w-full left-0"
        />

        {/* 2. BACK BUTTON */}
        <View className="  flex flex-col flex-1">
          <View className=" w-12 flex">
            <TouchableOpacity className="mt-20   p-2" onPress={handleBack}>
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View className=" w-full h-[30%] flex"></View>
          <Animated.View
            entering={FadeInLeft.delay(300).duration(500)}
            className=" w-full  flex"
          >
            {!hideTitle && (
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: "white",
                  marginBottom: 16,
                }}
              >
                {currentTab.title}
              </Text>
            )}
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}
