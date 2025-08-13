import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { router, useRouter } from "expo-router";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { AntDesign, Feather } from "@expo/vector-icons";
import CustomHeader from "../../components/home/Header";
import { useTheme } from "../../theme/ThemeContext";
import DashCard from "../../components/home/DashCard";
import { mockWordList } from "../../data/wordslist_mock";
import FlexCard from "../../components/common/FlexCard";
import { FadeIn } from "react-native-reanimated";
import SearchPage from "../../components/home/SearchPage";

export default function HomeScreen() {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const anchorSnapPoints = [0.15, 0.2];

  const anchor1Ref = useRef<View>(null);
  const anchor2Ref = useRef<View>(null);
  const headerRef = useRef<View>(null);
  const [anchor1Y, setAnchor1Y] = useState(0);
  const [anchor2Y, setAnchor2Y] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [anchorDistance, setAnchorDistance] = useState(0.25);
  const [ifShowHeader, setIfShowHeader] = useState(true);
  const screenHeight = Dimensions.get("window").height;
  const translateY = useSharedValue(0);

  const theme = useTheme();

  // Redirect to auth if not authenticated (shouldn't happen, but safety check)
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)");
    }
  }, [isAuthenticated]);

  // Dynamically update anchor positions while scrolling
  const handleScroll = () => {
    anchor1Ref.current?.measure((x, y, width, height, pageX, pageY) => {
      setAnchor1Y(pageY);
    });
    anchor2Ref.current?.measure((x, y, width, height, pageX, pageY) => {
      setAnchor2Y(pageY);
    });
  };

  // Only update anchorDistance when anchor1Y or anchor2Y changes
  React.useEffect(() => {
    if (!anchor1Ref || !anchor2Ref) return;
    setAnchorDistance((anchor2Y - anchor1Y) / screenHeight);
  }, [anchor1Y, anchor2Y]);

  // Only update ifShowHeader when anchorDistance changes
  React.useEffect(() => {
    if (anchorDistance < 0) return;
    if (anchorDistance < anchorSnapPoints[0]) {
      setIfShowHeader(false);
    } else if (anchorDistance > anchorSnapPoints[1]) {
      setIfShowHeader(true);
    }
  }, [anchorDistance]);

  // Animate header by its actual height
  React.useEffect(() => {
    const target = ifShowHeader ? 0 : -headerHeight;
    translateY.value = withTiming(target, { duration: 200 });
  }, [ifShowHeader, headerHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
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
                  setAnchor1Y(pageY);
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
            {/* Placeholder list of 10 items */}
            {mockWordList.map((word, idx) => (
              <View className="relative my-2" key={word.id || idx}>
                <FlexCard word={word} ifDetail={false} ifGraphic={false} />
                {idx === 1 && (
                  <View
                    className=" absolute"
                    ref={anchor2Ref}
                    onLayout={() => {
                      anchor2Ref.current?.measure(
                        (x, y, width, height, pageX, pageY) => {
                          setAnchor2Y(pageY);
                        }
                      );
                    }}
                  >
                    {/* <Text className=" opacity-0">ANCHOR2</Text>
                    <Text className="text-xs  text-gray-400">
                      Distance: {(anchorDistance * 100).toFixed(1)}%
                    </Text> */}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}
