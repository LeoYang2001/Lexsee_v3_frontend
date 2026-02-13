import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
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
  const [activeTag, setActiveTag] = useState(`card_container_${id}`);

  const handleBack = () => {
    console.log("route back");
    setActiveTag(""); // Clear the tag locally
    setTimeout(() => {
      router.back();
    }, 50); // Small delay to let the Native thread "un-register" the luggage
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
          style={styles.heroImage}
          resizeMode="cover"
          className="absolute top-0 left-0 border border-red-50"
        />

        {/* 2. BACK BUTTON */}
        <SafeAreaView className=" border border-red-500  flex flex-1 w-full h-full">
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

//  <Animated.Text
//           sharedTransitionTag={`card_title_${id}`}
//           style={styles.title}
//         >
//           {currentTab.title}
//         </Animated.Text>
const styles = StyleSheet.create({
  heroImage: {
    width: "100%",
    height: 400,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 20,
  },
  backButton: {
    margin: 20,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 25,
  },
  contentContainer: {
    padding: 24,
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  divider: {
    height: 2,
    backgroundColor: "#E44814",
    width: 60,
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: "#9CA3AF",
    lineHeight: 28,
  },
});
