import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "../../app/client";
import { getLocalDate } from "../../util/utli";

/**
 * ReviewScheduleWord represents a single word in a review session
 */
export interface ReviewScheduleWord {
  id: string;
  reviewScheduleId: string;
  wordId: string;
  status: "TO_REVIEW" | "REVIEWED";
  score?: number | null;
  answeredAt?: string | null;
  meta?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * ReviewSchedule represents one review session per user per date
 */
export interface ReviewSchedule {
  id: string;
  userProfileId: string;
  scheduleDate: string;
  notificationId?: string | null;
  successRate?: number | null;
  totalWords?: number | null;
  reviewedCount?: number | null;
  toBeReviewedCount?: number | null;
  scheduleInfo?: Record<string, any> | null;
  scheduleWords?: ReviewScheduleWord[];
  reviewQueue?: any[]; // Add this - actual word objects ready for review
  reviewWordsIds?: string[]; // Add this - just the IDs
  createdAt: string;
  updatedAt: string;
}

/**
 * Updated UserProfile interface
 */
export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  wordsListId?: string;
  ifChineseUser?: boolean | null;
  // Add reviewSchedules relationship
  reviewSchedules?: ReviewSchedule[]; // Only store actual data, not functions
}

export interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  reviewInfo: ReviewSchedule | null; // Current day's review schedule
  isLoadingReviewInfo: boolean;
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null,
  reviewInfo: null,
  isLoadingReviewInfo: false,
};

/**
 * Helper to clean a ReviewScheduleWord (remove function relationships)
 */
const cleanReviewScheduleWord = async (
  scheduleWord: any
): Promise<ReviewScheduleWord> => {
  return {
    id: scheduleWord.id,
    reviewScheduleId: scheduleWord.reviewScheduleId,
    wordId: scheduleWord.wordId,
    status: scheduleWord.status || "TO_REVIEW",
    score: scheduleWord.score || null,
    answeredAt: scheduleWord.answeredAt || null,
    meta: scheduleWord.meta || null,
    createdAt: scheduleWord.createdAt,
    updatedAt: scheduleWord.updatedAt,
    // Don't include the reviewSchedule relationship function
  };
};

/**
 * Helper to clean relationship functions from ReviewSchedule
 */
export const cleanReviewSchedule = async (
  schedule: any
): Promise<ReviewSchedule> => {
  let scheduleWords: ReviewScheduleWord[] = [];

  // Handle scheduleWords relationship
  if (schedule.scheduleWords) {
    try {
      if (typeof schedule.scheduleWords === "function") {
        const result = await schedule.scheduleWords();
        const words = result?.data || [];
        // Clean each word to remove nested functions
        scheduleWords = await Promise.all(
          words.map((w: any) => cleanReviewScheduleWord(w))
        );
      } else if (Array.isArray(schedule.scheduleWords)) {
        // Clean each word to remove nested functions
        scheduleWords = await Promise.all(
          schedule.scheduleWords.map((w: any) => cleanReviewScheduleWord(w))
        );
      }
    } catch (error) {
      console.warn("⚠️ Error loading scheduleWords:", error);
      scheduleWords = [];
    }
  }

  return {
    id: schedule.id,
    userProfileId: schedule.userProfileId,
    scheduleDate: schedule.scheduleDate,
    notificationId: schedule.notificationId || null,
    successRate: schedule.successRate || null,
    totalWords: schedule.totalWords || null,
    reviewedCount: schedule.reviewedCount || null,
    toBeReviewedCount: schedule.toBeReviewedCount || null,
    scheduleInfo: schedule.scheduleInfo || null,
    scheduleWords: scheduleWords,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    // Don't include the userProfile relationship function
  };
};

/**
 * Helper to clean relationship functions from UserProfile
 */
