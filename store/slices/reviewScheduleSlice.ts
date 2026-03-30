import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CompletedReviewSchedule } from "./completedReviewScheduleSlice";

interface ReviewSchedulesState {
  items: CompletedReviewSchedule[];
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
    setReviewSchedules: (
      state,
      action: PayloadAction<CompletedReviewSchedule[]>,
    ) => {
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
