import { CompletedReviewSchedule } from "../store/slices/completedReviewScheduleSlice";
import { ScheduleWord } from "../store/slices/reviewScheduleWordsSlice";
import { Word, WordStatus } from "../types/common/Word";

/**
 * Get local date in YYYY-MM-DD format
 */
export const getLocalDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getNextLocalDate = (date: Date = new Date()): string => {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return getLocalDate(next);
};
/**
 * Transforms raw Amplify Word items into the clean Word type used by the UI.
 */
export const cleanWords = (rawItems: any[]): Word[] => {
  return rawItems.map((item) => {
    // 2. Build the object following your Word type exactly

    console.log("Raw items:", JSON.stringify(rawItems));

    return {
      id: item.id,
      word: item.word || "",
      imgUrl: item.imgUrl,
      status: item.status as WordStatus,

      meanings: JSON.parse(item.meanings),
      phonetics: {
        text: item.phoneticText,
        audioUrl: item.audioUrl,
      },
      exampleSentences: item.exampleSentences,
      translatedMeanings: item.translatedMeanings,

      review_interval: item.reviewInterval ?? 1,
      ease_factor: item.easeFactor ?? 2.5,
      nextReviewDate: item.nextReviewDate,
      reviewedTimeline: item.reviewedTimeline,

      // FIX: Strip the Amplify function.
      // We check if it's an actual array; if it's a function (lazy loader),
      // we store an empty array or the ID string to avoid Redux errors.
      scheduleWords: Array.isArray(item.scheduleWords)
        ? [...item.scheduleWords]
        : [],

      // Default as requested
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });
};

export const cleanSchedules = (rawItems: any[]): CompletedReviewSchedule[] => {
  return rawItems.map((item) => ({
    id: item.id,
    owner: item.owner,
    scheduleDate: item.scheduleDate,
    totalWords: item.totalWords || 0,
    userProfileId: item.userProfileId,
    reviewLogs: item.reviewLogs || "",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
};

export const cleanScheduleWords = (rawItems: any[]): ScheduleWord[] => {
  return rawItems.map((item) => ({
    id: item.id,
    reviewScheduleId: item.reviewScheduleId,
    wordId: item.wordId,
    status: item.status || "TO_REVIEW",
    score: item.score ?? null,
    answeredAt: item.answeredAt || null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    // We ignore 'reviewSchedule' and 'word' functions/relationships
    // because we will "Join" them in selectors instead.
  }));
};

export const checkIfTrialExpired = (
  createdAt: string | number | undefined,
  trialDays: number = 2,
): boolean => {
  // If we can't find a date, we give them the benefit of the doubt for the MVP
  if (!createdAt) {
    console.warn("[RC] Missing createdAt. Allowing access for safety.");
    return false;
  }

  const signupDate = new Date(createdAt).getTime();
  const now = new Date().getTime();

  // Use "Math.max" to ensure we don't get negative numbers
  const msPassed = now - signupDate;
  const daysPassed = msPassed / (1000 * 60 * 60 * 24);

  if (daysPassed > trialDays) {
    console.log(`[RC] Trial Expired: ${daysPassed.toFixed(1)} days passed.`);
    return true;
  }

  console.log(
    `[RC] Trial Active: ${(trialDays - daysPassed).toFixed(1)} days remaining.`,
  );
  return false;
};
