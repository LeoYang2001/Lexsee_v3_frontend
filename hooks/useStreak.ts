import { useMemo } from "react";
import { useAppSelector } from "../store/hooks";

export const useStreak = () => {
  const schedules = useAppSelector(
    (state) => state.completedReviewSchedules.items,
  );

  return useMemo(() => {
    // 1. If the user has never reviewed anything, return -1
    if (!schedules || schedules.length === 0) return -1;

    // 2. Sort by date descending (newest first)
    const sorted = [...schedules].sort((a, b) =>
      b.scheduleDate.localeCompare(a.scheduleDate),
    );

    const todayStr = new Date().toISOString().split("T")[0];

    // Helper: Get previous day string
    const getPrevDay = (dateStr: string) => {
      const d = new Date(dateStr);
      d.setUTCDate(d.getUTCDate() - 1);
      return d.toISOString().split("T")[0];
    };

    let streak = 0;
    let expectedDate = todayStr;

    // 3. Streak Calculation Logic
    for (const record of sorted) {
      // Safely parse the logs to get the count
      const logs = JSON.parse(record.reviewLogs || "[]");
      const reviewedCount = Array.isArray(logs) ? logs.length : 0;

      // A day is complete if they reviewed everything scheduled (and scheduled > 0)
      const isComplete =
        reviewedCount >= (record.totalWords || 0) &&
        (record.totalWords || 0) > 0;

      // Case A: Today
      if (record.scheduleDate === todayStr) {
        if (isComplete) {
          streak++;
          expectedDate = getPrevDay(expectedDate);
        } else {
          // Today isn't finished. We don't count it yet, but we don't break the streak.
          // We move expectedDate to yesterday to keep the chain alive.
          expectedDate = getPrevDay(todayStr);
        }
        continue;
      }

      // Case B: Yesterday and beyond
      if (record.scheduleDate === expectedDate) {
        if (isComplete) {
          streak++;
          expectedDate = getPrevDay(expectedDate);
        } else {
          // They had an entry but it wasn't finished. Chain breaks.
          break;
        }
      } else {
        // Gap in dates (e.g., they missed a whole day). Chain breaks.
        break;
      }
    }

    return streak;
  }, [schedules]);
};

export default useStreak;
