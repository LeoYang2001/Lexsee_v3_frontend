import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SubscriptionState {
  isPro: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  isPro: false,
  isPurchasing: false, // For general purchase loading
  isRestoring: false,  // For the 'Restore Purchases' button loading state
  error: null,
};

export const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    // This is the most important reducer, called by your RC Listener
    setProStatus: (state, action: PayloadAction<boolean>) => {
      state.isPro = action.payload;
    },
    setPurchasing: (state, action: PayloadAction<boolean>) => {
      state.isPurchasing = action.payload;
    },
    setRestoring: (state, action: PayloadAction<boolean>) => {
      state.isRestoring = action.payload;
    },
    setSubError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    // Useful for a clean logout
    resetSubscription: () => initialState,
  },
});

export const { 
  setProStatus, 
  setPurchasing, 
  setRestoring, 
  setSubError, 
  resetSubscription 
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;