import { useMemo } from "react";
import { CompletedReviewSchedule } from "../store/slices/completedReviewScheduleSlice";
import { useAppSelector } from "../store/hooks";
import { useSelector } from "react-redux";
import { RootState } from "../store";

interface InsightsMetrics {
  completionRate: number;
  retentionRate: number;
  score: number;
}

/**
 * Calculate learning score from completion and accuracy using
 * a weighted geometric mean.
 *
 * WHY geometric mean?
 * - Both completion AND accuracy must be good to get a high score
 * - One high value cannot fully compensate for the other being low
 * - This matches real learning: guessing through everything ≠ mastery
 *
 * completion, accuracy: numbers in range [0, 100]
 * wAcc: weight of accuracy importance (0.6–0.8 recommended)
 */
export function score_geo(completion: number, accuracy: number, wAcc = 0.7) {
  const c = Math.max(0, Math.min(1, completion / 100));
  const a = Math.max(0, Math.min(1, accuracy / 100));
  const wComp = 1 - wAcc;

  const s = Math.pow(a, wAcc) * Math.pow(c, wComp);
  return Math.round(100 * s);
}

export const useCompletedInsights = (
  targetRecord: CompletedReviewSchedule | undefined,
): InsightsMetrics | null => {
  return useMemo(() => {
    if (!targetRecord) return null;

    try {
      // Parse review logs
      const logs = JSON.parse(targetRecord.reviewLogs);
      const reviewedWords = logs.length;
      const totalWords = targetRecord.totalWords;

      // Calculate completion rate
      const completionRate = Math.round((reviewedWords / totalWords) * 100);

      // Calculate success rate (sum of all scores)
      // Scores are typically 1-5, so max success would be reviewedWords * 5
      const totalScore = logs.reduce(
        (acc: number, log: { score: number }) => acc + (log.score || 0),
        0,
      );

      // Calculate accuracy as percentage (score / max possible per word = score / 5)
      const retentionRate =
        reviewedWords > 0
          ? Math.round((totalScore / (5 * reviewedWords)) * 100)
          : 0;

      // Calculate combined score using weighted geometric mean
      const score = score_geo(completionRate, retentionRate);

      return {
        completionRate,
        retentionRate,
        score,
      };
    } catch (error) {
      console.error("Error parsing review logs:", error);
      return null;
    }
  }, [targetRecord]);
};

export const useReviewedWords = (
  targetRecord: CompletedReviewSchedule | undefined,
): any[] => {
  const { words: allWords } = useAppSelector((state) => state.wordsList);

  const profile = useSelector((state: RootState) => state.profile.data);

  const masteryIntervalDays = profile?.masteryIntervalDays || 180;

  return useMemo(() => {
    if (!targetRecord?.reviewLogs || !targetRecord.scheduleDate) return [];

    try {
      const logs =
        typeof targetRecord.reviewLogs === "string"
          ? JSON.parse(targetRecord.reviewLogs)
          : targetRecord.reviewLogs;

      if (!Array.isArray(logs)) return [];

      const targetDate = targetRecord.scheduleDate;

      return logs.map((log: { wordId: string; word: string }) => {
        const fullWord = allWords.find((w) => w.id === log.wordId);

        let fullTimeline = [];
        if (fullWord?.reviewedTimeline) {
          fullTimeline =
            typeof fullWord.reviewedTimeline === "string"
              ? JSON.parse(fullWord.reviewedTimeline)
              : fullWord.reviewedTimeline;
        }

        // 1. Filter timeline to include only historical data
        const historicalTimeline = fullTimeline.filter((entry: any) => {
          return entry.date <= targetDate;
        });

        // 2. Determine the interval reached AT THAT TIME
        // We sort by date to ensure we grab the very last entry relative to the targetDate
        const lastHistoricalEntry = [...historicalTimeline].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )[0];

        const currentInterval = lastHistoricalEntry?.interval || 0;

        // 3. Calculate Mastery: (Interval / masteryIntervalDays) * 100
        const masteryPercentage = Math.min(
          Math.round((currentInterval / masteryIntervalDays) * 100),
          100,
        );

        // Sort historical timeline from latest to oldest
        const sortedHistoricalTimeline = [...historicalTimeline].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        return {
          id: log.wordId,
          content: log.word || fullWord?.word || "Unknown",
          timeline: sortedHistoricalTimeline,
          masteryPercentage: masteryPercentage, // Now based on masteryIntervalDays-day goal
        };
      });
    } catch (error) {
      console.error("Failed to parse review logs or map words:", error);
      return [];
    }
  }, [targetRecord, allWords]);
};
