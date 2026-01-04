import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, Zap } from "lucide-react-native";
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
import {
  ConversationResponse,
  fetchQuickConversation,
} from "../../apis/AIFeatures";
import { setSchedule } from "../../apis/setSchedule";

const { width, height } = Dimensions.get("window");
const BORDER_RADIUS = Math.min(width, height) * 0.06;

export default function ReviewQueueScreen() {
  // get the words by reviewIds we fetched
  const [reviewQueue, setReviewQueue] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const words = useSelector((state: RootState) => state.wordsList.words);

  const [hintCount, setHintCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ifChina = useAppSelector((state) => state.ifChina.ifChina);

  const userProfile = useAppSelector((state) => state.profile);
  const currentWord = reviewQueue[currentWordIndex];

  const [conversationData, setConversationData] =
    useState<ConversationResponse | null>(null);

  useEffect(() => {
    //try to fetch existing conversation data from Redux store or local state
    if (currentWord) {
      const parsedConversation = JSON.parse(
        currentWord.exampleSentences as string
      );
      if (parsedConversation && parsedConversation.conversation) {
        setConversationData(parsedConversation);
      }
    }
  }, [currentWord]);

  useEffect(() => {
    //fetch exampleSentences when hintCount gets to 3
    if (hintCount === 2 && !conversationData) {
      console.log(
        "start fetching example sentences for word:",
        currentWord.word
      );
      setLoading(true);

      // Fetch example sentences from the API or any other source
      const fetchExampleSentences = async () => {
        try {
          const conversation = await fetchQuickConversation(
            currentWord.word,
            ifChina ? "deepseek" : "openai"
          );

          if (conversation) {
            setConversationData(conversation);
            console.log("✅ New conversation generated (with animation)");
            console.log("conversation:", conversation);
          }
        } catch (error) {
          console.error("Error fetching example sentences:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchExampleSentences();
    }
  }, [hintCount]);

  const handleNextWord = async (familiarityLevel: RecallAccuracy) => {
    setLoading(true);
    console.log(
      `➡️ Next word! Current index: ${currentWordIndex}, familiarityLevel: ${familiarityLevel}, word: ${currentWord.word}`
    );

    try {
      // Step 1: Calculate next review data
      const { next_due, review_interval, ease_factor } = getNextReview({
        review_interval: currentWord.review_interval,
        ease_factor: currentWord.ease_factor,
        recall_accuracy: familiarityLevel,
      });
      console.log(
        `📊 Next due: ${next_due}, review_interval: ${review_interval}, ease_factor: ${ease_factor}`
      );

      // Step 2: Update word's review metrics in backend
      try {
        const currentWordUpdated = {
          ...currentWord,
          exampleSentences: conversationData
            ? JSON.stringify(conversationData)
            : currentWord.exampleSentences,
          review_interval,
          ease_factor,
        };

        // Mark as LEARNED if mastered
        if (review_interval > 60) {
          console.log(`✅ Word mastered! Updating status to LEARNED.`);
          currentWordUpdated.status = "LEARNED";
        }

        const updateData = {
          id: currentWordUpdated.id,
          data: JSON.stringify(currentWordUpdated),
          ...(review_interval > 60 && { status: "LEARNED" }),
        };

        await (client.models as any).Word.update(updateData);
        console.log(
          `✅ Updated word: interval=${review_interval}, ease=${ease_factor.toFixed(2)}`
        );
      } catch (error) {
        console.error(`❌ Error updating word review data:`, error);
        throw error;
      }

      // Step 3: Mark current word as REVIEWED in today's schedule
      try {
        const currentDate = new Date().toISOString().split("T")[0];

        // Get today's schedule
        const todaysSchedule = await (client.models as any).ReviewSchedule.list(
          {
            filter: {
              and: [
                { userProfileId: { eq: userProfile.profile?.id } },
                { scheduleDate: { eq: currentDate } },
              ],
            },
          }
        );

        if (todaysSchedule.data && todaysSchedule.data.length > 0) {
          const schedule = todaysSchedule.data[0];

          // Find the ReviewScheduleWord for this word
          const scheduleWords = await (
            client.models as any
          ).ReviewScheduleWord.list({
            filter: {
              and: [
                { reviewScheduleId: { eq: schedule.id } },
                { wordId: { eq: currentWord.id } },
              ],
            },
          });

          if (scheduleWords.data && scheduleWords.data.length > 0) {
            const scheduleWord = scheduleWords.data[0];

            // Calculate score based on familiarity level
            const scoreMap = {
              excellent: 5,
              good: 4,
              fair: 2,
              poor: 0,
            };

            const score = scoreMap[familiarityLevel];

            // Mark as REVIEWED
            await (client.models as any).ReviewScheduleWord.update({
              id: scheduleWord.id,
              status: "REVIEWED",
              score: score,
              answeredAt: new Date().toISOString(),
            });

            console.log(`✅ Marked word as REVIEWED with score: ${score}/5`);

            // Update schedule counts
            const allWords = await (
              client.models as any
            ).ReviewScheduleWord.list({
              filter: {
                reviewScheduleId: { eq: schedule.id },
              },
            });

            const reviewedCount =
              allWords.data?.filter((w: any) => w.status === "REVIEWED")
                .length || 0;
            const toBeReviewedCount =
              allWords.data?.filter((w: any) => w.status === "TO_REVIEW")
                .length || 0;

            await (client.models as any).ReviewSchedule.update({
              id: schedule.id,
              reviewedCount,
              toBeReviewedCount,
              successRate:
                (reviewedCount / (reviewedCount + toBeReviewedCount)) * 100,
            });

            console.log(
              `📊 Schedule updated: ${reviewedCount} reviewed, ${toBeReviewedCount} remaining`
            );
          }
        }
      } catch (error) {
        console.error(`❌ Error marking word as reviewed:`, error);
        // Don't throw - continue with scheduling
      }

      // Step 4: Schedule for next review (only if not mastered)
      if (review_interval <= 60) {
        try {
          // Get or create schedule for next due date
          const nextDueDate = new Date(next_due).toISOString().split("T")[0];

          // Check if schedule exists for next due date
          const nextSchedule = await (client.models as any).ReviewSchedule.list(
            {
              filter: {
                and: [
                  { userProfileId: { eq: userProfile.profile?.id } },
                  { scheduleDate: { eq: nextDueDate } },
                ],
              },
            }
          );

          let targetSchedule = nextSchedule.data?.[0];
          let isNewSchedule = false;

          // Create schedule if it doesn't exist
          if (!targetSchedule) {
            const newSchedule = await (
              client.models as any
            ).ReviewSchedule.create({
              userProfileId: userProfile.profile?.id,
              scheduleDate: nextDueDate,
              toBeReviewedCount: 1,
              reviewedCount: 0,
              totalWords: 1,
            });
            targetSchedule = newSchedule.data;
            isNewSchedule = true;
            console.log(
              `📅 Created new schedule for ${nextDueDate}`,
              targetSchedule
            );
          }

          // Check if word already exists in this schedule
          const existingWord = await (
            client.models as any
          ).ReviewScheduleWord.list({
            filter: {
              and: [
                { reviewScheduleId: { eq: targetSchedule.id } },
                { wordId: { eq: currentWord.id } },
              ],
            },
          });

          let toReviewCount = 0;

          if (!existingWord.data || existingWord.data.length === 0) {
            // Create new ReviewScheduleWord
            const createResponse = await (
              client.models as any
            ).ReviewScheduleWord.create({
              reviewScheduleId: targetSchedule.id,
              wordId: currentWord.id,
              status: "TO_REVIEW",
            });

            console.log(`✅ Created ReviewScheduleWord:`, createResponse.data);

            // Update schedule counts after adding word
            const allWords = await (
              client.models as any
            ).ReviewScheduleWord.list({
              filter: {
                reviewScheduleId: { eq: targetSchedule.id },
              },
            });

            const totalCount = allWords.data?.length || 1;
            toReviewCount =
              allWords.data?.filter((w: any) => w.status === "TO_REVIEW")
                .length || 1;
            const reviewedCount =
              allWords.data?.filter((w: any) => w.status === "REVIEWED")
                .length || 0;

            await (client.models as any).ReviewSchedule.update({
              id: targetSchedule.id,
              totalWords: totalCount,
              toBeReviewedCount: toReviewCount,
              reviewedCount: reviewedCount,
            });

            console.log(
              `📊 Updated future schedule for ${nextDueDate}: ${toReviewCount} to review`
            );
          } else {
            console.log(
              `⚠️ Word already scheduled for ${nextDueDate}, skipping duplicate`
            );
          }

          // Step 4b: Schedule notification only for new schedules
          if (isNewSchedule && targetSchedule) {
            try {
              console.log(
                `🔔 Scheduling notification for ${nextDueDate} with ${toReviewCount || 1} words`
              );

              // Schedule the notification
              const notificationId = await setSchedule(
                toReviewCount || 1,
                next_due
              );

              if (notificationId) {
                // Update schedule with notification ID
                await (client.models as any).ReviewSchedule.update({
                  id: targetSchedule.id,
                  notificationId: notificationId,
                });

                console.log(
                  `✅ Notification scheduled with ID: ${notificationId}`
                );
              } else {
                console.warn(`⚠️ Failed to schedule notification`);
              }
            } catch (error) {
              console.error(`❌ Error scheduling notification:`, error);
              // Don't throw - notification is optional
            }
          }
        } catch (error) {
          console.error(`❌ Error scheduling next review:`, error);
        }
      }

      // Step 5: Move to next word or complete session
      if (currentWordIndex < reviewQueue.length - 1) {
        setCurrentWordIndex((prevIndex) => prevIndex + 1);
        setConversationData(null);
        setHintCount(0);
        console.log(
          `➡️ Moving to next word (${currentWordIndex + 2}/${reviewQueue.length})`
        );
      } else {
        console.log(`🎉 All reviews completed for today!`);
        alert("🎉 You've completed all reviews for today!");
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } catch (error) {
      console.error(`❌ Unexpected error in handleNextWord:`, error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
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
    try {
      const result = await dispatch(fetchReviewInfo());
      console.log(
        "review info fetched:",
        JSON.stringify(result.payload, null, 2)
      );

      if (!result.payload) {
        console.warn("⚠️ No review info available");
        setReviewQueue([]);
        return;
      }

      const { reviewQueue: reviewQueueData, scheduleWords } = result.payload;

      // Filter only words with TO_REVIEW status
      const toReviewWords =
        scheduleWords
          ?.filter((sw: any) => sw.status === "TO_REVIEW")
          .map((sw: any) => sw.wordId) || [];

      console.log(`📋 Words to review: ${toReviewWords.length}`, toReviewWords);

      // Filter reviewQueue to only include TO_REVIEW words
      const filteredReviewQueue =
        reviewQueueData
          ?.filter((word: any) => toReviewWords.includes(word.id))
          .map((word: any) => {
            // Find the full word data from words list
            const fullWordData = words.find((w: Word) => w.id === word.id);

            if (!fullWordData) {
              console.warn(`⚠️ Word ${word.id} not found in words list`);
              return null;
            }

            return {
              ...fullWordData,
              scheduleWordId: word.scheduleWordId,
              scheduleStatus: word.scheduleStatus,
              scheduleScore: word.scheduleScore,
            };
          })
          .filter((word: any) => word !== null) || [];

      console.log(
        `✅ Filtered review queue: ${filteredReviewQueue.length} words`,
        filteredReviewQueue.map((w: any) => ({
          word: w.word,
          scheduleStatus: w.scheduleStatus,
        }))
      );

      setReviewQueue(filteredReviewQueue);
      setCurrentWordIndex(0);
    } catch (error) {
      console.error("❌ Error fetching review queue data:", error);
      alert("Failed to load review words");
      setReviewQueue([]);
    }
  };

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
                conversationData={conversationData}
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
