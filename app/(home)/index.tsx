import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { AntDesign, Feather } from "@expo/vector-icons";
import CustomHeader from "../../components/home/Header";
import { useTheme } from "../../theme/ThemeContext";
import DashCard from "../../components/home/DashCard";
import { mockWordList } from "../../data/wordslist_mock";
import FlexCard from "../../components/common/FlexCard";
import { Word } from "../../types/common/Word";
import { client } from "../client";

export default function HomeScreen() {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const router = useRouter();

  const anchorSnapPoints = [0.15, 0.25];

  const anchor1Ref = useRef<View>(null);
  const anchor2Ref = useRef<View>(null);
  const headerRef = useRef<View>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [ifShowHeader, setIfShowHeader] = useState(true);
  const screenHeight = Dimensions.get("window").height;
  const translateY = useSharedValue(0);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const { words, isLoading, isSynced, error } = useAppSelector(
    (state) => state.wordsList
  );

  // Filter words for crrent user

  // Filter by status
  const collectedWords = words
    .filter((word) => word.status === "COLLECTED")
    .sort((a, b) => {
      // Handle cases where timeStamp might be undefined
      const timeA = a.timeStamp ? new Date(a.timeStamp).getTime() : 0;
      const timeB = b.timeStamp ? new Date(b.timeStamp).getTime() : 0;

      // Sort in descending order (newest first)
      return timeB - timeA;
    });
  // const learnedWords = userWords.filter(word => word.status === "LEARNED");

  const theme = useTheme();

  // Redirect to auth if not authenticated (shouldn't happen, but safety check)
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)");
    }
  }, [isAuthenticated]);

  // Dynamically update anchor positions while scrolling
  const handleScroll = () => {
    if (collectedWords.length < 3) {
      setIfShowHeader(true);
      return;
    } // Avoid measuring if not enough words)
    let anchor1Y = 0;
    let anchor2Y = 0;
    anchor1Ref.current?.measure((x, y, width, height, pageX, pageY) => {
      anchor1Y = pageY;
    });
    anchor2Ref.current?.measure((x, y, width, height, pageX, pageY) => {
      anchor2Y = pageY;
    });
    let distance = (anchor2Y - anchor1Y) / screenHeight;
    if (distance < anchorSnapPoints[0]) {
      setIfShowHeader(false);
    } else if (distance > anchorSnapPoints[1]) {
      setIfShowHeader(true);
    }
  };

  // Animate header by its actual height
  React.useEffect(() => {
    const target = ifShowHeader ? 0 : -headerHeight;
    translateY.value = withTiming(target, { duration: 200 });
  }, [ifShowHeader, headerHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (activeCardId) {
          setActiveCardId(null);
        }
      }}
    >
      <View
        style={{ backgroundColor: theme.background }}
        className="flex-1  px-3"
      >
        {/* Reanimated View  */}
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          {/* Top Section with dynamic height */}
          <View
            ref={headerRef}
            onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          >
            <CustomHeader />
            <View className="flex-col gap-6 items-center mt-6">
              <TouchableOpacity
                style={{
                  height: 49,
                  backgroundColor: "#2b2c2d",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                }}
                className=" w-full flex  justify-center"
                onPress={() => router.push("/(home)/search")}
              >
                <AntDesign
                  color={"white"}
                  style={{ opacity: 0.6 }}
                  name="search1"
                  size={22}
                />
              </TouchableOpacity>

              <DashCard />
            </View>
          </View>

          <View style={{ height: "100%", paddingTop: 45 }}>
            <View
              ref={anchor1Ref}
              onLayout={() => {
                anchor1Ref.current?.measure(
                  (x, y, width, height, pageX, pageY) => {
                    // setAnchor1Y(pageY);
                  }
                );
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                }}
                className=" opacity-1  text-white  my-3"
              >
                Recently Pinned
              </Text>
            </View>
            <ScrollView
              className="flex-1 "
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
            >
              {collectedWords.map((word, idx) => (
                <TouchableWithoutFeedback
                  onPress={() => {
                    if (activeCardId === word.id) {
                      setActiveCardId(null);
                    } else {
                      setActiveCardId(word.id ?? null);
                    }
                  }}
                  key={word.id || idx}
                >
                  <View className="relative my-2">
                    <FlexCard
                      word={word}
                      ifDetail={activeCardId === word.id}
                      ifGraphic={true}
                    />
                    {idx === 1 && (
                      <View className=" absolute" ref={anchor2Ref}></View>
                    )}
                  </View>
                </TouchableWithoutFeedback>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}
