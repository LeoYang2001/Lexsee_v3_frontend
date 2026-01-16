import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getCurrentUser } from "aws-amplify/auth";

// Types
export interface AuthUser {
  userId: string;
  username: string;
  email: string;
  displayName?: string;
  // Add more profile fields as needed
}

export interface UserState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  error: string | null;
}

// Initial state
const initialState: UserState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
};

// Async thunks
export const fetchUserInfo = createAsyncThunk(
  "user/fetchUserInfo",
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = await getCurrentUser();

      // Transform the user data to our AuthUser interface
      const authUser: AuthUser = {
        userId: currentUser.userId,
        username: currentUser.username,
        email: currentUser.signInDetails?.loginId || "",
        displayName: currentUser.username, // Can be customized later
      };

      return authUser;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Future async thunk for additional user data (profile, database info, etc.)
export const fetchUserProfile = createAsyncThunk(
  "user/fetchUserProfile",
  async (userId: string, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to fetch additional user profile data
      // This could include user preferences, profile images, etc.
      console.log("Fetching additional profile data for user:", userId);

      // Placeholder for future implementation
      return {};
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// User slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // Synchronous actions
    clearUser: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateAuthUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Handle fetchUserInfo
    builder
      .addCase(fetchUserInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      })
      // Handle fetchUserProfile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        // Merge additional profile data with existing user data
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearUser, setError, clearError, updateAuthUser } =
  userSlice.actions;

// Export reducer
export default userSlice.reducer;