export const cleanUserProfile = async (profile: any): Promise<UserProfile> => {
  let reviewSchedules: ReviewSchedule[] = [];

  // Handle reviewSchedules relationship
  if (profile.reviewSchedules) {
    try {
      if (typeof profile.reviewSchedules === "function") {
        const result = await profile.reviewSchedules();
        const schedules = result?.data || [];
        // Clean each schedule
        reviewSchedules = await Promise.all(
          schedules.map((rs: any) => cleanReviewSchedule(rs))
        );
      } else if (Array.isArray(profile.reviewSchedules)) {
        // Clean each schedule
        reviewSchedules = await Promise.all(
          profile.reviewSchedules.map((rs: any) => cleanReviewSchedule(rs))
        );
      }
    } catch (error) {
      console.warn("⚠️ Error loading reviewSchedules:", error);
      reviewSchedules = [];
    }
  }

  // Handle wordsList relationship
  let wordsListId: string | undefined;
  if (profile.wordsList) {
    try {
      if (typeof profile.wordsList === "function") {
        const result = await profile.wordsList();
        wordsListId = result?.data?.id || undefined;
      } else if (typeof profile.wordsList === "object") {
        wordsListId = profile.wordsList.id || undefined;
      }
    } catch (error) {
      console.warn("⚠️ Error loading wordsList:", error);
      wordsListId = undefined;
    }
  }

  return {
    id: profile.id,
    userId: profile.userId,
    username: profile.username,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    owner: profile.owner,
    wordsListId: wordsListId,
    ifChineseUser: profile.ifChineseUser || null,
    reviewSchedules: reviewSchedules,
    // Don't include the owner property or any relationship functions
  };
};

/**
 * Fetch today's review schedule with all related words
 */
