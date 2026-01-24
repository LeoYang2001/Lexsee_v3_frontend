import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
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

const { width, height } = Dimensions.get("window");
const BORDER_RADIUS = Math.min(width, height) * 0.06;
const reviewIntervalMax = 180;


export default function ReviewQueueScreen() {
  // instead of fetching words directly,
  //  we fetch the review entities first and fork a list
  //  so that we can update locally to optimize performance 
 const schedules = useAppSelector((state) => state.reviewSchedule.items);
 const completedReviewSchedules = useAppSelector((state) => state.completedReviewSchedules.items);
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const [hintCount, setHintCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ifChina = useAppSelector((state) => state.ifChina.ifChina);

  const userProfile = useAppSelector((state) => state.profile.data);

  const todayAndPastDueWords = useAppSelector(getReviewWordsForToday);
  
  const [reviewQueue, setReviewQueue] = useState(todayAndPastDueWords.words)
  const [currentWord, setCurrentWord] = useState(reviewQueue[currentWordIndex]);


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
}, [currentWordIndex, reviewQueue.length]);

  
  
  // Fetch example sentences from the API or any other source
  const fetchExampleSentences = async () => {
    if(!currentWord?.word) return;

        try {
          setLoading(true);
          const conversation = await fetchQuickConversation(
            currentWord.word,
            ifChina ? "deepseek" : "openai"
          );

          if (conversation) {
            setConversationData(conversation);
            // update current word's conversation data
            setCurrentWord((prev) => ({ ...prev, exampleSentences: JSON.stringify(conversation) }));
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
      `➡️ Next word! Current index: ${currentWordIndex}, familiarityLevel: ${familiarityLevel}, word: ${currentWord.word}`
    );

    try {
      // Step 1: Calculate next review data, set loading to true

      if(!currentWord.review_interval || !currentWord.ease_factor)
        return console.log("❌ Missing review interval or ease factor for the current word");

      const { next_due, review_interval, ease_factor } = getNextReview({
        review_interval: currentWord.review_interval,
        ease_factor: currentWord.ease_factor,
        recall_accuracy: familiarityLevel,
      });

      const isLast = currentWordIndex === reviewQueue.length - 1;
     
      //Step 2: asyncly (do not wait unless its the last word) update the backend with the new review data
      // 2.1 find the reviewWord entity corresponding to the current word and call the backend updater
        // Fire-and-forget backend update so UI stays snappy
        updateReviewBackend(
          currentWord,
          next_due,
          review_interval,
          ease_factor
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

  // Helper: performs all backend updates for a reviewed word
  const updateReviewBackend = async (
    currentWord: any,
    next_due: any,
    review_interval: any,
    ease_factor: any
  ) => {


    
     if (!userProfile || !userProfile.id) {
      return false;
    }

    try {
      // Step 1: Validate environment & dependencies
      if (!userProfile || !userProfile.id) {
        return false;
      }
      if (!client) {
        return false;
      }
      const Models = (client as any).models;
      if (!Models) {
        return false;
      }

      // Step 2: Verify schedule-word model exists and defer update until we have the completed schedule
      if (!Models.ReviewScheduleWord || typeof Models.ReviewScheduleWord.update !== "function") {
        return false;
      }



      // Step 3: Locate today's schedule (we should check as it could be from a previous day) and update its counts
      // instead of finding todays schedule, we should find the schedule corresponding to the reviewWordEntity
      const schedule = schedules.find((s: any) => s.id === currentWord.reviewScheduleId);
    

      if(!schedule) return console.log("❌ Missing schedule for the current word");
     
      // decrement toBeReviewedCount and increment reviewedCount
      const newToBe = Math.max(0, schedule.toBeReviewedCount - 1);
      const newReviewed = (schedule.reviewedCount || 0) + 1;

      if (newToBe === 0) {
        // If no remaining words to review, prefer to delete the schedule to keep data clean
        if (typeof Models.ReviewSchedule.delete === "function") {
          await Models.ReviewSchedule.delete({ id: currentWord.reviewScheduleId });
        } else {
          // Fallback: update to zeros if delete isn't supported
          await Models.ReviewSchedule.update({
            id: currentWord.reviewScheduleId,
            toBeReviewedCount: 0,
            reviewedCount: newReviewed,
          });
        }
      } else {
        await Models.ReviewSchedule.update({
          id: currentWord.reviewScheduleId,
          toBeReviewedCount: newToBe,
          reviewedCount: newReviewed,
        });
      }

      // instead of getting currentDate, get the date corresponding to the schedule
      const currentDate = schedule.scheduleDate || getLocalDate();

      // Step 4: Create or update a CompletedReviewSchedule for today's completed reviews
      if (!Models.CompletedReviewSchedule || typeof Models.CompletedReviewSchedule.list !== "function") {
        return false;
      }
      // get it from redux completedReviewSchedules 
      const existing = completedReviewSchedules.find((s: any) => s.scheduleDate === currentDate);

      let completedSchedule;
      if (existing) {
        // exist 
        completedSchedule = existing;
        // Ensure update method exists on the returned object
        if (typeof Models.CompletedReviewSchedule.update === "function") {
         // overdue word should not increment the reviewedCount
         if(!currentWord.ifPastDue){
           await Models.CompletedReviewSchedule.update({
             id: completedSchedule.id,
             totalWords: (completedSchedule.totalWords || 0) + 1,
             reviewedCount: (completedSchedule.reviewedCount || 0) + 1,
             successRate: ((completedSchedule.successRate || 0) + getScoreByHint(hintCount)),
           });
         }
         else{
          console.log(`❌ Current word is past due, not incrementing reviewedCount for CompletedReviewSchedule`);
           await Models.CompletedReviewSchedule.update({
             id: completedSchedule.id,
             totalWords: (completedSchedule.totalWords || 0) + 1,
             reviewedCount: (completedSchedule.reviewedCount || 0),
             successRate: ((completedSchedule.successRate || 0) + getScoreByHint(hintCount)),
           });
         }
        }
      } else {
        completedSchedule = await Models.CompletedReviewSchedule.create({
          userProfileId: userProfile.id,
          scheduleDate: currentDate,
          totalWords: 1,
          reviewedCount: 1,
          successRate: getScoreByHint(hintCount),
        });
      }

      // Step 5: Link the review schedule-word to the completed schedule
      await Models.ReviewScheduleWord.update({
        id: currentWord.scheduleWordId,
        completedReviewScheduleId: completedSchedule.id,
        status: "REVIEWED",
        score: getScoreByHint(hintCount),
      });

      // Step 6: check review_interval  
        const { id,status,ifPastDue, ...wordData } = currentWord;
      const updatedWordData = {
        ...wordData,
        next_due,
        review_interval,
        ease_factor,
      };

      //6.1  if its larger than 180 days, mark the word as mastered long-term 
      // Update the word data with new review properties (exclude id as it's not part of data)
    
      if (review_interval > reviewIntervalMax) {
        await Models.Word.update({
          id: currentWord.id,
          status: "LEARNED",
          data: JSON.stringify(updatedWordData),
        });
        console.log(`MASTERED CURRENT WORD :${JSON.stringify(currentWord)}`)
      }
      //6.2  if it's not larger than 180 days, schedule a notification for the next review
      else{
         await handleScheduleNotification(
            userProfile,
            currentWord.id,
            next_due
          );
          // Update the word data with new review properties (exclude id as it's not part of data)
          await Models.Word.update({
            id: currentWord.id,
            data: JSON.stringify(updatedWordData),
          });
      
      }
     
      return true;
    } catch (error) {
      return false;
    }
  };

  

  const handleHintPressed = () => {
    if (hintCount >= 3) return;

    console.log('currentWOrd:', JSON.stringify(currentWord))

    const newCount = hintCount + 1;
      setHintCount(newCount);

    if (newCount === 2) {
    if (currentWord.exampleSentences) {
      setConversationData(JSON.parse(currentWord.exampleSentences));
    } else {
      console.log('fetch sentences');
       fetchExampleSentences();
    }
  }

    console.log(
      `💡 Hint pressed! Count: ${hintCount + 1}, familiarLevl: ${getFamiliarityLevel(hintCount + 1)}`
    );
  };

  const dispatch = useDispatch<any>();


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