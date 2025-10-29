import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchReviewInfo,
  setProfile,
  UserProfile,
} from "../../store/slices/profileSlice";
import { RootState } from "../../store";
import { Word } from "../../types/common/Word";
// Add Reanimated imports
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import ControlPanel from "../../components/reviewQueue/ControlPanel";
import ReviewFlexCard from "../../components/reviewQueue/ReviewFlexCard";
import { RecallAccuracy } from "../../types/common/RecallAccuracy";
import { getNextReview } from "../../lib/reviewAlgorithm";
import { client } from "../client";
import { useAppSelector } from "../../store/hooks";
import { handleScheduleAndCleanup } from "../../apis/setSchedule";

const { width, height } = Dimensions.get("window");
const BORDER_RADIUS = Math.min(width, height) * 0.06;

export default function ReviewQueueScreen() {
  // get the words by reviewIds we fetched
  const [reviewQueue, setReviewQueue] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const words = useSelector((state: RootState) => state.wordsList.words);

  const [hintCount, setHintCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const userProfile = useAppSelector((state) => state.profile);

  const handleNextWord = async (familiarityLevel: RecallAccuracy) => {
    // step0: set loading state to true
    setLoading(true);
    console.log(
      `➡️ Next word! Current index: ${currentWordIndex}, familiarityLevel: ${familiarityLevel}, word: ${JSON.stringify(currentWord.review_interval)}`
    );
    //Step1: get next review data
    const { next_due, review_interval, ease_factor } = getNextReview({
      review_interval: currentWord.review_interval,
      ease_factor: currentWord.ease_factor,
      recall_accuracy: familiarityLevel,
    });
    console.log(
      `Next due: ${next_due}, review_interval: ${review_interval}, ease_factor: ${ease_factor}`
    );
    //Step2: update the word's review data in the backend
    try {
      if (review_interval > 60) {
        //if review_interval is over 60 days, consider it mastered
        console.log(`✅ Word mastered! Skipping further reviews.`);
      } else {
        const currentWordUpdated = {
          ...currentWord,
          review_interval,
          ease_factor,
        };
        const updateData = {
          id: currentWordUpdated.id,
          data: JSON.stringify(currentWordUpdated),
        };
        const res = await (client.models as any).Word.update(updateData);
      }
    } catch (error) {
      console.log(`Error updating word review data: ${error}`);
    }

    //Step4: remove current schedule and set schedule the next review
    try {
      const updatedProfile: UserProfile | false =
        await handleScheduleAndCleanup(userProfile, currentWord.id, next_due);
      // after update profile, we should reload redux profile state to make sure it's the latest
      console.log("updatedProfile:", updatedProfile);
      if (updatedProfile) {
        // Update Redux store with new profile
        dispatch(setProfile(updatedProfile));
        console.log("✅ Redux store updated");
      } else {
        console.error("❌ Failed to update profile, schedule not saved");
      }
    } catch (error) {
      console.log(`Error scheduling notification: ${error}`);
    }

    //Step4: move to next word
    // Here you can dispatch an action to update the word's review data based on familiarityLevel

    if (currentWordIndex < reviewQueue.length - 1) {
      setCurrentWordIndex((prevIndex) => prevIndex + 1);
      setTimeout(() => {
        setLoading(false);
      }, 100);
    } else {
      alert("🎉 You've completed all reviews for today!");
    }
  };

  const getFamiliarityLevel = (count: number): RecallAccuracy => {
    if (count >= 3) return "poor";
    if (count === 2) return "fair";
    if (count === 1) return "good";
    return "excellent";
  };

  const handleHintPressed = () => {
    if (hintCount >= 3) return;
    setHintCount((prev) => {
      const newHintCount = prev + 1;
      return newHintCount;
    });

    console.log(
      `💡 Hint pressed! Count: ${hintCount + 1}, familiarLevl: ${getFamiliarityLevel(hintCount + 1)}`
    );
  };

  const dispatch = useDispatch<any>();

  useEffect(() => {
    setHintCount(0);
  }, [currentWordIndex]);

  // Animated value for progress bar
  const progressWidth = useSharedValue(0);

  const getReviewQueueData = async () => {
    const result = await dispatch(fetchReviewInfo());
    const { todaysReview } = result.payload;
    const { reviewWordsIds } = todaysReview;
    //fetch words by reviewWordsIds
    const reviewWords = words.filter((word) =>
      reviewWordsIds.includes(word.id)
    );
    setReviewQueue(reviewWords);
    setCurrentWordIndex(0); // Reset to first word when queue updates
  };

  const currentWord = reviewQueue[currentWordIndex];

  // Animate progress bar when currentWordIndex or reviewQueue changes
  useEffect(() => {
    if (reviewQueue.length > 0) {
      const newProgress = ((currentWordIndex + 1) / reviewQueue.length) * 100;
      progressWidth.value = withTiming(newProgress, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progressWidth.value = withTiming(0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [currentWordIndex, reviewQueue.length]);

  // Animated style for progress bar
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
      height: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      borderRadius: 4,
    };
  });

  useEffect(() => {
    getReviewQueueData();
  }, [dispatch]);

  return (
    <View
      style={{
        backgroundColor: "#131416",
        padding: 6,
      }}
      className="flex-1 flex flex-col"
    >
      {/* Top Section - Keep existing UI */}
      <View
        style={[
          {
            height: 217,
            borderRadius: BORDER_RADIUS * 2,
          },
        ]}
        className="w-full bg-white overflow-hidden"
      >
        {/* Gradient Background */}
        <LinearGradient
          colors={["#292526", "#5b3023", "#292526"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        />
        <View className="w-full h-full absolute px-3 pt-16 flex flex-col">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => {
                router.back();
              }}
            >
              <ChevronLeft color={"#fff"} />
            </TouchableOpacity>
            <View>
              <Text
                style={{
                  fontSize: 18,
                  color: "white",
                  opacity: 0.7,
                  fontWeight: "400",
                }}
              >
                Spaced Recall
              </Text>
            </View>
            <TouchableOpacity className="opacity-0">
              <ChevronLeft color={"#fff"} />
            </TouchableOpacity>
          </View>
          <View className="flex-1 w-full flex-col px-3 justify-center gap-3">
            <View
              style={{ alignItems: "baseline" }}
              className="flex flex-row items-center justify-start"
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "400",
                  color: "white",
                }}
              >
                {currentWordIndex + 1}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "400",
                  color: "white",
                  opacity: 0.6,
                }}
              >
                /{reviewQueue.length}
              </Text>
            </View>
            <View className="flex flex-col justify-start">
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "400",
                  color: "white",
                  opacity: 0.6,
                }}
              >
                to review today
              </Text>
              <View
                style={{
                  height: 11,
                  borderRadius: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                }}
                className="w-full mt-1"
              >
                {/* Animated Progress Bar */}
                <Animated.View style={[animatedProgressStyle]} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Section - Word Review Area */}
      <View
        style={{
          marginTop: 6,
          borderRadius: BORDER_RADIUS * 2,
          backgroundColor: "#131416",
        }}
        className="flex-1 w-full"
      >
        {reviewQueue.length > 0 && currentWord ? (
          <View className="flex-1">
            {/* Word Display */}
            <View className="flex-1 justify-start items-center">
              <ReviewFlexCard
                familiarityLevel={getFamiliarityLevel(hintCount)}
                word={currentWord}
                isLoading={loading}
              />
            </View>
            <View className=" px-6">
              <ControlPanel
                isLoading={loading}
                handleNextWord={handleNextWord}
                familiarityLevel={getFamiliarityLevel(hintCount)}
                handleHintPressed={handleHintPressed}
              />
            </View>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-gray-400 text-lg text-center">
              {reviewQueue.length === 0
                ? "No words to review today"
                : "Loading words..."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
