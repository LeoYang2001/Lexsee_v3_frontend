import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CompletedReviewSchedule {
  id: string;
  owner: string;
  scheduleDate: string;
  totalWords: number;
  userProfileId?: string;
  reviewLogs: string;
  createdAt: string;
  updatedAt: string;
  // Note: We exclude the [Function anonymous] fields here
}

interface CompletedReviewSchedulesState {
  items: CompletedReviewSchedule[];
  isSynced: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: CompletedReviewSchedulesState = {
  items: [],
  isSynced: false,
  isLoading: true,
  error: null,
};

const completedReviewSchedulesSlice = createSlice({
  name: "completedReviewSchedules",
  initialState,
  reducers: {
    // Main dispatcher for the subscription
    setCompletedReviewSchedules: (
      state,
      action: PayloadAction<CompletedReviewSchedule[]>,
    ) => {
      state.items = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    // Tracks background sync status
    setCompletedSchedulesSynced: (state, action: PayloadAction<boolean>) => {
      state.isSynced = action.payload;
    },
    // Reset on logout
    clearCompletedSchedules: () => initialState,
  },
});

export const {
  setCompletedReviewSchedules,
  setCompletedSchedulesSynced,
  clearCompletedSchedules,
} = completedReviewSchedulesSlice.actions;
export default completedReviewSchedulesSlice.reducer;
