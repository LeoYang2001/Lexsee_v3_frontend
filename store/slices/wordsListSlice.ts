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
  try {
    let parsedData;

    // Handle cases where word.data might be a string that needs parsing
    if (typeof word.data === "string") {
      try {
        parsedData = JSON.parse(word.data);
      } catch (parseError) {
        console.warn("Failed to parse word.data as JSON:", parseError);
        parsedData = {};
      }
    } else {
      parsedData = word.data || {};
    }
    // Safely extract phonetics data
    const getPhonetics = () => {
      const parsedPhonetics = parsedData.phonetics;
      const originalPhonetics = word.phonetics;

      // If we have parsed phonetics data
      if (parsedPhonetics && typeof parsedPhonetics === "object") {
        return {
          text: parsedPhonetics.text || "",
          audioUrl: parsedPhonetics.audioUrl || undefined,
        };
      }

      // If we have original phonetics data
      if (originalPhonetics && typeof originalPhonetics === "object") {
        return {
          text: originalPhonetics.text || "",
          audioUrl: originalPhonetics.audioUrl || undefined,
        };
      }

      // Default fallback
      return {
        text: "",
        audioUrl: undefined,
      };
    };

    return {
      id: word.id,
      word: parsedData.word || word.word || "",
      imgUrl: parsedData.imgUrl || word.imgUrl || null,
      status: parsedData.status || word.status || "COLLECTED",
      meanings: parsedData.meanings || word.meanings || [],
      phonetics: getPhonetics(),
      exampleSentences:
        word.exampleSentences || parsedData.exampleSentences || null,
      timeStamp:
        parsedData.timeStamp || word.timeStamp || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error parsing word data:", error);
    console.error("Problematic word object:", word);

    // Return a safe fallback object
    return {
      id: word.id || crypto.randomUUID(),
      word: word.word || "Unknown Word",
      imgUrl: word.imgUrl || null,
      status: word.status || "COLLECTED",
      meanings: word.meanings || [],
      phonetics: {
        text: "",
        audioUrl: undefined,
      },
      exampleSentences: word.exampleSentences || null,
      timeStamp: word.timeStamp || new Date().toISOString(),
    };
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
