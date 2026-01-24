import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "../../app/client";
import { getLocalDate } from "../../util/utli";

export interface ReviewScheduleWord {
  id: string;
  reviewScheduleId: string;
  wordId: string;
  status: "TO_REVIEW" | "REVIEWED";
  score?: number | null;
  answeredAt?: string | null;
  meta?: any;
  completedReviewScheduleId?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: string;
  ifPastDue?: boolean;
}

interface TodayReviewListState {
  words: ReviewScheduleWord[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TodayReviewListState = {
  words: [],
  isLoading: false,
  error: null,
};

/**
 * 2.3 Fetch today's schedule including past due schedules
 * Called after fetchAllSchedules
 */
export const fetchTodaySchedule = createAsyncThunk(
  "todayReviewList/fetchTodaySchedule",
  async (userProfileId: string, { rejectWithValue }) => {
    try {
      if (!userProfileId) {
        console.warn("⚠️ No user profile for fetching today's schedule");
        return [];
      }
      console.log("  ├─ 📅 Fetching today's schedule...");

      const currentDate = getLocalDate();

      let todayAndPastDueWords = [];

      const pastDueSchedules = await (client.models as any).ReviewSchedule.list({
        filter: {
          and: [
            { userProfileId: { eq: userProfileId } },
            { scheduleDate: { lt: currentDate } },
          ],
        },
      });

      const pastDueScheduleIds = pastDueSchedules.data ? pastDueSchedules.data.map((schedule: any) => schedule.id) : [];
     
      let pastDueWordEntities = { data: [] };
      if (pastDueScheduleIds.length > 0) {
        const orConditions = pastDueScheduleIds.map((id: string) => ({
          reviewScheduleId: { eq: id }
        }));
       
        pastDueWordEntities = await (client.models as any).ReviewScheduleWord.list({
          filter: {
            or: orConditions,
          },
        });
      }
      const pastDueWords = pastDueWordEntities.data || [];


      // Clean the review words data to remove non-serializable functions
      // Filter out REVIEWED words, only keep TO_REVIEW
      const cleanedPastDueReviewWords = pastDueWords
        .filter((word: any) => word.status === "TO_REVIEW")
        .map((word: any) => ({
          id: word.id,
          reviewScheduleId: word.reviewScheduleId,
          wordId: word.wordId,
          status: word.status,
          score: word.score,
          answeredAt: word.answeredAt,
          meta: word.meta,
          completedReviewScheduleId: word.completedReviewScheduleId,
          createdAt: word.createdAt,
          updatedAt: word.updatedAt,
          owner: word.owner,
          ifPastDue: true,
        }));


      // Fetch today's schedule
      const todaySchedule = await (client.models as any).ReviewSchedule.list({
        filter: {
          and: [
            { userProfileId: { eq: userProfileId } },
            { scheduleDate: { eq: currentDate } },
          ],
        },
      });
    
      if (todaySchedule.data && todaySchedule.data.length > 0) {
        // today's schedule exists, merge past due words into today's schedule
       
        const todayScheduleIds = todaySchedule.data ? todaySchedule.data.map((schedule: any) => schedule.id) : [];
        
        let todayWordEntities = { data: [] };

        if (todayScheduleIds.length > 0) {
          const orConditions = todayScheduleIds.map((id: string) => ({
            reviewScheduleId: { eq: id }
          }));
        
          todayWordEntities = await (client.models as any).ReviewScheduleWord.list({
            filter: {
              or: orConditions,
            },
          });
        }

        const todayWords = todayWordEntities.data || [];
      
        // Clean the review words data to remove non-serializable functions
        // Filter out REVIEWED words, only keep TO_REVIEW
        const cleanedTodayReviewWords = todayWords
          .filter((word: any) => word.status === "TO_REVIEW")
          .map((word: any) => ({
            id: word.id,
            reviewScheduleId: word.reviewScheduleId,
            wordId: word.wordId,
            status: word.status,
            score: word.score,
            answeredAt: word.answeredAt,
            meta: word.meta,
            completedReviewScheduleId: word.completedReviewScheduleId,
            createdAt: word.createdAt,
            updatedAt: word.updatedAt,
            owner: word.owner,
            ifPastDue: false,
          }));

        todayAndPastDueWords = [...cleanedPastDueReviewWords, ...cleanedTodayReviewWords];
      } else {
        // No schedule exists for today, create a local schedule with past due words
        todayAndPastDueWords = [...cleanedPastDueReviewWords];
      }
     
      return todayAndPastDueWords;
    } catch (error) {
      console.error("  └─ ❌ Error fetching today's schedule:", error);
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch today's schedule");
    }
  }
);

const todayReviewListSlice = createSlice({
  name: "todayReviewList",
  initialState,
  reducers: {
    setTodayReviewList: (state, action: PayloadAction<ReviewScheduleWord[]>) => {
      state.words = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setTodayReviewListLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearTodayReviewList: (state) => {
      state.words = [];
      state.isLoading = false;
      state.error = null;
    },
    updateWordStatus: (state, action: PayloadAction<{ wordId: string; status: "TO_REVIEW" | "REVIEWED"; score?: number; answeredAt?: string }>) => {
      const word = state.words.find(w => w.wordId === action.payload.wordId);
      if (word) {
        word.status = action.payload.status;
        if (action.payload.score !== undefined) {
          word.score = action.payload.score;
        }
        if (action.payload.answeredAt) {
          word.answeredAt = action.payload.answeredAt;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodaySchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodaySchedule.fulfilled, (state, action) => {
        state.words = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchTodaySchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || "Failed to fetch today's schedule";
      });
  },
});

export const {
  setTodayReviewList,
  setTodayReviewListLoading,
  setError,
  clearTodayReviewList,
  updateWordStatus,
} = todayReviewListSlice.actions;

export default todayReviewListSlice.reducer;
