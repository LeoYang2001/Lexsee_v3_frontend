import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Word } from "../../types/common/Word";

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

export const { setWords, setSynced, clearWords } = wordsListSlice.actions;
export default wordsListSlice.reducer;