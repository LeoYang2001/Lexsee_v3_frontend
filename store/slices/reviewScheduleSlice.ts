import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ReviewSchedule {
  id: string;
  owner: string;
  scheduleDate: string; // "2026-01-24"
  toBeReviewedCount: number;
  totalWords: number;
  reviewedCount: number;
  successRate: number | null;
  userProfileId: string;
  createdAt: string;
  updatedAt: string;
  // Note: We exclude the [Function anonymous] fields here
}

interface ReviewSchedulesState {
  items: ReviewSchedule[];
  isSynced: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReviewSchedulesState = {
  items: [],
  isSynced: false,
  isLoading: true,
  error: null,
};

const reviewSchedulesSlice = createSlice({
  name: "reviewSchedules",
  initialState,
  reducers: {
    // Main dispatcher for the subscription
    setReviewSchedules: (state, action: PayloadAction<ReviewSchedule[]>) => {
      state.items = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    // Tracks background sync status
    setSchedulesSynced: (state, action: PayloadAction<boolean>) => {
      state.isSynced = action.payload;
    },
    // Reset on logout
    clearSchedules: () => initialState,
  },
});

export const { setReviewSchedules, setSchedulesSynced, clearSchedules } =
  reviewSchedulesSlice.actions;
export default reviewSchedulesSlice.reducer;
