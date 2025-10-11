import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null,
};

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
    },
  },
});

export const { setProfile, setProfileLoading, setProfileError, clearProfile } =
  profileSlice.actions;
export default profileSlice.reducer;
