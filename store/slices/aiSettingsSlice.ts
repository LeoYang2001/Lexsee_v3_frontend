import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export type AIModel = "openai" | "deepseek";

// Thunk renamed to reflect the "Probe" nature
export const probeOpenAIConnection = createAsyncThunk(
  "aiSettings/probeConnection",
  async (_, { getState, rejectWithValue }) => {
    console.log("[AI Probe] Starting OpenAI connection probe...");
    
    const state = getState() as any;
    console.log("[AI Probe] Current state:", state.aiSettings);
    const { hasTested } = state.aiSettings;
    
    // If we've already tested successfully in the past, don't ping the API again
    if (hasTested) {
      console.log("[AI Probe] Already tested, skipping probe");
      return;
    }

    console.log("[AI Probe] First time test - proceeding with probe");

    try {
      console.log("[AI Probe] Checking API key...");
      if (!OPENAI_API_KEY) {
        console.error("[AI Probe] ✗ API key missing");
        throw new Error("API key missing");
      }

      console.log("[AI Probe] ✓ API key found, initializing OpenAI client...");
      const client = new OpenAI({ apiKey: OPENAI_API_KEY });
      
      console.log("[AI Probe] Initiating API test with 4s timeout...");
      // Minimal probe: using a timeout is key for the "China" check
      const startTime = Date.now();
      await client.chat.completions.create(
        { model: "gpt-3.5-turbo", messages: [{ role: "user", content: "hi" }], max_tokens: 1 },
        { timeout: 4000 } // 4 seconds is plenty for a global ping
      );
      const duration = Date.now() - startTime;

      console.log(`[AI Probe] ✓ OpenAI connection successful (${duration}ms)`);
      return { canAccessOpenAI: true };
    } catch (error: any) {
      console.error("[AI Probe] ✗ Connection failed:", error.message);
      console.error("[AI Probe] Error details:", error);
      return { canAccessOpenAI: false, error: error.message };
    }
  }
);

interface AISettingsState {
  activeModel: AIModel;
  hasTested: boolean; // Once true, we stop probing at launch
  isLoading: boolean;
}

const initialState: AISettingsState = {
  activeModel: "openai", // Default assumption
  hasTested: false,
  isLoading: false,
};

const aiSettingsSlice = createSlice({
  name: "aiSettings",
  initialState,
  reducers: {
    // This is the "Circuit Breaker" action
    // Call this if a real request fails at runtime
    switchModel: (state, action: PayloadAction<AIModel>) => {
      state.activeModel = action.payload;
      state.hasTested = true; // Once we manually switch, we consider it "tested"
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(probeOpenAIConnection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(probeOpenAIConnection.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.activeModel = action.payload.canAccessOpenAI ? "openai" : "deepseek";
          state.hasTested = true; 
        }
      })
      .addCase(probeOpenAIConnection.rejected, (state) => {
        state.isLoading = false;
        state.activeModel = "deepseek"; // Fallback on total failure
        state.hasTested = true;
      });
  },
});

export const { switchModel } = aiSettingsSlice.actions;
export default aiSettingsSlice.reducer;