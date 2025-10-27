import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import OpenAI from "openai";

// Get OpenAI API key from environment
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Async thunk to check OpenAI connection
export const checkOpenAIConnection = createAsyncThunk(
  "ifChina/checkOpenAIConnection",
  async (_, { rejectWithValue }) => {
    try {
      if (!OPENAI_API_KEY) {
        console.warn(
          "⚠️ OPENAI_API_KEY is not available, cannot check connection"
        );
        return { isAccessible: false, reason: "API key missing" };
      }

      const client = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });

      console.log("🌐 Testing OpenAI connection...");

      // Send a simple test request with minimal tokens
      const response = await client.chat.completions.create(
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: "test",
            },
          ],
          max_tokens: 5,
        },
        {
          timeout: 5000, // 5 second timeout
        }
      );

      console.log("✅ OpenAI connection successful - User is NOT in China");
      return { isAccessible: true, reason: "Connection successful" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if error indicates geolocation restriction
      const isChinaRestricted =
        errorMessage.includes("Connection refused") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("ETIMEDOUT") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("403") ||
        errorMessage.includes("blocked");

      if (isChinaRestricted) {
        console.log(
          "🇨🇳 OpenAI connection blocked - User likely in China or restricted region"
        );
      }

      console.warn(
        "❌ OpenAI connection failed:",
        errorMessage.substring(0, 100)
      );
      return { isAccessible: false, reason: errorMessage };
    }
  }
);

interface IfChinaState {
  ifChina: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: string | null;
}

const initialState: IfChinaState = {
  ifChina: false, // Default to false (assume user is NOT in China)
  isLoading: false,
  error: null,
  lastChecked: null,
};

const ifChinaSlice = createSlice({
  name: "ifChina",
  initialState,
  reducers: {
    // Reset the state
    resetIfChinaState: (state) => {
      state.ifChina = false;
      state.isLoading = false;
      state.error = null;
    },

    // Manually set the China flag
    setIfChina: (state, action) => {
      state.ifChina = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Pending state
      .addCase(checkOpenAIConnection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // Fulfilled state
      .addCase(checkOpenAIConnection.fulfilled, (state, action) => {
        state.isLoading = false;
        // If OpenAI is accessible, user is NOT in China (false)
        // If OpenAI is not accessible, user is likely in China (true)
        state.ifChina = !action.payload.isAccessible;
        state.lastChecked = new Date().toISOString();

        if (action.payload.isAccessible) {
          console.log("✅ Status: User is NOT in China");
        } else {
          console.log(
            "🇨🇳 Status: User is likely in China or in a restricted region"
          );
        }
      })
      // Rejected state
      .addCase(checkOpenAIConnection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // On error, assume user might be in China
        state.ifChina = true;
        state.lastChecked = new Date().toISOString();
        console.warn(
          "⚠️ Status: Cannot determine location, assuming China for safety"
        );
      });
  },
});

// Export actions
export const { resetIfChinaState, setIfChina } = ifChinaSlice.actions;

// Export selectors
export const selectIfChina = (state: any) => state.ifChina.ifChina;
export const selectIfChinaLoading = (state: any) => state.ifChina.isLoading;
export const selectIfChinaError = (state: any) => state.ifChina.error;
export const selectLastChecked = (state: any) => state.ifChina.lastChecked;

// Export reducer
export default ifChinaSlice.reducer;
