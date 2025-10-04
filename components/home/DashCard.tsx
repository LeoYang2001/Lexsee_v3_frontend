import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";

const DashCard = () => {
  const [ifReviewCard, setIfReviewCard] = useState(true);
  const height = useSharedValue(104);
  const reviewOpacity = useSharedValue(0);

  const router = useRouter();

  // Get words data from Redux
  const words = useSelector((state: RootState) => state.wordsList.words);

  // Calculate statistics
  const totalWords = words.length;
  const wordsWithImages = words.filter((word) => word.imgUrl).length;
  const wordsWithConversations = words.filter(
    (word) => word.exampleSentences
  ).length;
  const savedWords = words.filter(
    (word) => word.status === "COLLECTED" || word.status === "saved"
  ).length;

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
          {/* Total Words */}
          <TouchableOpacity
            className="flex-1 h-full flex flex-col items-start justify-center px-6"
            onPress={() => setIfReviewCard(!ifReviewCard)}
          >
            <Text
              className="font-semibold"
              style={{ fontSize: 28, color: "white" }}
            >
              {totalWords}
            </Text>
            <Text
              className="text-white opacity-80 mt-2"
              style={{ fontSize: 12 }}
            >
              {totalWords === 1 ? "Word" : "Words"}
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

          {/* Words with Images */}
          <TouchableOpacity
            className="flex-1 h-full flex flex-row justify-center items-center "
            onPress={() => {
              //go to wordsList page, which i will create in a sec
              router.push("/(inventory)");
            }}
          >
            <ChevronRight color={"#fff"} size={32} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ReviewCard - Additional Stats */}
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
          <View className="flex flex-row items-center justify-between w-full px-8">
            {/* Words with Conversations */}
            <View className="flex flex-col h-full justify-center flex-1">
              <Text
                style={{
                  fontSize: 24,
                  color: "white",
                  fontWeight: "600",
                }}
              >
                {wordsWithConversations}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: "white",
                  opacity: 0.7,
                  marginTop: 2,
                }}
              >
                With Conversations
              </Text>
            </View>

            <View
              style={{
                width: 1,
                height: 12,
                backgroundColor: "#fff",
                opacity: 0.2,
                borderRadius: 1,
              }}
            />

            {/* Saved Words */}
            <View className="flex flex-col h-full justify-center flex-1">
              <Text
                style={{
                  fontSize: 24,
                  color: "white",
                  fontWeight: "600",
                }}
              >
                {savedWords}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: "white",
                  opacity: 0.7,
                  marginTop: 2,
                }}
              >
                Saved
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

export default DashCard;
