import { View, Text, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { ArcGauge } from "./ArcGauge";
import { AllTimeSchedule } from "../../types/common/AllTimeSchedule";

interface ProgressReviewProps {
  selectedIso?: string | null;
  allSchedules: AllTimeSchedule[];
}

export interface ProgressReviewData {
  reviewedWords: number;
  totalWords: number;
  completionRate: number;
  accuracy: number;
}

const ProgressReview: React.FC<ProgressReviewProps> = ({
  allSchedules,
  selectedIso,
}) => {
  const [todaySchedule, setTodaySchedule] = useState<
    AllTimeSchedule | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleWords, setScheduleWords] = useState<any[] | null>(null);
  const [progressData, setProgressData] = useState<ProgressReviewData | null>(
    null
  );

  useEffect(() => {
    // Find schedule for selectedIso
    const schedule = allSchedules.find(
      (sched) => sched.scheduleDate === selectedIso
    );
    setTodaySchedule(schedule);
  }, [allSchedules, selectedIso]);

  // resolve scheduleWords (may be array, promise, or function returning promise)
  useEffect(() => {
    let mounted = true;
    async function resolveWords() {
      setIsLoading(true);
      setScheduleWords(null);
      if (!todaySchedule) {
        setIsLoading(false);
        setProgressData(null);
        return;
      }

      try {
        const raw = (todaySchedule as any).scheduleWords;

        // handle function, promise or direct array
        let words: any = null;
        if (typeof raw === "function") {
          const res = raw();
          words = res instanceof Promise ? await res : res;
        } else if (raw instanceof Promise) {
          words = await raw;
        } else {
          words = raw || null;
        }

        if (!mounted) return;
        const wordArray = Array.isArray((words as any)?.data)
          ? (words as any).data
          : Array.isArray(words)
            ? (words as any)
            : [];
        setScheduleWords(wordArray);
        console.log("resolved scheduleWords", wordArray);

        // calculate score & accuracy
        const totalWords = wordArray.length;
        const totalPossible = totalWords * 5; // 5 points per word
        const scoreSum = wordArray.reduce((acc: any, w: any) => {
          const s = typeof w.score === "number" ? w.score : 0;
          return acc + s;
        }, 0);
        const accuracy =
          totalPossible > 0 ? Math.round((scoreSum / totalPossible) * 100) : 0;
        const reviewedWords = wordArray.filter(
          (w: any) => w.status === "REVIEWED"
        ).length;

        const completionRate =
          totalWords > 0 ? Math.round((reviewedWords / totalWords) * 100) : 0;
        const next: ProgressReviewData = {
          reviewedWords,
          totalWords,
          completionRate,
          accuracy,
        };
        setProgressData(next);
        console.log("progress data", next);
      } catch (err) {
        if (!mounted) return;
        console.warn("failed to resolve scheduleWords", err);
        setScheduleWords(null);
        setProgressData(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    resolveWords();
    return () => {
      mounted = false;
    };
  }, [todaySchedule]);

  return (
    <View className="w-full h-full">
      {/* loading state */}
      {isLoading ? (
        <View className="py-4 items-center justify-center h-full">
          <ActivityIndicator size="small" color="#CF4A1E" />
        </View>
      ) : !progressData ? (
        // no scheduled words for this day
        <View className="py-6 items-center  h-full justify-center">
          <Text style={{ color: "#9CA3AF", fontSize: 15 }}>
            No words scheduled for this day
          </Text>
          {selectedIso && (
            <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 6 }}>
              {selectedIso}
            </Text>
          )}
        </View>
      ) : (
        // show gauge + stats
        <View className="flex    h-full  items-center   flex-row ">
          <View className="flex-1 h-full  flex justify-center items-center p-3">
            <ArcGauge
              value1={progressData.completionRate}
              value2={progressData.accuracy}
            />
          </View>
          <View className=" w-[50%] h-full pl-12  flex flex-col justify-center gap-6 items-start  p-3">
            <View>
              <View className=" flex flex-row justify-start items-baseline gap-1">
                <Text
                  className="font-semibold"
                  style={{ fontSize: 24, color: "white", lineHeight: 36 }}
                >
                  {progressData.reviewedWords}
                </Text>
                <Text
                  className="text-white opacity-40"
                  style={{
                    fontSize: 12,
                    color: "white",
                    marginBottom: 2,
                  }}
                >
                  /{progressData.totalWords}
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: "white", opacity: 0.4 }}>
                Completion
              </Text>
            </View>
            <View>
              <View className=" flex flex-row justify-start items-baseline gap-1">
                <Text
                  className="font-semibold"
                  style={{ fontSize: 24, color: "white", lineHeight: 36 }}
                >
                  {progressData.accuracy}
                </Text>
                <Text
                  className="text-white opacity-40"
                  style={{
                    fontSize: 12,
                    color: "white",
                    marginBottom: 2,
                  }}
                >
                  %
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: "white", opacity: 0.4 }}>
                Accuracy
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ProgressReview;
