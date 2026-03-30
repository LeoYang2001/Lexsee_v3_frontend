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
  const today = new Date().toISOString().split("T")[0];
  return words.filter((word) => {
    const isDue = word.nextReviewDate && word.nextReviewDate <= today;
    // We check for both statuses to ensure we don't miss words
    // the user has already started learning.
    const isActive = word.status === "COLLECTED" || word.status === "LEARNED";
    return isDue && isActive;
  });
});

export const { setWords, setSynced, clearWords } = wordsListSlice.actions;
export default wordsListSlice.reducer;
