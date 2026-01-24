import { createSlice, PayloadAction } from "@reduxjs/toolkit";


export type ScheduleWordStatus = "TO_REVIEW" | "REVIEWED";

export interface ScheduleWord {
  id: string;
  reviewScheduleId: string;
  wordId: string;
  status: ScheduleWordStatus;
  score: number | null;
  answeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleWordsState {
  items: ScheduleWord[];
  isSynced: boolean;
  isLoading: boolean;
  error: string | null;
}


const initialState: ScheduleWordsState = {
  items: [],
  isSynced: false,
  isLoading: true,
  error: null,
};

const reviewScheduleWordsSlice = createSlice({
  name: "reviewScheduleWords",
  initialState,
  reducers: {
    // Standard data loader from subscription
    setScheduleWords: (state, action: PayloadAction<ScheduleWord[]>) => {
      state.items = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    // Sync status tracker
    setScheduleWordsSynced: (state, action: PayloadAction<boolean>) => {
      state.isSynced = action.payload;
    },
    // Local Update: When a user answers a card, update Redux instantly 
    clearScheduleWords: () => initialState,
  },
});

export const { 
  setScheduleWords, 
  setScheduleWordsSynced, 
  clearScheduleWords 
} = reviewScheduleWordsSlice.actions;

export default reviewScheduleWordsSlice.reducer;