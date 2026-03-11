import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import React, { useState } from "react";
import { BlurView } from "expo-blur";
import { StudyConfig } from "../../app/(onboarding)";
import BrainLoadSlider from "./BrainLoadSlider";

interface SimulationResult {
  totalDaysElapsed: number;
  peakReviewsPerDay: number;
}

interface Wordlist {
  id: string;
  label: string;
  wordCount: number;
  description: string;
  cover: any;
}

function simulateMastery(
  wordsPerDay: number,
  totalWords: number,
  masteryInterval: number = 60,
): SimulationResult {
  let daysElapsed = 0;
  let masteredCount = 0;

  // Track each word: { nextDueDay, interval, ease, reviewsCount }
  let wordBank: {
    nextDueDay: number;
    interval: number;
    ease: number;
    reviews: number;
  }[] = [];
  let wordsIntroduced = 0;
  let maxReviewsInADay = 0;

  while (masteredCount < totalWords) {
    daysElapsed++;
    let reviewsToday = 0;

    // 1. Introduce new words at the start of the day
    if (wordsIntroduced < totalWords) {
      const remaining = totalWords - wordsIntroduced;
      const batchSize = Math.min(wordsPerDay, remaining);
      for (let i = 0; i < batchSize; i++) {
        // Initial interval is 0 so they are due "today"
        wordBank.push({
          nextDueDay: daysElapsed,
          interval: 0,
          ease: 2.5,
          reviews: 0,
        });
        wordsIntroduced++;
      }
    }

    // 2. Process all reviews due today
    for (let word of wordBank) {
      // Only review if word is due AND not yet mastered
      if (word.nextDueDay === daysElapsed && word.interval < masteryInterval) {
        reviewsToday++;
        word.reviews++;

        // Logic: Alternating 50/50 Good and Excellent
        if (word.reviews % 2 === 0) {
          // EXCELLENT path
          const boostedInterval = (word.interval || 1) * word.ease * 1.3;
          word.interval = Math.max(1, Math.round(boostedInterval));
          word.ease += 0.15;
        } else {
          // GOOD path
          const calculatedInterval = (word.interval || 1) * word.ease;
          word.interval = Math.max(1, Math.round(calculatedInterval));
        }

        // Schedule the next review date
        word.nextDueDay = daysElapsed + word.interval;

        // Check if this review pushed it into mastery
        if (word.interval >= masteryInterval) {
          masteredCount++;
        }
      }
    }

    // Track the busiest day
    maxReviewsInADay = Math.max(maxReviewsInADay, reviewsToday);

    // Safety break to prevent infinite loops in edge cases
    if (daysElapsed > 20000) break;
  }

  return {
    totalDaysElapsed: daysElapsed,
    peakReviewsPerDay: maxReviewsInADay,
  };
}

const WORDLISTS: Wordlist[] = [
  {
    id: "ielts",
    label: "IELTS 3000",
    wordCount: 3000,
    description: "IELTS prep",
    cover: require("../../assets/wordsList/bookCovers/IELTS_3000.png"),
  },
  {
    id: "toefl",
    label: "TOEFL Core",
    wordCount: 2500,
    description: "TOEFL prep",
    cover: require("../../assets/wordsList/bookCovers/TOEFL_2500.png"),
  },
  {
    id: "general",
    label: "General Expansion",
    wordCount: 2000,
    description: "General vocab",
    cover: require("../../assets/wordsList/bookCovers/GENERAL_2000.png"),
  },
];

