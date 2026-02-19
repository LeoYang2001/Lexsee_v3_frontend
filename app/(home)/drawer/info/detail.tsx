import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  Extrapolate,
  FadeInLeft,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";
import { LEXSEE_SCIENCE_TABS } from "./data";
import LegalFooter from "../../../../components/common/LegalFooter";
import { Link } from "lucide-react-native";

const SCROLL_DISTANCE = 120;

export default function InfoDetailed() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // 1. Convert the string param to a number
  const numericId = Number(id);

  // 2. Access the array using the numeric index (0-based)
  const currentTab = LEXSEE_SCIENCE_TABS[numericId - 1];

  const tabTitles = currentTab.content.map((section) => section.title);

  // 2. Cleanup Logic: We clear the tag when navigation starts
  // to prevent the "Ghost Registration" in the native stack.

  // If the record isn't found, safety check
  if (!currentTab) return null;

  const scrollY = useSharedValue(0);
  const [hideTitle, setHideTitle] = useState(false);

  const [sectionThresholds, setSectionThresholds] = useState<number[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const scrollRef = React.useRef<Animated.ScrollView>(null);
  const TAB_THEME_COLOR = currentTab.backgroundColor;

  const handleBack = () => {
    setHideTitle(true);
    router.back();
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.value = y;

      // Use a small offset so the tab switches when the section is close to the top
      const currentY = y;
      const anchors = sectionThresholds; // Ensure you use .value for SharedValues

      let newIndex = 0;

      // Search forwards
      for (let i = 0; i <= anchors.length; i++) {
        if (currentY >= anchors[i]) {
          newIndex = i + 1; // Removed the +1
        }
      }

      // console.log("current Y :", currentY);
      // console.log("index:", newIndex);

      // Optimization: Only bridge to JS if the index actually changed
      if (activeSection !== newIndex) {
        runOnJS(setActiveSection)(newIndex);
      }
    },
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE], // Input: From 0 to 120px scrolled
      [400, 280], // Output: From 400px to 280px height
      "clamp", // 🚨 This prevents it from going below 280
    );
    const scale = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [1, 0.8],
      Extrapolate.CLAMP,
    );

    return {
      height,
      transform: [{ scale }],
    };
  });

  const menuBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [SCROLL_DISTANCE, 200],
      [0, 1],
      Extrapolate.CLAMP,
    );
    return {
      opacity,
    };
  });

  // Function to jump to a section when a tab is tapped
  const scrollToSection = (index: number) => {
    // 1. Get the Y coordinate from your threshold array
    const targetY = index > 0 ? sectionThresholds[index - 1] : 0;
    // 2. Perform the scroll
    // We check if targetY exists (in case of an index mismatch)
    if (typeof targetY === "number") {
      scrollRef.current?.scrollTo({
        // Subtracting ~60px to account for the sticky menu bar height
        y: targetY,
        animated: true,
      });
    }
  };

  const openLink = (url?: string) => {
    if (!url) {
      alert("No reference link provided.");
      return;
    }
    Linking.openURL(url).catch((err) =>
      console.warn("Failed to open link:", err),
    );
  };

  return (
    <View className=" flex-1 w-full bg-[#131416]">
      <Animated.View
        sharedTransitionTag={`card_container_${id}`}
        // 🔑 The KEY is critical: it forces a re-mount if focus changes,
        // which is what fixes the "one-time-only" animation issue.
        className="flex-1 bg-[#131416] flex flex-col "
      >
        {!hideTitle && (
          <View className=" w-12 flex absolute z-30">
            <TouchableOpacity className="mt-20   p-2" onPress={handleBack}>
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
        {/* 1. HERO IMAGE */}
        <Animated.Image
          sharedTransitionTag={`card_image_${id}`}
          source={currentTab.imagePath}
          style={imageAnimatedStyle}
          resizeMode="cover"
          className=" top-0  w-[90%] overflow-visible mt-6 self-center "
        />

        <View className=" flex-1 w-full ">
          {!hideTitle && (
            <>
              <Animated.View
                style={[menuBarStyle]}
                className=" absolute top-[0px] z-30 w-full bg-[#131416]   flex  justify-center items-center"
              >
                <ScrollView
                  className=" h-full w-full"
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {tabTitles.map((item, index) => (
                    <TouchableOpacity
                      style={{
                        height: 60,
                      }}
                      key={`${item}-${index}`}
                      onPress={() => {
                        scrollToSection(index);
                      }}
                      className="px-2 py-2 flex justify-center items-center"
                    >
                      <Text
                        style={{
                          color:
                            activeSection === index ? TAB_THEME_COLOR : "white",
                          fontSize: 14,
                        }}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>

              <View className="  flex flex-col flex-1">
                <Animated.View
                  entering={FadeInLeft.delay(300).duration(500)}
                  className=" w-full   px-3 flex"
                >
                  {!hideTitle && (
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: "white",
                        marginBottom: 16,
                      }}
                    >
                      {currentTab.title}
                    </Text>
                  )}
                </Animated.View>

                <Animated.ScrollView
                  ref={scrollRef}
                  onScroll={scrollHandler}
                  scrollEventThrottle={16}
                  className=" flex-1 w-full p-3"
                >
                  {LEXSEE_SCIENCE_TABS[Number(id) - 1]?.content?.map(
                    (section, index) => (
                      <View
                        key={`${section.title}-${index}`}
                        className=" pb-8"
                        onLayout={(event) => {
                          const { y, height } = event.nativeEvent.layout;
                          const newThre =
                            index > 0
                              ? sectionThresholds[index - 1] +
                                Math.round(height)
                              : Math.round(height);

                          setSectionThresholds((prev) => [...prev, newThre]);
                        }}
                      >
                        <View className=" flex flex-row items-center  mb-4 gap-3">
                          <Text
                            style={{ color: TAB_THEME_COLOR, fontSize: 20 }}
                            className="font-bold"
                          >
                            {section.title}
                          </Text>
                          {section.reference_link && (
                            <TouchableOpacity
                              onPress={() => openLink(section.reference_link)}
                              className=" flex flex-row gap-1 justify-center items-center px-2 py-1"
                            >
                              <Link
                                size={12}
                                color={TAB_THEME_COLOR}
                                opacity={0.9}
                              />

                              <Text className="text-sm text-white opacity-40">
                                Reference
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        {section.takeaway && (
                          <View
                            style={{
                              borderColor: TAB_THEME_COLOR,
                            }}
                            className="  border-l-2  px-4 py-3 mb-4"
                          >
                            <Text
                              style={{ fontSize: 14 }}
                              className="text-white font-bold"
                            >
                              {section.takeaway}
                            </Text>
                          </View>
                        )}
                        <Text
                          style={{
                            fontSize: 14,
                          }}
                          className="text-white text-lg opacity-70 leading-7"
                        >
                          {section.content}
                        </Text>
                      </View>
                    ),
                  )}

                  {/* FOOTER  */}
                  <View
                    style={{
                      height: 400,
                    }}
                    className=" flex flex-col justify-end px-6"
                  >
                    <LegalFooter showResearchNote={true} compact={false} />
                  </View>
                </Animated.ScrollView>
              </View>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}
