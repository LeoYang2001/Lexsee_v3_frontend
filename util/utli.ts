import { ReviewSchedule } from "../store/slices/reviewScheduleSlice";
import { ScheduleWord } from "../store/slices/reviewScheduleWordsSlice";
import { Word, WordStatus } from "../types/common/Word";

  /**
   * Get local date in YYYY-MM-DD format
   */
  export const getLocalDate = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

/**
 * Transforms raw Amplify Word items into the clean Word type used by the UI.
 */
export const cleanWords = (rawItems: any[]): Word[] => {
  return rawItems.map((item) => {
    // 1. Parse the stringified JSON payload
    let parsedData: any = {};
    try {
      parsedData = typeof item.data === "string" ? JSON.parse(item.data) : (item.data || {});
    } catch (e) {
      console.error(`Error parsing data for word ID: ${item.id}`, e);
    }

    // 2. Build the object following your Word type exactly
    return {
      id: item.id,
      word: item.word || parsedData.word || "",
      imgUrl: parsedData.imgUrl || item.imgUrl,
      status: (item.status || parsedData.status || "COLLECTED") as WordStatus,
      
      meanings: parsedData.meanings || item.meanings || [],
      
      phonetics: (parsedData.phonetics || item.phonetics) ? {
        text: parsedData.phonetics?.text || item.phonetics?.text || "",
        audioUrl: parsedData.phonetics?.audioUrl || item.phonetics?.audioUrl,
      } : undefined,

      exampleSentences: parsedData.exampleSentences || item.exampleSentences,
      timeStamp: parsedData.timeStamp || item.timeStamp,
      
      review_interval: parsedData.review_interval ?? item.review_interval ?? 1,
      ease_factor: parsedData.ease_factor ?? item.ease_factor ?? 2.5,
      
      // FIX: Strip the Amplify function. 
      // We check if it's an actual array; if it's a function (lazy loader), 
      // we store an empty array or the ID string to avoid Redux errors.
      scheduleWords: Array.isArray(item.scheduleWords) ? [...item.scheduleWords] : [],
      
      // Default as requested
      ifPastDue: false,
      createdAt: item.createdAt, 
      updatedAt: item.updatedAt, 

    };
  });
};

export const cleanSchedules = (rawItems: any[]): ReviewSchedule[] => {
  return rawItems.map((item) => ({
    id: item.id,
    notificationId: item.notificationId,
    owner: item.owner,
    scheduleDate: item.scheduleDate,
    toBeReviewedCount: item.toBeReviewedCount || 0,
    totalWords: item.totalWords || 0,
    reviewedCount: item.reviewedCount || 0,
    successRate: item.successRate,
    userProfileId: item.userProfileId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    // We explicitly DO NOT include scheduleWords or userProfile 
    // to avoid non-serializable function errors.
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
  trialDays: number = 2
): boolean => {
  // If we can't find a date, we give them the benefit of the doubt for the MVP
  if (!createdAt) {
    console.warn('[RC] Missing createdAt. Allowing access for safety.');
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

  console.log(`[RC] Trial Active: ${(trialDays - daysPassed).toFixed(1)} days remaining.`);
  return false;
};