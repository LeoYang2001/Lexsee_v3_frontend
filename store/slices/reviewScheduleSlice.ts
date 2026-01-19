import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { client } from "../../app/client";

export interface ReviewScheduleData {
  id: string;
  userProfileId: string;
  scheduleDate: string;
  notificationId?: string | null;
  successRate?: number | null;
  totalWords?: number | null;
  reviewedCount?: number | null;
  toBeReviewedCount?: number | null;
  scheduleInfo?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}


interface ReviewScheduleState {
  todaySchedule: ReviewScheduleData | null;
  allSchedules: ReviewScheduleData[];
  isSynced: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReviewScheduleState = {
  todaySchedule: null,
  allSchedules: [],
  isSynced: false,
  isLoading: false,
  error: null,
};

/**
 * Fetch today's review schedule
 */
export const fetchTodaySchedule = createAsyncThunk(
  "reviewSchedule/fetchTodaySchedule",
  async (userId: string, { rejectWithValue }) => {
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      console.log(`🔄 Fetching today's schedule for ${currentDate}`);

      const result = await (client.models as any).ReviewSchedule.list({
        filter: {
          and: [
            { userProfileId: { eq: userId } },
            { scheduleDate: { eq: currentDate } },
          ],
        },
      });

      if (!result.data || result.data.length === 0) {
        console.log(`📅 No schedule for today (${currentDate})`);
        return null;
      }

      const schedule = result.data[0];
      console.log(`✅ Today's schedule fetched:`, schedule);
      return schedule;
    } catch (error) {
      console.error("❌ Error fetching today's schedule:", error);
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Subscribe to today's schedule updates
 */
export const subscribeTodaySchedule = createAsyncThunk(
  "reviewSchedule/subscribeTodaySchedule",
  async (userId: string, { rejectWithValue }) => {
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      console.log(`📋 Starting schedule subscription for ${currentDate}`);

      const subscription = await (
        client.models as any
      ).ReviewSchedule.observeQuery({
        filter: {
          and: [
            { userProfileId: { eq: userId } },
            { scheduleDate: { eq: currentDate } },
          ],
        },
      }).subscribe({
        next: ({ items, isSynced }: any) => {
          console.log(
            `📋 Schedule subscription update: ${items.length} items, synced: ${isSynced}`
          );
          return { items, isSynced };
        },
        error: (error: any) => {
          console.error("❌ Schedule subscription error:", error);
          return rejectWithValue(error.message);
        },
      });

      return subscription;
    } catch (error) {
      console.error("❌ Error setting up schedule subscription:", error);
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Clean review schedule data by removing function references
 */
const cleanSchedule = (schedule: any): ReviewScheduleData => {
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
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  };
};

const reviewScheduleSlice = createSlice({
  name: "reviewSchedule",
  initialState,
  reducers: {
    /**
     * Set today's schedule directly (with cleaning)
     */
    setTodaySchedule: (
      state,
      action: PayloadAction<ReviewScheduleData | null>
    ) => {
      state.todaySchedule = action.payload
        ? cleanSchedule(action.payload)
        : null;
      // Reduce log noise - only show count
      if (state.todaySchedule) {
        console.log('todaysSchedule not null here')
        const { totalWords, reviewedCount, toBeReviewedCount } = state.todaySchedule;
        console.log(`     ├─ ${totalWords || 0} words (${reviewedCount || 0} reviewed, ${toBeReviewedCount || 0} pending)`);
      }
      
    },

    /**
     * Update schedule counts (when word is reviewed)
     */
    updateScheduleCounts: (
      state,
      action: PayloadAction<{
        reviewedCount: number;
        toBeReviewedCount: number;
        successRate?: number;
      }>
    ) => {
      if (state.todaySchedule) {
        state.todaySchedule.reviewedCount = action.payload.reviewedCount;
        state.todaySchedule.toBeReviewedCount =
          action.payload.toBeReviewedCount;
        if (action.payload.successRate !== undefined) {
          state.todaySchedule.successRate = action.payload.successRate;
        }
        console.log(
          `📊 Schedule counts updated: ${action.payload.reviewedCount}/${action.payload.reviewedCount + action.payload.toBeReviewedCount}`
        );
      }
    },

    /**
     * Reset today's schedule
     */
    resetTodaySchedule: (state) => {
      state.todaySchedule = null;
      console.log(`🔄 Today's schedule reset`);
    },

    /**
     * Set all-time schedules
     */
    setAllSchedules: (state, action: PayloadAction<ReviewScheduleData[]>) => {
      state.allSchedules = action.payload.map(cleanSchedule);
      console.log(`  └─ ✅ Stored ${state.allSchedules.length} schedule(s) in global state`);
    },

    /**
     * Set sync status
     */
    setSynced: (state, action: PayloadAction<boolean>) => {
      state.isSynced = action.payload;
    },

    /**
     * Set error
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodaySchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodaySchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todaySchedule = action.payload
          ? cleanSchedule(action.payload)
          : null;
        state.isSynced = true;
        console.log(`✅ Today's schedule loaded`);
      })
      .addCase(fetchTodaySchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.todaySchedule = null;
        console.error(`❌ Failed to fetch schedule:`, action.payload);
      });
  },
});

export const {
  setTodaySchedule,
  updateScheduleCounts,
  resetTodaySchedule,
  setAllSchedules,
  setSynced,
  setError,
} = reviewScheduleSlice.actions;

export default reviewScheduleSlice.reducer;