const ExamreadyGoal = ({
  studyConfig,
  setStudyConfig,
}: {
  studyConfig: StudyConfig | null;
  setStudyConfig: (config: StudyConfig | null) => void;
}) => {
  const [selectedWordlist, setSelectedWordlist] = useState<string | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom config state
  const [customDailyPacing, setCustomDailyPacing] = useState("10");
  const [customMasteryInterval, setCustomMasteryInterval] = useState("60");
  const [customNotificationsEnabled, setCustomNotificationsEnabled] =
    useState(true);
  const [customOverallGoal, setCustomOverallGoal] = useState("1500");

  // Calculate timeline and peak reviews using simulation
  const getSimulationResults = () => {
    const goal = parseInt(customOverallGoal) || 0;
    const pacing = parseInt(customDailyPacing) || 1;
    const interval = parseInt(customMasteryInterval) || 60;

    return simulateMastery(pacing, goal, interval);
  };

  // Calculate timeline based on simulation
  const calculateTimeline = () => {
    const results = getSimulationResults();
    return results.totalDaysElapsed;
  };

  // Validate form inputs
  const isFormValid = () => {
    const goal = parseInt(customOverallGoal) || 0;
    const pacing = parseInt(customDailyPacing) || 0;
    const interval = parseInt(customMasteryInterval) || 0;

    return goal > 0 && pacing > 0 && interval > 0;
  };

  // Calculate estimated peak reviews per day from simulation
  const estimatedPeakReviews = getSimulationResults().peakReviewsPerDay;

  // Get color based on daily pacing severity
  const getPacingColor = () => {
    const pacing = parseInt(customDailyPacing) || 0;
    if (pacing < 5) return "#6B7280"; // Gray - too easy
    if (pacing <= 10) return "#10B981"; // Green - optimal
    return "#EF4444"; // Red - overload
  };

  // Get pacing status label
  const getPacingStatus = () => {
    const pacing = parseInt(customDailyPacing) || 0;
    if (pacing < 5) return "Too easy";
    if (pacing <= 10) return "Recommended";
    return "Heavy load";
  };

  const handleSelectWordlist = (wordlistId: string) => {
    // If already selected, unselect
    if (selectedWordlist === wordlistId) {
      setSelectedWordlist(null);
      setStudyConfig(null);
      return;
    }

    const selectedBook = WORDLISTS.find((book) => book.id === wordlistId);
    if (selectedBook) {
      setSelectedWordlist(wordlistId);
      setCustomOverallGoal(selectedBook.wordCount.toString());
      setShowCustomModal(true);
    }
  };

  const handleSaveCustomConfig = () => {
    if (!isFormValid()) return;

    const timeline = calculateTimeline();
    setStudyConfig({
      dailyPacing: parseInt(customDailyPacing) || 0,
      masteryIntervalDays: parseInt(customMasteryInterval) || 60,
      newwordNotificationsEnabled: customNotificationsEnabled,
      overallGoal: parseInt(customOverallGoal) || 0,
      daysForGoal: timeline,
    });

    setShowCustomModal(false);
  };

  const handleCloseModal = () => {
    setShowCustomModal(false);
  };

  const estimatedMonths = Math.ceil(calculateTimeline() / 30);

  return (
    <View className="flex-1 px-6 pt-8 ">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-3xl font-bold text-white leading-tight">
          Exam Ready Mode
        </Text>
        <Text className="text-white/60 text-base  mt-2 leading-6">
          Master vocabulary lists designed for standardized tests and academic
          success
        </Text>
      </View>

      {/* Wordlist Selection Section */}
      <View className="mb-6 mt-6">
        <Text className="text-white text-lg font-semibold mb-4">
          Choose your wordlist
        </Text>
        <ScrollView
          horizontal
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={160}
          contentContainerStyle={{
            gap: 12,
            paddingHorizontal: 24,
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          {WORDLISTS.map((wordlist) => (
            <TouchableOpacity
              key={wordlist.id}
              onPress={() => handleSelectWordlist(wordlist.id)}
              className={`rounded-xl overflow-hidden border w-40 h-52 relative ${
                selectedWordlist === wordlist.id
                  ? "border-[#FF511B] border-2"
                  : "border-white/10"
              }`}
            >
              <Image
                source={wordlist.cover}
                className="w-full h-full"
                resizeMode="cover"
              />

              {/* Text overlay with blur */}
              <View className="absolute bottom-0 left-0 right-0 overflow-hidden">
                <BlurView intensity={80} tint="dark" className="p-3">
                  <Text className="text-white text-base font-bold mb-1">
                    {wordlist.label}
                  </Text>
                  <Text className="text-white/80 text-xs">
                    {wordlist.wordCount.toLocaleString()} words
                  </Text>
                </BlurView>
              </View>
            </TouchableOpacity>
          ))}

          {/* Add Book Card */}
          <TouchableOpacity
            onPress={() => {
              // TODO: Navigate to book library page
              console.log("Navigate to book library");
            }}
            className="rounded-xl overflow-hidden border w-40 h-52 border-white/10 bg-white/5 flex items-center justify-center"
          >
            <View className="items-center">
              <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center mb-3">
                <Text className="text-white text-3xl">+</Text>
              </View>
              <Text className="text-white text-base font-bold">Add Book</Text>
              <Text className="text-white/60 text-xs mt-1">Browse library</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Quick Stats */}
      {selectedWordlist && (
        <View className="bg-white/5 rounded-xl p-4 mb-8 border border-white/10">
          <Text className="text-white/60 text-xs font-semibold mb-3">
            ESTIMATED TIMELINE
          </Text>
          <Text className="text-white text-2xl font-bold">
            {estimatedMonths} months
          </Text>
          <Text className="text-white/50 text-sm mt-2">
            ~{estimatedPeakReviews} reviews on peak day
          </Text>
        </View>
      )}

      {/* Customize Button */}
      {selectedWordlist && (
        <TouchableOpacity
          onPress={() => setShowCustomModal(true)}
          className="bg-[#FF511B] rounded-xl p-4 mb-8"
        >
          <Text className="text-white text-center font-semibold">
            Customize Plan
          </Text>
        </TouchableOpacity>
      )}

      {/* Custom Modal */}
      <Modal
        visible={showCustomModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onDismiss={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1   bg-[#0a0a0a]"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-6 pt-8  flex-1 pb-10 flex flex-col  ">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between mb-8">
                <Text className="text-white text-2xl font-bold">
                  Customize Your Plan
                </Text>
                <Pressable onPress={handleCloseModal} hitSlop={8}>
                  <Text className="text-white/60 text-lg">✕</Text>
                </Pressable>
              </View>

              {/* Selected Wordlist Info with Book Cover */}
              <View className="mb-6 bg-white/5 rounded-xl overflow-hidden border border-white/10">
                <View className="flex-row items-center gap-4 p-4">
                  <Image
                    source={
                      WORDLISTS.find((book) => book.id === selectedWordlist)
                        ?.cover
                    }
                    className="w-20 h-28 rounded-lg"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text className="text-white/60 text-xs font-semibold mb-2">
                      SELECTED WORDLIST
                    </Text>
                    <Text className="text-white text-lg font-bold mb-1">
                      {
                        WORDLISTS.find((book) => book.id === selectedWordlist)
                          ?.label
                      }
                    </Text>
                    <Text className="text-white/50 text-sm">
                      {WORDLISTS.find(
                        (book) => book.id === selectedWordlist,
                      )?.wordCount.toLocaleString()}{" "}
                      words
                    </Text>
                  </View>
                </View>
              </View>

              {/* Daily Pacing Section */}
              <View className="mb-8">
                <Text className="text-white text-sm font-semibold mb-4">
                  Daily Pacing
                </Text>
                <BrainLoadSlider
                  MAX_VALUE={35}
                  value={parseInt(customDailyPacing)}
                  onValueChange={(value) =>
                    setCustomDailyPacing(value.toString())
                  }
                />
              </View>

              {/* Stats Card */}
              <View className="my-6">
                <View className="rounded-xl p-3 border bg-white/5 border-white/10">
                  <View className="flex-row items-center gap-2 mb-3">
                    <Text
                      className="text-lg font-bold"
                      style={{ color: getPacingColor() }}
                    >
                      {customDailyPacing} words/day
                    </Text>
                    <View
                      className="px-2 py-1 rounded"
                      style={{ backgroundColor: getPacingColor() + "20" }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: getPacingColor() }}
                      >
                        {getPacingStatus()}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-white text-sm font-semibold mb-2">
                    Estimated Timeline
                  </Text>
                  <View className="gap-1">
                    <View className="flex-row items-baseline gap-2">
                      <Text className="text-white/70 text-lg font-bold">
                        ~{calculateTimeline()} days
                      </Text>
                      <Text className="text-white/50 text-xs">
                        to reach your goal
                      </Text>
                    </View>
                    <View className="flex-row items-baseline gap-2 mt-1">
                      <Text
                        className="text-base font-semibold"
                        style={{ color: getPacingColor() }}
                      >
                        ~{estimatedPeakReviews} reviews/day
                      </Text>
                      <Text className="text-white/50 text-xs">
                        at peak efficiency
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Mastery Interval Section */}
              <View className="mb-5">
                <Text className="text-white text-sm font-semibold mb-3">
                  Mastery Level
                </Text>

                {/* Preset Options */}
                <View className="flex-row gap-2">
                  {[
                    { days: 180, label: "Mastery" },
                    { days: 120, label: "Growth" },
                    { days: 60, label: "Sprint", recommended: true },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.days}
                      onPress={() =>
                        setCustomMasteryInterval(option.days.toString())
                      }
                      className={`flex-1 rounded-xl p-3 border flex-row items-center justify-center ${
                        customMasteryInterval === option.days.toString()
                          ? "bg-[#FF511B] border-[#FF511B]"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <View className="flex-row items-center gap-1">
                        <Text
                          className={`text-sm font-semibold ${
                            customMasteryInterval === option.days.toString()
                              ? "text-white"
                              : "text-white/70"
                          }`}
                        >
                          {option.label}
                        </Text>
                        {option.recommended && (
                          <Text
                            className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                              customMasteryInterval === option.days.toString()
                                ? "bg-white/20 text-white"
                                : "bg-[#FF511B]/30 text-[#FF511B]"
                            }`}
                          >
                            Rec
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Learning Notifications */}
              <View className="mb-12 flex-row items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
                <Text className="text-white text-sm font-semibold">
                  Daily reminders
                </Text>
                <Switch
                  value={customNotificationsEnabled}
                  onValueChange={setCustomNotificationsEnabled}
                  trackColor={{ false: "#374151", true: "#FF511B" }}
                  thumbColor={
                    customNotificationsEnabled ? "#ffffff" : "#ffffff"
                  }
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveCustomConfig}
                disabled={!isFormValid()}
                className={`rounded-xl p-4 mt-auto ${
                  isFormValid() ? "bg-[#FF511B]" : "bg-white/10 opacity-50"
                }`}
              >
                <Text className="text-white text-center font-semibold">
                  Save Plan
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default ExamreadyGoal;
