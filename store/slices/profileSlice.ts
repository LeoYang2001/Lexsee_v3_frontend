import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "../../app/client";
import { GuideStep } from "../../types/common/GuideStep";


/**
 * Updated UserProfile interface
 */
export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  wordsListId?: string;
  providerType?: "Google" | "SignInWithApple" | undefined;
  // Values: 'NEW', 'FIRST_WORD_SEARCHED'', 'FIRST_REVIEW_DONE', 'COMPLETED'
  onboardingStage?: GuideStep;
}



interface ProfileState {
  data: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  data: null,
  loading: false,
  error: null,
};



//update onboarding stage
/**
 * Async Thunk to update onboarding stage in Amplify and Redux
 */
export const updateOnboardingStage = createAsyncThunk(
  "profile/updateOnboardingStage",
  async (newStage: UserProfile["onboardingStage"], thunkAPI) => {
    try {
      const state = thunkAPI.getState() as { profile: ProfileState };
      const currentProfile = state.profile.data;

      if (!currentProfile) throw new Error("No profile found");

     
      // current profile with the updated stage.
      const updatedProfile = {
        ...currentProfile,
        onboardingStage: newStage,
      };

      
    // 2. NON-BLOCKING BACKEND UPDATE
      // We don't use 'await' here so the function continues immediately.
    // Inside your Async Thunk
      (client as any).models.UserProfile.update({
        id: currentProfile.id,
        onboardingStage: newStage,
        // DO NOT spread (...currentProfile) here
      }).then(({ errors }: any) => {
        if (errors) {
          console.log('newStage we want to update:', JSON.stringify(newStage))
          console.error("Background onboarding update failed:", errors);
        }
      }); 

      // 3. RETURN IMMEDIATELY
      // Redux hits 'fulfilled' now, making the UI transition instant.
      return updatedProfile;
      
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    // Standard action to set the profile from the launch sequence
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.data = action.payload;
    },
    // Clear profile on logout
    clearProfile: (state) => {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateOnboardingStage.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateOnboardingStage.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload as UserProfile; // Update local state with cloud result
        state.error = null;
      })
      .addCase(updateOnboardingStage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;