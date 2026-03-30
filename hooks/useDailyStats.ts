import { useMemo } from "react";
import { useAppSelector } from "../store/hooks";
import { selectDailyQueue } from "../store/slices/wordsListSlice";

export type ReviewStatus =
  | "review_begin"
  | "review_in_progress"
  | "viewProgress";

export const useDailyStats = () => {
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Get words remaining in the SRS queue
  const todayQueue = useAppSelector(selectDailyQueue);
  const remaining = todayQueue.length;

  // 2. Get today's completion record
  const schedules = useAppSelector(
    (state) => state.completedReviewSchedules.items,
  );

  const todayRecord = useMemo(() => {
    return schedules.find((s) => s.scheduleDate === todayStr);
  }, [schedules, todayStr]);

  return useMemo(() => {
    // Extract reviewed count from logs
    const completed = todayRecord
      ? JSON.parse(todayRecord.reviewLogs || "[]").length
      : 0;

    // Snapshot logic: If session started, use stored total. If not, use current queue.
    const total = todayRecord?.totalWords || remaining;

    // 3. Status State Machine Logic
    let status: ReviewStatus = "review_begin";

    if (total > 0 && remaining === 0) {
      // Everything scheduled for today is done
      status = "viewProgress";
    } else if (completed > 0 && remaining > 0) {
      // User has started but hasn't finished the queue
      status = "review_in_progress";
    } else if (completed === 0 && remaining > 0) {
      // User has words due but hasn't swiped yet today
      status = "review_begin";
    } else if (total === 0 && remaining === 0) {
      // Edge case: User has 0 words due for the entire day
      status = "viewProgress";
    }

    return {
      completed,
      remaining,
      total,
      progress: total > 0 ? completed / total : 0,
      status, // "review_begin" | "review_in_progress" | "viewProgress"
    };
  }, [todayRecord, remaining]);
};
