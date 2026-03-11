import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { milestoneOptions } from "./defaultConfig";
import { StudyConfig } from "../../app/(onboarding)";
import BrainLoadSlider from "./BrainLoadSlider";

interface SimulationResult {
  totalDaysElapsed: number;
  peakReviewsPerDay: number;
}

function simulateMastery(
  wordsPerDay: number,
  totalWords: number,
  masteryInterval: number = 180,
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

const LongtermGoal = ({
  studyConfig,
  setStudyConfig,
}: {
  studyConfig: StudyConfig | null;
  setStudyConfig: (config: StudyConfig | null) => void;
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(
    null,
  );
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom config state
  const [customDailyPacing, setCustomDailyPacing] = useState("3");
  const [customMasteryInterval, setCustomMasteryInterval] = useState("180");
  const [customNotificationsEnabled, setCustomNotificationsEnabled] =
    useState(false);
  const [customOverallGoal, setCustomOverallGoal] = useState("1000");

  // Calculate timeline and peak reviews using simulation
  const getSimulationResults = () => {
    const goal = parseInt(customOverallGoal) || 0;
    const pacing = parseInt(customDailyPacing) || 1;
    const interval = parseInt(customMasteryInterval) || 180;

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

  const handleSelectingMilestone = (id: string) => () => {
    //if already selected, unselect
    if (selectedMilestone === id) {
      setSelectedMilestone(null);
      setStudyConfig(null);
      return;
    }

    if (id === "custom") {
      setShowCustomModal(true);
      return;
    }
    const selectedOption = milestoneOptions.find((option) => option.id === id);
    if (selectedOption) {
      setSelectedMilestone(id);
      setStudyConfig({
        dailyPacing: selectedOption.dailyPacing || 0,
        masteryIntervalDays: selectedOption.masteryIntervalDays, // Default value; adjust as needed
        newwordNotificationsEnabled: false, // Default value; adjust as needed
        overallGoal: selectedOption.overallGoal,
        daysForGoal: selectedOption.daysForGoal,
      });
    }
  };

  return (
    <View className="flex-1 px-6 pt-8">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-white/60 text-base text-center leading-6">
          Tell us where you want to go so we can help you get there.
        </Text>
      </View>
      {/* Milestone Section */}
      <View className="mb-6">
        <Text className="text-white text-lg font-semibold mb-4">
          Start with a milestone
        </Text>
        <View className="gap-3">
          {milestoneOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={handleSelectingMilestone(option.id)}
              className={`rounded-xl p-3 border ${
                selectedMilestone === option.id
                  ? "bg-[#FF511B] border-[#FF511B]"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  {/* Title + Recommended Badge Row */}
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text
                      className={`text-base font-bold ${
                        selectedMilestone === option.id
                          ? "text-white"
                          : "text-white"
                      }`}
                    >
                      {option.label}
                    </Text>
                    {option.recommended && (
                      <Text
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          selectedMilestone === option.id
                            ? "bg-white/20 text-white"
                            : "bg-[#FF511B]/30 text-[#FF511B]"
                        }`}
                      >
                        Recommended
                      </Text>
                    )}
                  </View>

                  {/* Stats Row */}
                  {option.dailyPacing && option.estReviewsPerDayRange && (
                    <View className="flex-row gap-3">
                      <Text
                        className={`text-xs ${
                          selectedMilestone === option.id
                            ? "text-white/70"
                            : "text-white/50"
                        }`}
                      >
                        {option.dailyPacing} words/day
                      </Text>
                      <Text
                        className={`text-xs ${
                          selectedMilestone === option.id
                            ? "text-white/70"
                            : "text-white/50"
                        }`}
                      >
                        {option.estReviewsPerDayRange} reviews/day
                      </Text>
                      <Text
                        className={`text-xs ${
                          selectedMilestone === option.id
                            ? "text-white/70"
                            : "text-white/50"
                        }`}
                      >
                        {option.timelineLabel}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Radio Button */}
                <View
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                    selectedMilestone === option.id
                      ? "bg-white border-white"
                      : "border-white/30"
                  } items-center justify-center`}
                >
                  {selectedMilestone === option.id && (
                    <View className="w-2.5 h-2.5 rounded-full bg-[#FF511B]" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Refine Plan Section */}
      <View className="mb-1">
        <Text className="text-white text-lg font-semibold mb-4">
          Or refine your plan
        </Text>
        <TouchableOpacity className="rounded-2xl p-5 bg-white/5 border border-white/10">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white text-base font-semibold">
                Take 5-minute vocabulary check
              </Text>
              <Text className="text-white/50 text-sm mt-1">
                You can estimate your level later in the setting
              </Text>
            </View>
            <Text className="text-[#FF511B] text-2xl">→</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <Pressable
            className="flex-1"
            onPress={() => setShowCustomModal(false)}
          />
          <View
            className="bg-[#1A1A1A] rounded-t-3xl p-6"
            style={{ maxHeight: "80%" }}
          >
            <Text className="text-white text-xl font-semibold mb-4">
              Custom Goal
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 400 }}
            >
              {/* Overall Goal */}
              <View className="mb-5">
                <Text className="text-white text-sm font-semibold mb-3">
                  Overall Goal (words)
                </Text>

                {/* Preset Options */}
                <View className="flex-row gap-2">
                  {[1000, 1500, 2000].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => setCustomOverallGoal(preset.toString())}
                      className={`flex-1 rounded-xl p-3 border ${
                        customOverallGoal === preset.toString()
                          ? "bg-[#FF511B] border-[#FF511B]"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <Text
                        className={`text-center text-sm font-semibold ${
                          customOverallGoal === preset.toString()
                            ? "text-white"
                            : "text-white/70"
                        }`}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Daily Pacing Slider */}
              <BrainLoadSlider
                value={parseInt(customDailyPacing) || 3}
                onValueChange={(value) => setCustomDailyPacing(String(value))}
              />

              {/* Calculated Timeline Display */}
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

                  {/* Recommendation hint */}
                  <View className="mt-3 pt-3 border-t border-white/10">
                    <Text className="text-white/50 text-xs">
                      💡 Lexsee recommends 5-10 words/day for optimal learning
                    </Text>
                  </View>
                </View>
              </View>

              {/* Mastery Interval */}
              <View className="mb-5">
                <Text className="text-white text-sm font-semibold mb-3">
                  Mastery Level
                </Text>

                {/* Preset Options */}
                <View className="flex-row gap-2">
                  {[
                    { days: 180, label: "Mastery", recommended: true },
                    { days: 120, label: "Growth" },
                    { days: 60, label: "Sprint" },
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

              {/* Notifications Toggle */}
              <View className="mb-5">
                <View className="flex-row items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10">
                  <View className="flex-1 mr-3">
                    <Text className="text-white text-sm font-semibold">
                      Learning Daily Notification
                    </Text>
                    <Text className="text-white/50 text-xs mt-1">
                      Do you want Lexsee to remind you of studying?
                    </Text>
                  </View>
                  <Switch
                    value={customNotificationsEnabled}
                    onValueChange={setCustomNotificationsEnabled}
                    trackColor={{ false: "#374151", true: "#FF511B" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-4 pb-4">
              <TouchableOpacity
                className="flex-1 bg-white/10 rounded-xl py-3 items-center"
                onPress={() => setShowCustomModal(false)}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-xl py-3 items-center ${
                  isFormValid() ? "bg-[#FF511B]" : "bg-[#FF511B]/30"
                }`}
                disabled={!isFormValid()}
                onPress={() => {
                  setSelectedMilestone("custom");
                  setStudyConfig({
                    dailyPacing: parseInt(customDailyPacing) || 0,
                    masteryIntervalDays: parseInt(customMasteryInterval),
                    newwordNotificationsEnabled: customNotificationsEnabled,
                    overallGoal: parseInt(customOverallGoal),
                    daysForGoal: calculateTimeline(),
                  });
                  setShowCustomModal(false);
                }}
              >
                <Text
                  className={`font-semibold ${
                    isFormValid() ? "text-white" : "text-white/50"
                  }`}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default LongtermGoal;
