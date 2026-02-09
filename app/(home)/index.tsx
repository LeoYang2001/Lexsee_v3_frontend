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
import { useAppSelector } from "../../store/hooks";
import { AntDesign } from "@expo/vector-icons";
import CustomHeader from "../../components/home/Header";
import { useTheme } from "../../theme/ThemeContext";
import DashCard from "../../components/home/DashCard";
import FlexCard from "../../components/common/FlexCard";
import { useOnboarding } from "../../hooks/useOnboarding";

export default function HomeScreen() {

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

  const { words } = useAppSelector(
    (state) => state.wordsList
  );


  //NEW USER GUIDE
  const { activeStep, setTargetLayout } = useOnboarding();
  const searchBarRef = useRef<View>(null);

  // const handleLayout = () => {
  //   // Only measure if the "Director" says we are in the 'SEARCH' stage
  //   if (activeStep === 'SEARCH') {
  //     searchBarRef.current?.measureInWindow((x, y, width, height) => {
  //       setTargetLayout({ x, y, width, height });
  //     });
  //   }
  // };

  const handleLayout = () => {
  if (activeStep === 'SEARCH') {
    const tryMeasure = (retries = 3) => {
      searchBarRef.current?.measureInWindow((x, y, width, height) => {
        // Check if we actually got data (height/width shouldn't be 0 for a search bar)
        if (width > 0 && height > 0) {
          setTargetLayout({ x, y, width, height });
        } else if (retries > 0) {
          // If zeros, wait 100ms and try again
          setTimeout(() => tryMeasure(retries - 1), 100);
        }
      });
    };

    tryMeasure();
  }
};

  // Filter words for crrent user

  // Filter by status

  const collectedWords = words
    .filter((word) => word.status === "COLLECTED")
   
  // const learnedWords = userWords.filter(word => word.status === "LEARNED");

  const theme = useTheme();


  // Dynamically update anchor positions while scrolling
  const handleScroll = () => {
    if (collectedWords.length < 3) {
      setIfShowHeader(true);
      return;
    }

    // Measure both anchors and calculate distance inside the callbacks
    anchor1Ref.current?.measureInWindow((x1, y1, width1, height1) => {
      anchor2Ref.current?.measureInWindow((x2, y2, width2, height2) => {
        // Ignore invalid measurements (layout not complete yet)
        if (y1 === 0 && y2 === 0) {
          return;
        }

        const distance = (y2 - y1) / screenHeight;

        if (distance < anchorSnapPoints[0]) {
          setIfShowHeader(false);
        } else if (distance > anchorSnapPoints[1]) {
          setIfShowHeader(true);
        }
      });
    });
  };

  // Animate header by its actual height
  useEffect(() => {
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
              <View 
                style={{
                  width: "100%",
                }}
              >
                <TouchableOpacity
                  ref={searchBarRef}
                  onLayout={handleLayout}
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
              </View>
              {/* Press DashCard to navigate to a new screen ("/home/reviewQueue") */}
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
              {collectedWords.slice(0,10).map((word, idx) => (
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
                    index={idx}
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
