import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  wordsListId?: string;
  schedule?: string | null;
}

export interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  reviewInfo: any | null; // Add review info to state
  isLoadingReviewInfo: boolean; // Track review info loading
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null,
  reviewInfo: null,
  isLoadingReviewInfo: false,
};

// Async thunk to fetch review info
export const fetchReviewInfo = createAsyncThunk(
  "profile/fetchReviewInfo",
  async (_, { getState }) => {
    const state = getState() as any;
    const profile = state.profile.profile;

    if (!profile?.schedule) {
      console.log("No schedule found in profile");
      return null;
    }

    try {
      // Parse the schedule JSON
      const scheduleObject = JSON.parse(profile.schedule);

      // You can add more processing here
      const currentDate = new Date().toISOString().split("T")[0];
      const todaysReview = scheduleObject[currentDate];

      return {
        todaysReview,
        allScheduledDates: Object.keys(scheduleObject),
      };
    } catch (error) {
      console.error("❌ Error parsing schedule:", error);
      throw error;
    }
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setProfileLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setProfileError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.isLoading = false;
      state.error = null;
      state.reviewInfo = null; // Clear review info when profile is cleared
    },
    // Manual trigger for review info fetch
    triggerReviewInfoFetch: (state) => {
      // This is just a trigger, actual fetching happens in the thunk
      state.isLoadingReviewInfo = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewInfo.pending, (state) => {
        state.isLoadingReviewInfo = true;
      })
      .addCase(fetchReviewInfo.fulfilled, (state, action) => {
        state.reviewInfo = action.payload;
        state.isLoadingReviewInfo = false;
      })
      .addCase(fetchReviewInfo.rejected, (state, action) => {
        state.isLoadingReviewInfo = false;
        console.error("Failed to fetch review info:", action.error.message);
      });
  },
});

export const {
  setProfile,
  setProfileLoading,
  setProfileError,
  clearProfile,
  triggerReviewInfoFetch,
} = profileSlice.actions;

export default profileSlice.reducer;
