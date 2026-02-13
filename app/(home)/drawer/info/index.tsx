import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/routers";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolateColor,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

const AnimatedView = Animated.createAnimatedComponent(View);
const { width: windowWidth } = Dimensions.get("window");

// --- 1. Sub-Component for each Tab ---
const InfoTab = ({
  tab,
  index,
  scrollX,
  snapInterval,
  tabWidth,
  gap,
  activeId,
  setActiveId,
}: any) => {
  const isActive = activeId === tab.id;

  const handlePress = () => {
    setActiveId(tab.id); // mark THIS one as the shared element source
    router.push({
      pathname: "/(home)/drawer/info/detail",
      params: { id: tab.id },
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    const centerOfTab = index * snapInterval;
    const scale = interpolate(
      scrollX.value,
      [centerOfTab - snapInterval, centerOfTab, centerOfTab + snapInterval],
      [0.8, 1, 0.8],
      Extrapolate.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      [centerOfTab - snapInterval, centerOfTab, centerOfTab + snapInterval],
      [0.6, 1, 0.6],
      Extrapolate.CLAMP,
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <AnimatedView
      // We use a key tied to focus to force a "Fresh Registration"
      // when returning from a sibling stack
      style={[
        { width: tabWidth, marginRight: gap, marginTop: 180 },
        animatedStyle,
      ]}
      className="bg-[#131416] relative rounded-lg p-4"
      // Expanding the whole card
      sharedTransitionTag={`card_container_${tab.id}`}
    >
      <View
        style={{
          position: "absolute",
          top: -160,
          left: 0,
          right: 0,
          zIndex: 10,
          alignItems: "center",
        }}
      >
        <Animated.Text
          style={{ fontSize: 36 }}
          sharedTransitionTag={`card_title_${tab.id}`}
          className="text-white font-semibold text-center"
        >
          {tab.title}
        </Animated.Text>
      </View>

      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="mt-8 flex-1 flex justify-center items-center"
      >
        <Animated.Image
          source={tab.imagePath}
          sharedTransitionTag={`card_image_${tab.id}`}
          style={{
            width: 180,
            height: 180,
            borderRadius: 12,
          }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </AnimatedView>
  );
};

// --- 2. Main Info Component ---
const Info = () => {
  const navigation = useNavigation();

  const tabWidth = windowWidth * 0.7;
  const gap = 6;
  const snapInterval = tabWidth + gap;
  const contentOffset = (windowWidth - tabWidth) / 2;

  const scrollX = useSharedValue(0);
  const bgColors = ["#f57300", "#1f7f5d", "#FF511B", "#D939D9"];
  const inputRange = [0, snapInterval, snapInterval * 2, snapInterval * 3];

  const [activeId, setActiveId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => setActiveId(null);
    }, []),
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const animatedBgStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      inputRange,
      bgColors,
    );
    return { backgroundColor };
  });

  const tabs = [
    {
      id: "1",
      title: "What LexSee Is",
      imagePath: require("../../../../assets/lexseeScience/tab_1.png"),
    },
    {
      id: "2",
      title: "How Memory Works",
      imagePath: require("../../../../assets/lexseeScience/tab_2.png"),
    },
    {
      id: "3",
      title: "How LexSee Helps Memory",
      imagePath: require("../../../../assets/lexseeScience/tab_3.png"),
    },
    {
      id: "4",
      title: "How to Use LexSee Well",
      imagePath: require("../../../../assets/lexseeScience/tab_1.png"),
    },
  ];

  return (
    <View className="flex-1 bg-[#191D24]">
      {/* Background Layer */}
      <AnimatedView
        style={[
          { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
          animatedBgStyle,
        ]}
      >
        <LinearGradient
          colors={[
            `rgba(8, 10, 16, 0.1)`,
            `rgba(8, 10, 16, 0.4)`,
            `rgba(8, 10, 16, 1)`,
            `rgba(8, 10, 16, 1)`,
          ]}
          locations={[0, 0.2, 0.75, 1]}
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />
      </AnimatedView>

      {/* Drawer Toggle */}
      <TouchableOpacity
        className="ml-auto mt-20 py-4 mb-2 px-3 z-50"
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      >
        <View style={{ width: 18 }} className="w-8 flex gap-1">
          <View style={{ height: 2 }} className="bg-white w-full" />
          <View style={{ height: 2 }} className="bg-white w-full" />
        </View>
      </TouchableOpacity>

      {/* Carousel Section */}
      <View style={{ flex: 1 }} className="mt-[10%]">
        <Animated.ScrollView
          horizontal
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: contentOffset }}
          className="mt-12 overflow-visible"
        >
          {tabs.map((tab, index) => (
            <InfoTab
              key={tab.id}
              tab={tab}
              index={index}
              scrollX={scrollX}
              tabWidth={tabWidth}
              gap={gap}
              snapInterval={snapInterval}
              activeId={activeId}
              setActiveId={setActiveId}
            />
          ))}
        </Animated.ScrollView>
      </View>
    </View>
  );
};

export default Info;
