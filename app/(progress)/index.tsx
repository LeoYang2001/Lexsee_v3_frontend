import { View, Text, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../store/hooks";
import { client } from "../client";

interface AllTimeSchedule {
  id: string;
  scheduleDate: string;
  totalWords: number;
  toBeReviewedCount: number;
  reviewedCount: number;
  successRate: number;
}

const ProgressPage = () => {
  const words = useAppSelector((state) => state.wordsList.words);
  const userProfile = useAppSelector((state) => state.profile.profile);
  const todaySchedule = useAppSelector(
    (state) => state.reviewSchedule.todaySchedule
  );

  const [allSchedules, setAllSchedules] = useState<AllTimeSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate word statistics
  const totalWords = words.length;
  const collectedWords = words.filter(
    (word) => word.status === "COLLECTED"
  ).length;
  const learnedWords = words.filter((word) => word.status === "LEARNED").length;

  // Fetch all schedules
  useEffect(() => {
    const fetchAllSchedules = async () => {
      try {
        if (!userProfile?.id) {
          console.warn("⚠️ No user profile for fetching schedules");
          return;
        }

        console.log("🔄 Fetching all-time schedules...");

        const result = await (client.models as any).ReviewSchedule.list({
          filter: {
            userProfileId: { eq: userProfile.id },
          },
        });

        if (result.data && result.data.length > 0) {
          // Clean and sort schedules by date (newest first)
          const cleanedSchedules = result.data
            .map((schedule: any) => ({
              id: schedule.id,
              scheduleDate: schedule.scheduleDate,
              totalWords: schedule.totalWords || 0,
              toBeReviewedCount: schedule.toBeReviewedCount || 0,
              reviewedCount: schedule.reviewedCount || 0,
              successRate: schedule.successRate || 0,
            }))
            .sort(
              (a: AllTimeSchedule, b: AllTimeSchedule) =>
                new Date(b.scheduleDate).getTime() -
                new Date(a.scheduleDate).getTime()
            );

          console.log(`✅ Fetched ${cleanedSchedules.length} schedules`);
          setAllSchedules(cleanedSchedules);
        } else {
          console.log("📅 No schedules found");
          setAllSchedules([]);
        }
      } catch (error) {
        console.error("❌ Error fetching schedules:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllSchedules();
  }, [userProfile?.id]);

  useEffect(() => {
    console.log("📊 Progress Page Mounted");
    console.log(`📚 Total Words: ${totalWords}`);
    console.log(`📝 Collected: ${collectedWords}`);
    console.log(`✅ Learned: ${learnedWords}`);
    console.log(`📅 Today's Schedule:`, todaySchedule);
    console.log(`📈 All-time Schedules:`, allSchedules);
  }, [totalWords, collectedWords, learnedWords, todaySchedule, allSchedules]);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-6">Progress Overview</Text>

        {/* Word Statistics */}
        <View className="bg-gray-100 p-4 rounded-lg mb-6">
          <Text className="text-lg font-semibold mb-4">Word Statistics</Text>

          <View className="mb-3">
            <Text className="text-base">Total Words:</Text>
            <Text className="text-xl font-bold">{totalWords}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-base">Collected Words:</Text>
            <Text className="text-xl font-bold text-blue-500">
              {collectedWords}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-base">Learned/Mastered Words:</Text>
            <Text className="text-xl font-bold text-green-500">
              {learnedWords}
            </Text>
          </View>
        </View>

        {/* Today's Schedule Raw Data */}
        <View className="bg-gray-100 p-4 rounded-lg mb-6">
          <Text className="text-lg font-semibold mb-4">Today's Schedule</Text>

          {todaySchedule ? (
            <View>
              <Text className="text-sm font-mono bg-gray-200 p-2 rounded mb-2">
                {JSON.stringify(todaySchedule, null, 2)}
              </Text>

              <View className="mt-4 space-y-2">
                <View>
                  <Text className="text-base">Schedule Date:</Text>
                  <Text className="text-lg font-bold">
                    {todaySchedule.scheduleDate}
                  </Text>
                </View>

                <View>
                  <Text className="text-base">Total Words in Schedule:</Text>
                  <Text className="text-lg font-bold">
                    {todaySchedule.totalWords || 0}
                  </Text>
                </View>

                <View>
                  <Text className="text-base">To Be Reviewed:</Text>
                  <Text className="text-lg font-bold text-orange-500">
                    {todaySchedule.toBeReviewedCount || 0}
                  </Text>
                </View>

                <View>
                  <Text className="text-base">Already Reviewed:</Text>
                  <Text className="text-lg font-bold text-green-500">
                    {todaySchedule.reviewedCount || 0}
                  </Text>
                </View>

                <View>
                  <Text className="text-base">Success Rate:</Text>
                  <Text className="text-lg font-bold">
                    {(todaySchedule.successRate || 0).toFixed(2)}%
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Text className="text-base text-gray-500">
              No schedule for today
            </Text>
          )}
        </View>

        {/* All-Time Schedules */}
        <View className="bg-gray-100 p-4 rounded-lg mb-6">
          <Text className="text-lg font-semibold mb-4">
            All-Time Schedules ({allSchedules.length})
          </Text>

          {isLoading ? (
            <Text className="text-base text-gray-500">
              Loading schedules...
            </Text>
          ) : allSchedules.length > 0 ? (
            <View>
              {allSchedules.map((schedule: AllTimeSchedule, index: number) => (
                <View
                  key={schedule.id}
                  className="bg-white p-3 rounded border border-gray-300 mb-3"
                >
                  <Text className="font-semibold text-base mb-2">
                    {schedule.scheduleDate}
                  </Text>

                  <View className="flex flex-row justify-between mb-1">
                    <Text className="text-sm">Total Words:</Text>
                    <Text className="text-sm font-bold">
                      {schedule.totalWords}
                    </Text>
                  </View>

                  <View className="flex flex-row justify-between mb-1">
                    <Text className="text-sm">To Review:</Text>
                    <Text className="text-sm font-bold text-orange-500">
                      {schedule.toBeReviewedCount}
                    </Text>
                  </View>

                  <View className="flex flex-row justify-between mb-1">
                    <Text className="text-sm">Reviewed:</Text>
                    <Text className="text-sm font-bold text-green-500">
                      {schedule.reviewedCount}
                    </Text>
                  </View>

                  <View className="flex flex-row justify-between">
                    <Text className="text-sm">Success Rate:</Text>
                    <Text className="text-sm font-bold">
                      {schedule.successRate.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-base text-gray-500">No schedules found</Text>
          )}
        </View>

        {/* Summary */}
        <View className="bg-blue-50 p-4 rounded-lg mb-6">
          <Text className="text-lg font-semibold mb-4">Summary</Text>

          <View className="space-y-2">
            <Text>
              Progress:{" "}
              <Text className="font-bold">
                {learnedWords}/{totalWords} words mastered
              </Text>
            </Text>
            <Text>
              Completion Rate:{" "}
              <Text className="font-bold">
                {totalWords > 0
                  ? ((learnedWords / totalWords) * 100).toFixed(2)
                  : 0}
                %
              </Text>
            </Text>
            <Text>
              Total Review Sessions:{" "}
              <Text className="font-bold">{allSchedules.length}</Text>
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProgressPage;
