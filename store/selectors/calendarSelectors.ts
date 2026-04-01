// store/selectors/calendarSelectors.ts
import { createSelector } from "@reduxjs/toolkit";
import { Word } from "../../types/common/Word";

export const selectUnifiedCalendarData = createSelector(
  [
    (state: any) => state.wordsList.words,
    (state: any) => state.completedReviewSchedules.items,
  ],
  (words, pastSchedules) => {
    const calendarData: Record<string, any> = {};

    // 1. Process Past (Insights)
    pastSchedules.forEach((schedule: any) => {
      const logs = JSON.parse(schedule.reviewLogs || "[]");
      const isComplete = logs.length >= (schedule.totalWords || 0);

      calendarData[schedule.scheduleDate] = {
        type: "PAST",
        dots: [{ color: isComplete ? "#4CD964" : "#FF9500" }],
        logs: logs,
        totalWords: schedule.totalWords,
        successRate: schedule.successRate,
      };
    });

    // 2. Process Future (Incoming)
    const today = new Date().toISOString().split("T")[0];
    words.forEach((word: Word) => {
      // Ensure the word has a review date and it's in the future
      if (word.nextReviewDate && word.nextReviewDate > today) {
        if (!calendarData[word.nextReviewDate]) {
          calendarData[word.nextReviewDate] = {
            type: "FUTURE",
            dots: [{ color: "#007AFF" }], // Blue for future
            words: [],
          };
        }

        // Push the full word object instead of word.word (string)
        calendarData[word.nextReviewDate].words.push(word);
      }
    });

    return calendarData;
  },
);
