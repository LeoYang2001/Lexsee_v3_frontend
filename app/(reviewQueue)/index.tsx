import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Dimensions, Alert } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch } from "react-redux";
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
import {
  ConversationResponse,
  fetchQuickConversation,
} from "../../apis/AIFeatures";
import { handleScheduleNotification } from "../../apis/setSchedule";
import { getLocalDate } from "../../util/utli";
import { getReviewWordsForToday } from "../../store/selectors/todayReviewSelectors";
import { selectDailyQueue } from "../../store/slices/wordsListSlice";
import { useDailyStats } from "../../hooks/useDailyStats";

const { width, height } = Dimensions.get("window");
const BORDER_RADIUS = Math.min(width, height) * 0.06;
const reviewIntervalMax = 180;

export default function ReviewQueueScreen() {
  // instead of fetching words directly,
  //  we fetch the review entities first and fork a list

  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const [hintCount, setHintCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const aiSettings = useAppSelector((state) => state.aiSettings);
  const activeModel = aiSettings.activeModel;

  const userProfile = useAppSelector((state) => state.profile.data);

  // const todayAndPastDueWords = useAppSelector(getReviewWordsForToday);
  const todayAndPastDueWords = useAppSelector(selectDailyQueue);

  const [reviewQueue, setReviewQueue] = useState(todayAndPastDueWords);
  const [currentWord, setCurrentWord] = useState(reviewQueue[currentWordIndex]);

  const [ifShowConfirmPage, setIfShowConfirmPage] = useState(false);

  const { completed, total, progress, status } = useDailyStats();

  const [conversationData, setConversationData] =
    useState<ConversationResponse | null>(null);

  // Keep ONLY the Animation Effect
  useEffect(() => {
    setCurrentWord(reviewQueue[currentWordIndex]);
    if (reviewQueue.length > 0) {
      const newProgress = ((currentWordIndex + 1) / reviewQueue.length) * 100;
      progressWidth.value = withTiming(newProgress, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    }
    //reset confirm page when index changes
    setIfShowConfirmPage(false);
  }, [currentWordIndex, reviewQueue.length]);

  // Fetch example sentences from the API or any other source
  const fetchExampleSentences = async () => {
    if (!currentWord?.word) return;

    try {
      setLoading(true);
      const conversation = await fetchQuickConversation(
        currentWord.word,
        activeModel,
      );

      if (conversation) {
        setConversationData(conversation);
        // update current word's conversation data
        setCurrentWord((prev) => ({
          ...prev,
          exampleSentences: JSON.stringify(conversation),
        }));
      }
    } catch (error) {
      console.error("Error fetching example sentences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextWord = async (familiarityLevel: RecallAccuracy) => {
    // Event-driven reset (Better than useEffect)
    setHintCount(0);
    setConversationData(null);

    if (!userProfile || !userProfile.id) {
      console.error("❌ Missing profile data");
      return false;
    }

    setLoading(true);
    console.log(
      `➡️ Next word! Current index: ${currentWordIndex}, familiarityLevel: ${familiarityLevel}, word: ${currentWord.word}`,
    );

    try {
      // Step 1: Calculate next review data, set loading to true

      if (!currentWord.review_interval || !currentWord.ease_factor)
        return console.log(
          "❌ Missing review interval or ease factor for the current word",
        );

      if (!currentWord.nextReviewDate) {
        return console.log("❌ Missing next review date for the current word");
      }
      const { next_due, review_interval, ease_factor } = getNextReview({
        review_interval: currentWord.review_interval,
        ease_factor: currentWord.ease_factor,
        recall_accuracy: familiarityLevel,
        scheduledReviewDate: currentWord.nextReviewDate,
      });

      console.log(
        `✅ Calculated next review data: nextReviewDate=${next_due}, review_interval=${review_interval}, ease_factor=${ease_factor}`,
      );

      const isLast = currentWordIndex === reviewQueue.length - 1;

      //Step 2: asyncly (do not wait unless its the last word) update the backend with the new review data

      // updateReviewBackend(currentWord, next_due, review_interval, ease_factor);
      updateWordMeta(
        currentWord,
        next_due,
        review_interval,
        ease_factor,
        familiarityLevel,
      );

      // Step 3: If this was the last word, navigate back; otherwise advance index
      if (isLast) {
        router.back();
      } else {
        //   // Advance index
        setCurrentWordIndex((prevIndex) => prevIndex + 1);
      }
    } catch (error) {
      console.error(`❌ Unexpected error in handleNextWord:`, error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateWordMeta = async (
    currentWord: any,
    nextReviewDate: string,
    reviewInterval: number,
    easeFactor: number,
    familiarityLevel: RecallAccuracy,
  ) => {
    try {
      console.log(
        `📡 Updating Word: ${currentWord.word} (ID: ${currentWord.id})`,
      );

      // 1. Prepare the timeline entry (the "biography" of this word)
      const currentTimeline = JSON.parse(currentWord.reviewedTimeline || "[]");
      const newEntry = {
        date: getLocalDate(),
        interval: reviewInterval,
        ease: easeFactor,
        familiarityLevel,
      };

      // 2. Perform the mutation
      const { errors } = await (client as any).models.Word.update({
        id: currentWord.id,
        nextReviewDate,
        reviewInterval,
        easeFactor,
        reviewedTimeline: JSON.stringify([...currentTimeline, newEntry]),
      });

      if (errors) {
        console.error("❌ AppSync Update Errors:", errors);
        return;
      }

      console.log(`✅ Backend Update Success for ${currentWord.word}`);

      // 3. Optional: Trigger the Daily Journal update here
      await syncToDailyJournal(currentWord, reviewQueue.length);
      // await incrementDailyReviewCount();
    } catch (error) {
      console.error("❌ Critical failure in updateWordMeta:", error);
    }
  };

  const syncToDailyJournal = async (currentWord: any, queueLength: number) => {
    if (!userProfile?.id) {
      console.error("❌ Missing profile data");
      return;
    }

    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const score = getScoreByHint(hintCount);

      // 1. Prepare the log entry for this specific interaction
      const newLogEntry = {
        wordId: currentWord.id,
        word: currentWord.word,
        score: score,
      };

      // 2. Check for existing daily record
      const { data: schedules } = await (
        client as any
      ).models.CompletedReviewSchedule.list({
        filter: {
          scheduleDate: { eq: todayStr },
          userProfileId: { eq: userProfile.id },
        },
      });

      if (schedules.length > 0) {
        const record = schedules[0];
        const currentLogs = JSON.parse(record.reviewLogs || "[]");

        // Update existing record
        await (client as any).models.CompletedReviewSchedule.update({
          id: record.id,
          reviewLogs: JSON.stringify([...currentLogs, newLogEntry]),
        });
      } else {
        // 3. FIRST REVIEW OF THE DAY
        // This is the only time we set 'totalWords' to create the snapshot
        await (client as any).models.CompletedReviewSchedule.create({
          userProfileId: userProfile.id,
          scheduleDate: todayStr,
          totalWords: queueLength,
          reviewLogs: JSON.stringify([newLogEntry]),
        });
      }
      console.log("📊 Daily Journal Updated with Review Log");
    } catch (err) {
      console.error("⚠️ Failed to sync daily journal:", err);
    }
  };

  const handleHintPressed = () => {
    if (hintCount >= 3) return;

    console.log("currentWOrd:", JSON.stringify(currentWord));

    const newCount = hintCount + 1;
    setHintCount(newCount);

    const exampleSentences = JSON.parse(currentWord.exampleSentences || "null");

    if (newCount === 2) {
      if (exampleSentences) {
        console.log(
          "Has exampleSentences: ",
          JSON.stringify(currentWord.exampleSentences),
        );
        setConversationData(exampleSentences);
      } else {
        console.log("No example sentences found, fetching from API...");
        fetchExampleSentences();
      }
    }

    console.log(
      `💡 Hint pressed! Count: ${hintCount + 1}, familiarLevl: ${getFamiliarityLevel(hintCount + 1)}`,
    );
  };

  // Animated value for progress bar
  const progressWidth = useSharedValue(0);

  // Animated style for progress bar
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
      height: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      borderRadius: 4,
    };
  });

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
                {completed + 1}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "400",
                  color: "white",
                  opacity: 0.6,
                }}
              >
                /{total}
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
          <View className="flex-1 ">
            {/* If past due badge  */}
            {currentWord.ifPastDue && (
              <View className="absolute top-4 bg-red-500 right-6 z-30 px-1 py-1 rounded">
                <Text className="text-white text-xs">overdue</Text>
              </View>
            )}
            {/* Word Display */}
            <View className="flex-1 justify-start items-center">
              <ReviewFlexCard
                familiarityLevel={getFamiliarityLevel(hintCount)}
                word={currentWord}
                isLoading={loading}
                conversationData={conversationData}
                ifShowConfirmPage={ifShowConfirmPage}
              />
            </View>
            <View className=" px-6">
              <ControlPanel
                isLoading={loading}
                handleNextWord={handleNextWord}
                ifShowConfirmPage={ifShowConfirmPage}
                setIfShowConfirmPage={setIfShowConfirmPage}
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

const getScoreByHint = (hintCount: number): number => {
  switch (hintCount) {
    case 0:
      return 5;
    case 1:
      return 3;
    case 2:
      return 2;
    default:
      return 1;
  }
};

const getFamiliarityLevel = (count: number): RecallAccuracy => {
  if (count >= 3) return "poor";
  if (count === 2) return "fair";
  if (count === 1) return "good";
  return "excellent";
};
