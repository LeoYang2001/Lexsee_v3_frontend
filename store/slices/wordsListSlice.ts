import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Word } from "../../types/common/Word";

export interface WordPhonetics {
  audioUrl: string;
  text: string;
}

export interface WordMeaning {
  synonyms: string[];
  partOfSpeech: string;
  antonyms: string[];
  definition: string;
}

interface WordsListState {
  words: Word[];
  isLoading: boolean;
  isSynced: boolean;
  error: string | null;
}

const initialState: WordsListState = {
  words: [],
  isLoading: false,
  isSynced: false,
  error: null,
};

// Helper function to parse word data
const parseWordData = (word: any): Word => {
  console.log("parseWordData, word:", word);
  try {
    const parsedData = JSON.parse(word.data);
    return {
      id: word.id,
      word: parsedData.word || word.word,
      imgUrl: parsedData.imgUrl || word.imgUrl,
      status: parsedData.status || word.status,
      meanings: parsedData.meanings || word.meanings,
      phonetics: {
        text: parsedData.phonetics?.text || word.phonetics.text,
        audioUrl: parsedData.phonetics?.audioUrl || word.phonetics.audioUrl,
      },
      timeStamp: parsedData.timeStamp || word.timeStamp,
    };
  } catch (error) {
    console.error("Error parsing word data:", error);
    return word;
  }
};

const wordsListSlice = createSlice({
  name: "wordsList",
  initialState,
  reducers: {
    setWords: (state, action: PayloadAction<Word[]>) => {
      // Parse the data for each word
      state.words = action.payload.map(parseWordData);
      state.isLoading = false;
      state.error = null;
    },
    setSynced: (state, action: PayloadAction<boolean>) => {
      state.isSynced = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addWord: (state, action: PayloadAction<Word>) => {
      const parsedWord = parseWordData(action.payload);
      const existingIndex = state.words.findIndex(
        (word) => word.id === parsedWord.id
      );
      if (existingIndex >= 0) {
        // Update existing word
        state.words[existingIndex] = parsedWord;
      } else {
        // Add new word
        state.words.push(parsedWord);
      }
    },
    removeWord: (state, action: PayloadAction<string>) => {
      state.words = state.words.filter((word) => word.id !== action.payload);
    },
    updateWord: (state, action: PayloadAction<Word>) => {
      const parsedWord = parseWordData(action.payload);
      const index = state.words.findIndex((word) => word.id === parsedWord.id);
      if (index !== -1) {
        state.words[index] = parsedWord;
      }
    },
    clearWords: (state) => {
      state.words = [];
      state.isSynced = false;
      state.isLoading = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setWords,
  setSynced,
  setLoading,
  addWord,
  removeWord,
  updateWord,
  clearWords,
  setError,
} = wordsListSlice.actions;

export default wordsListSlice.reducer;
