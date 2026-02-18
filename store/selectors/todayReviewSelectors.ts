import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index"; // Adjust path to your store index
import { getLocalDate } from "../../util/utli";

export type ReviewStatus =
  | "review_begin"
  | "review_in_progress"
  | "viewProgress";

// 1. Basic Input Selectors
const selectSchedules = (state: RootState) => state.reviewSchedule.items;
const selectScheduleWords = (state: RootState) =>
  state.reviewScheduleWords.items;
const selectAllWords = (state: RootState) => state.wordsList.words;

// 2. The Smart Selector
export const getReviewWordsForToday = createSelector(
  [selectSchedules, selectScheduleWords, selectAllWords],
  (schedules, scheduleWords, words) => {
    const todayStr = getLocalDate();
    console.log(`[Selector] 🕒 Current Date Reference: ${todayStr}`);

    const pastSchedules = schedules.filter((s) => s.scheduleDate < todayStr);
    const todaySchedule = schedules.find((s) => s.scheduleDate === todayStr);

    console.log(
      `[Selector] 📅 Schedules Found -> Past: ${pastSchedules.length}, Today: ${todaySchedule ? "Yes" : "No"}`,
    );

    const emptyState = {
      todayScheduleId: null,
      pastScheduleIds: [],
      words: [],
      stats: { pastCount: 0, todayCount: 0, total: 0, completed: 0 },
      status: "viewProgress" as const,
    };

    if (pastSchedules.length === 0 && !todaySchedule) {
      console.log(
        "[Selector] 🛑 No active schedules found. Returning empty state.",
      );
      return emptyState;
    }

    const pastScheduleIds = pastSchedules.map((s) => s.id);
    const activeScheduleIds = [
      ...pastScheduleIds,
      ...(todaySchedule ? [todaySchedule.id] : []),
    ];

    console.log(
      `[Selector] 🔑 Active Schedule IDs: ${JSON.stringify(activeScheduleIds)}`,
    );

    // 1. Join Words
    const allActiveWords = scheduleWords.filter((sw) =>
      activeScheduleIds.includes(sw.reviewScheduleId),
    );

    const reviewedActiveWords = allActiveWords.filter(
      (sw) => sw.status === "REVIEWED",
    );
    const toBeReviewedActiveWords = allActiveWords.filter(
      (sw) => sw.status === "TO_REVIEW",
    );

    // 1. Join Words

    const toBeReviewedActiveWords_withDetails = toBeReviewedActiveWords.map(
      (sw) => {
        const detail = words.find((w) => w.id === sw.wordId);

        if (!detail) {
          console.warn(
            `[Selector] ⚠️ Missing word detail for ID: ${sw.wordId}`,
          );
        }

        return {
          ...sw, // Includes sw.id, sw.status, sw.reviewScheduleId
          ...detail, // Includes word, meanings, phonetics, etc.
          scheduleWordId: sw.id, // Explicitly naming it for clarity in your handlers
          ifPastDue: sw.reviewScheduleId !== todaySchedule?.id,
        };
      },
    );

    console.log(
      `[Selector] 📝 toBeReviewedActiveWords_withDetails: ${JSON.stringify(toBeReviewedActiveWords_withDetails)}`,
    );
    // 2. Calculate Counts
    const totalCount = allActiveWords.length;
    const completedCount = reviewedActiveWords.length;

    const pastCount = toBeReviewedActiveWords_withDetails.filter(
      (w) => w.ifPastDue,
    ).length;
    const todayCount = toBeReviewedActiveWords_withDetails.length - pastCount;

    console.log("COUNT DATA:", {
      totalCount,
      completedCount,
      pastCount,
      todayCount,
    });

    // 3. Determine ReviewStatus
    let finalStatus: "review_begin" | "review_in_progress" | "viewProgress" =
      "viewProgress";

    if (totalCount === 0) {
      finalStatus = "viewProgress";
    } else {
      if (completedCount === 0) {
        finalStatus = "review_begin";
      } else if (completedCount < totalCount) {
        finalStatus = "review_in_progress";
      } else {
        finalStatus = "viewProgress";
      }
    }

    return {
      todayScheduleId: todaySchedule?.id || null,
      pastScheduleIds,
      words: toBeReviewedActiveWords_withDetails,
      stats: {
        pastCount,
        todayCount,
        total: totalCount,
        completed: completedCount,
      },
      status: finalStatus,
    };
  },
);
