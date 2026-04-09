import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Word } from "../../types/common/Word";
import { RootState } from "..";

interface WordsListState {
  words: Word[];
  isSynced: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: WordsListState = {
  words: [],
  isSynced: false,
  isLoading: true, // Start true so UI shows loading until first emit
  error: null,
};

const wordsListSlice = createSlice({
  name: "wordsList",
  initialState,
  reducers: {
    // This is your "Main Gate" for data
    setWords: (state, action: PayloadAction<Word[]>) => {
      state.words = action.payload; // No cleaning here! Just saving.
      state.isLoading = false;
      state.error = null;
    },
    // This tracks the Amplify background sync status
    setSynced: (state, action: PayloadAction<boolean>) => {
      state.isSynced = action.payload;
    },
    // Clear everything on logout
    clearWords: () => initialState,
  },
});

const selectAllWords = (state: RootState) => state.wordsList.words;

export const selectDailyQueue = createSelector([selectAllWords], (words) => {
  const localToday = new Date().toLocaleDateString("en-CA");
  console.log("📅 [selectDailyQueue] Today's date:", localToday);

  const initialState = {
    allDueWords: [] as Word[],
    pastDueWords: [] as Word[],
    dueTodayWords: [] as Word[],
    shouldResetStreak: false,
  };

  const result = words.reduce((acc, word) => {
    if (!word || !word.nextReviewDate) return acc; // Skip if no review date

    const isDue = word.nextReviewDate && word.nextReviewDate <= localToday;
    const isActive = word.status === "COLLECTED" || word.status === "LEARNED";

    if (isDue && isActive) {
      // 1. Check if it's strictly older than today
      const isPastDue = word.nextReviewDate < localToday;

      console.log(`📝 [selectDailyQueue] Word: "${word.word}"`, {
        nextReviewDate: word.nextReviewDate,
        isDue,
        isPastDue,
        status: word.status,
      });

      // 2. Build the lists
      acc.allDueWords.push(word);

      if (isPastDue) {
        console.log(
          `⚠️ [selectDailyQueue] PAST DUE WORD: "${word.word}" (${word.nextReviewDate} < ${localToday})`,
        );
        acc.pastDueWords.push(word);
        acc.shouldResetStreak = true; // Trigger for your streak logic
      } else {
        acc.dueTodayWords.push(word);
      }
    }

    return acc;
  }, initialState);

  return result;
});
/**
 * Selects only the words that were created today.
 * This effectively tracks "New Discoveries" rather than just reviews.
 */
export const selectWordsLearnedToday = createSelector(
  [(state) => state.wordsList.words],
  (words) => {
    // en-CA gives us the ISO format YYYY-MM-DD
    const localToday = new Date().toLocaleDateString("en-CA");

    const newWordsToday = words.filter((word: Word) => {
      if (!word.createdAt) return false;

      // createdAt is typically an ISO string from Amplify (e.g., 2026-04-04T12:00:00Z)
      // Convert to local date so timezone offsets don't shift "today" checks.
      const createdDate = new Date(word.createdAt).toLocaleDateString("en-CA");

      return createdDate === localToday;
    });

    return {
      count: newWordsToday.length,
      words: newWordsToday,
    };
  },
);

/**
 * Selects words created in the last 7 days using local time conversion.
 * Returns an array of 7 daily buckets { date, count, words }.
 */
export const selectWeeklyProgress = createSelector(
  [(state) => state.wordsList.words],
  (words) => {
    const dailyBuckets = [];

    // 1. Generate the last 7 local dates (ending with Today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const localDateStr = d.toLocaleDateString("en-CA");

      const wordsForThisDay = words.filter((word: Word) => {
        if (!word.createdAt) return false;
        return (
          new Date(word.createdAt).toLocaleDateString("en-CA") === localDateStr
        );
      });

      dailyBuckets.push({
        date: localDateStr,
        // Add this line: 'narrow' gives us "M", "T", "W"
        dayName: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        count: wordsForThisDay.length,
        words: wordsForThisDay,
      });
    }

    return {
      totalThisWeek: dailyBuckets.reduce((sum, day) => sum + day.count, 0),
      dailyBuckets,
    };
  },
);

