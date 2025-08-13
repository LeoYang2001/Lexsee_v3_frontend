import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const DashCard = () => {
  const [ifReviewCard, setIfReviewCard] = useState(true);
  const height = useSharedValue(104);
  const reviewOpacity = useSharedValue(0);

  const duration = 200;

  React.useEffect(() => {
    height.value = withTiming(ifReviewCard ? 191 : 104, { duration });
    reviewOpacity.value = withTiming(ifReviewCard ? 1 : 0, { duration });
  }, [ifReviewCard]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));
  const reviewAnimatedStyle = useAnimatedStyle(() => ({
    opacity: reviewOpacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle]} className="w-full relative">
      <LinearGradient
        colors={["#FF511B", "#FF602F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 104,
          borderRadius: 16,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <View className="w-full h-full flex flex-row justify-between items-center">
          <TouchableOpacity
            className="flex-1 h-full flex flex-col items-start justify-center px-6"
            onPress={() => setIfReviewCard(!ifReviewCard)}
          >
            <Text
              className="font-semibold"
              style={{ fontSize: 28, color: "white" }}
            >
              3
            </Text>
            <Text
              className="text-white opacity-80 mt-2"
              style={{ fontSize: 12 }}
            >
              Word
            </Text>
          </TouchableOpacity>
          <View
            style={{
              width: 1,
              height: 12,
              backgroundColor: "#fff",
              opacity: 0.2,
              borderRadius: 1,
            }}
          />
          <TouchableOpacity
            className="flex-1 h-full flex flex-col items-start justify-center px-6"
            onPress={() => setIfReviewCard(!ifReviewCard)}
          >
            <Text
              className="font-semibold"
              style={{ fontSize: 28, color: "white" }}
            >
              3
            </Text>
            <Text
              className="text-white opacity-80 mt-2"
              style={{ fontSize: 12 }}
            >
              Word
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      {/* ReviewCard */}
      <Animated.View
        style={[
          {
            height: 100,
            borderBottomRightRadius: 12,
            borderBottomLeftRadius: 12,
          },
          reviewAnimatedStyle,
        ]}
        className="absolute w-full bottom-0 bg-white overflow-hidden"
      >
        <LinearGradient
          colors={["#292526", "#5b3023", "#292526"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View className=" flex flex-row items-center justify-between w-full px-8">
            <View className="  flex flex-col h-full justify-center ">
              <Text>
                <Text
                  style={{
                    fontSize: 24,
                    opacity: 1,
                    color: "white",
                  }}
                >
                  15
                </Text>{" "}
                <Text
                  style={{
                    fontSize: 12,
                    color: "white",
                    opacity: 0.7,
                  }}
                >
                  /17
                </Text>
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "white",
                  opacity: 0.7,
                }}
              >
                to review today
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

export default DashCard;
