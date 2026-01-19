import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import profileReducer from "./slices/profileSlice";
import wordsListReducer from "./slices/wordsListSlice";
import ifChinaReducer from "./slices/ifChinaSlice";
import reviewScheduleReducer from "./slices/reviewScheduleSlice";
import todayReviewListReducer from "./slices/todayReviewListSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    profile: profileReducer, // Ensure profileReducer is imported and added here
    wordsList: wordsListReducer, // Add your wordsListReducer here
    ifChina: ifChinaReducer,
    reviewSchedule: reviewScheduleReducer,
    todayReviewList: todayReviewListReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
