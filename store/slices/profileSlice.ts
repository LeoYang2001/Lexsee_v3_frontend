import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";


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
});

export const { setProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;