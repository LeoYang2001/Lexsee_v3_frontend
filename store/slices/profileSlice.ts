import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "../../app/client";

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
  reviewInfo: any | null;
  isLoadingReviewInfo: boolean;
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
      console.log("⚠️ No schedule found in profile");
      return null;
    }

    try {
      // Parse the schedule JSON
      const scheduleObject = JSON.parse(profile.schedule);
      console.log("Parsed scheduleObject:", scheduleObject);

      const currentDate = new Date().toISOString().split("T")[0];
      const todaysReview = scheduleObject[currentDate];

      if (!todaysReview) {
        console.log(`📅 No schedule for today (${currentDate})`);
        return null;
      }

      // Step 1: Deduplicate IDs using Set
      const uniqueIds = Array.from(new Set(todaysReview.reviewWordsIds));

      const duplicatesRemoved =
        todaysReview.reviewWordsIds.length - uniqueIds.length;
      if (duplicatesRemoved > 0) {
        console.warn(
          `⚠️ Removed ${duplicatesRemoved} duplicate(s) from today's review`
        );
      }

      // Step 2: Filter to only valid IDs that exist in words database
      const validIds = uniqueIds.filter((id) =>
        state.wordsList.words.some((word: any) => word.id === id)
      );

      const invalidIdsRemoved = uniqueIds.length - validIds.length;

      // Step 3: Update the schedule object with cleaned IDs
      console.log("validIds:", validIds);
      const updatedSchedule = {
        ...scheduleObject,
        [currentDate]: {
          ...todaysReview,
          reviewWordsIds: validIds,
        },
      };
      console.log(
        "Updated schedule after filtering invalid IDs:",
        updatedSchedule
      );
      // Step 4: Update the schedule in the database
      try {
        await (client as any).models.UserProfile.update({
          id: profile.id,
          schedule: JSON.stringify(updatedSchedule),
        });

        console.log(
          "✅ Schedule updated after filtering invalid IDs:",
          JSON.stringify(updatedSchedule, null, 2)
        );
      } catch (error) {
        console.error("❌ Error updating profile:", error);
      }

      return {
        todaysReview: {
          ...todaysReview,
          reviewWordsIds: validIds,
        },
        allScheduledDates: Object.keys(scheduleObject),
        totalWordsCount: validIds.length,
        duplicatesFound: duplicatesRemoved,
        invalidIdsFound: invalidIdsRemoved,
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
      state.reviewInfo = null;
    },
    triggerReviewInfoFetch: (state) => {
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
        console.error("❌ Failed to fetch review info:", action.error.message);
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