export const fetchReviewInfo = createAsyncThunk(
  "profile/fetchReviewInfo",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const profile = state.profile.profile as UserProfile;

      if (!profile?.id) {
        console.log("⚠️ No profile found");
        return null;
      }

       const currentDate = getLocalDate();

      // Query for today's review schedule
      const scheduleResult = await (client as any).models.ReviewSchedule.list({
        filter: {
          and: [
            { userProfileId: { eq: profile.id } },
            { scheduleDate: { lt: currentDate } },
          ],
        },
      });


      if (!scheduleResult.data || scheduleResult.data.length === 0) {
        console.log(`📅 No schedule for today (${currentDate})`);
        return null;
      }

      const schedule = scheduleResult.data[0];
      console.log(`✅ Found schedule for ${currentDate}`);

      // Clean and return the schedule
      const cleanedSchedule = await cleanReviewSchedule(schedule);

      // Get words from state
      const wordsList = state.wordsList.words;

      if (!wordsList || wordsList.length === 0) {
        console.warn("⚠️ No words in state yet");
        return {
          ...cleanedSchedule,
          scheduleWords: cleanedSchedule.scheduleWords || [],
          reviewQueue: [],
          reviewWordsIds: [],
        };
      }

      // Filter valid schedule words and get their actual word data
      const validScheduleWords =
        cleanedSchedule.scheduleWords?.filter((sw: ReviewScheduleWord) => {
          const wordExists = wordsList.some(
            (word: any) => word.id === sw.wordId
          );
          if (!wordExists) {
            console.warn(`⚠️ Word ${sw.wordId} not found in wordsList`);
          }
          return wordExists;
        }) || [];

      console.log(`✅ Valid schedule words: ${validScheduleWords.length}`);

      // Map schedule words to actual word objects
      const reviewQueue = validScheduleWords
        .map((sw: ReviewScheduleWord) => {
          const word = wordsList.find((w: any) => w.id === sw.wordId);
          if (!word) {
            console.warn(`⚠️ Could not find word data for ${sw.wordId}`);
            return null;
          }

          // Parse word data if it's stringified
          const wordData =
            typeof word.data === "string" ? JSON.parse(word.data) : word.data;

          return {
            ...wordData,
            id: word.id,
            status: word.status,
            wordsListId: word.wordsListId,
            scheduleWordId: sw.id, // Store schedule word ID for updates
            scheduleStatus: sw.status,
            scheduleScore: sw.score,
          };
        })
        .filter((word: any) => word !== null);

      console.log(`📚 Review queue prepared: ${reviewQueue.length} words`);
      reviewQueue.forEach((w: any) => {
        console.log(`  - ${w.word} (interval: ${w.review_interval})`);
      });

      return {
        ...cleanedSchedule,
        scheduleWords: validScheduleWords,
        reviewQueue: reviewQueue,
        reviewWordsIds: validScheduleWords.map(
          (sw: ReviewScheduleWord) => sw.wordId
        ),
      };
    } catch (error) {
      console.error("❌ Error fetching review info:", error);
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Update a word's review status in the schedule
 */
export const updateScheduleWordStatus = createAsyncThunk(
  "profile/updateScheduleWordStatus",
  async (
    {
      scheduleWordId,
      status,
      score,
    }: {
      scheduleWordId: string;
      status: "TO_REVIEW" | "REVIEWED";
      score?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const updateData: any = {
        id: scheduleWordId,
        status,
      };

      if (score !== undefined) {
        updateData.score = score;
      }

      updateData.answeredAt = new Date().toISOString();

      const result = await (client as any).models.ReviewScheduleWord.update(
        updateData
      );

      console.log(`✅ Updated schedule word ${scheduleWordId}`);
      return result.data;
    } catch (error) {
      console.error("❌ Error updating schedule word:", error);
      return rejectWithValue((error as Error).message);
    }
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      // Ensure no functions are in the profile
      const cleanedProfile = Object.entries(action.payload).reduce(
        (acc, [key, value]) => {
          if (typeof value === "function") {
            console.warn(`⚠️ Skipping function field in profile: ${key}`);
            return acc;
          }
          // Skip arrays with functions
          if (
            Array.isArray(value) &&
            value.some((item) => typeof item === "function")
          ) {
            console.warn(`⚠️ Skipping function array field in profile: ${key}`);
            return acc;
          }
          return { ...acc, [key]: value };
        },
        {} as UserProfile
      );

      state.profile = cleanedProfile;
      state.isLoading = false;
      state.error = null;
      // console.log("✅ Profile updated:", cleanedProfile);
    },
    setProfileLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setProfileError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.isLoading = false;
      state.error = null;
      state.reviewInfo = null;
      state.isLoadingReviewInfo = false;
    },
  },
  extraReducers: (builder) => {
    // fetchReviewInfo
    builder
      .addCase(fetchReviewInfo.pending, (state) => {
        state.isLoadingReviewInfo = true;
        console.log("🔄 Fetching review info...");
      })
      .addCase(fetchReviewInfo.fulfilled, (state, action) => {
        state.reviewInfo = action.payload;
        state.isLoadingReviewInfo = false;
        console.log(
          `✅ Review info loaded: ${action.payload?.scheduleWords?.length || 0} words`
        );
      })
      .addCase(fetchReviewInfo.rejected, (state, action) => {
        state.isLoadingReviewInfo = false;
        console.error("❌ Failed to fetch review info:", action.payload);
      });

    // updateScheduleWordStatus
    builder
      .addCase(updateScheduleWordStatus.pending, (state) => {
        console.log("🔄 Updating schedule word status...");
      })
      .addCase(updateScheduleWordStatus.fulfilled, (state, action) => {
        // Update the word in reviewInfo if it exists
        if (state.reviewInfo?.scheduleWords) {
          const index = state.reviewInfo.scheduleWords.findIndex(
            (w) => w.id === action.payload.id
          );
          if (index !== -1) {
            state.reviewInfo.scheduleWords[index] = action.payload;

            // Update counts
            const toReviewCount = state.reviewInfo.scheduleWords.filter(
              (w) => w.status === "TO_REVIEW"
            ).length;
            const reviewedCount = state.reviewInfo.scheduleWords.filter(
              (w) => w.status === "REVIEWED"
            ).length;

            state.reviewInfo.toBeReviewedCount = toReviewCount;
            state.reviewInfo.reviewedCount = reviewedCount;

            console.log(
              `✅ Schedule word updated. Remaining: ${toReviewCount}`
            );
          }
        }
      })
      .addCase(updateScheduleWordStatus.rejected, (state, action) => {
        console.error("❌ Failed to update schedule word:", action.payload);
      });
  },
});

export const { setProfile, setProfileLoading, setProfileError, clearProfile } =
  profileSlice.actions;

export default profileSlice.reducer;