/**
 * Monthly Health Report Selector
 * Measures: Retention, Goal-Based Consistency, and Pacing.
 */
export const selectMonthlyReport = createSelector(
  [(state) => state.wordsList.words, (state) => state.profile.data.dailyPacing],
  (words, dailyPacing) => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const target = dailyPacing || 3;

    // --- 1. ELIGIBILITY CHECK ---
    // We check the oldest word to see if the user has been active for 30 days
    const sortedByDate = [...words].sort(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime(),
    );

    const firstWordDate =
      sortedByDate.length > 0 ? new Date(sortedByDate[0].createdAt!) : null;
    const isEligible = firstWordDate ? firstWordDate <= thirtyDaysAgo : false;
    const daysUntilReport = firstWordDate
      ? Math.max(
          0,
          30 -
            Math.floor(
              (now.getTime() - firstWordDate.getTime()) / (1000 * 60 * 60 * 24),
            ),
        )
      : 30;

    console.log("--- 📊 Monthly Report Calculation Start ---");
    console.log(
      `Window: [${thirtyDaysAgo.toLocaleDateString()}] to [${now.toLocaleDateString()}]`,
    );
    console.log(
      `Eligibility: ${isEligible ? "YES" : "NO"} (Days left: ${daysUntilReport})`,
    );

    // --- 2. STATS ACCUMULATION ---
    const activityMap: Record<string, number> = {};
    let totalReviews = 0;
    let successfulReviews = 0;

    words.forEach((word: Word) => {
      const timeline =
        typeof word.reviewedTimeline === "string"
          ? JSON.parse(word.reviewedTimeline)
          : word.reviewedTimeline;

      if (!Array.isArray(timeline)) return;

      timeline.forEach((entry: any) => {
        const entryDate = new Date(entry.date);

        if (entryDate >= thirtyDaysAgo && entryDate <= now) {
          totalReviews++;

          // Success = Good or Excellent recall
          if (["good", "excellent"].includes(entry.familiarityLevel)) {
            successfulReviews++;
          }

          // Track activity per day for Consistency
          const dateKey = entry.date; // Expects YYYY-MM-DD
          activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
        }
      });
    });

    // --- 3. CALCULATIONS ---

    // Retention: How well did you remember?
    const retentionRate =
      totalReviews > 0
        ? Math.round((successfulReviews / totalReviews) * 100)
        : 0;

    // Consistency: Did you meet your daily goal?
    const daysMeetingGoal = Object.keys(activityMap).filter(
      (date) => activityMap[date] >= target,
    ).length;
    const consistencyRate = Math.round((daysMeetingGoal / 30) * 100);

    // Pacing: New words created vs. Monthly Target
    const monthlyTarget = target * 30;
    const newWordsThisMonth = words.filter((w: Word) => {
      if (!w.createdAt) return false;
      const cDate = new Date(w.createdAt);
      return cDate >= thirtyDaysAgo && cDate <= now;
    }).length;

    const pacePercentage = Math.min(
      Math.round((newWordsThisMonth / monthlyTarget) * 100),
      100,
    );

    const report = {
      isEligible,
      daysUntilReport,
      retentionRate,
      consistencyRate,
      pacePercentage,
      totalReviews,
      daysMeetingGoal,
      isOverloaded: retentionRate < 75 && pacePercentage > 90,
    };

    console.log("Final Report:", report);
    console.log("--- 📊 Monthly Report Calculation End ---");

    return report;
  },
);

export const { setWords, setSynced, clearWords } = wordsListSlice.actions;
export default wordsListSlice.reducer;
