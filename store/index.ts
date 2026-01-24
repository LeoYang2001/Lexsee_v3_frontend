import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import todayReviewListReducer from "./slices/todayReviewListSlice";
import profileReducer from './slices/profileSlice'
import wordsListReducer from './slices/wordsListSlice'
import reviewScheduleReducer from './slices/reviewScheduleSlice'
import completedReviewSchedulesReducer from './slices/completedReviewScheduleSlice'
import ifChinaReducer from './slices/ifChinaSlice'
import reviewScheduleWordsReducer from './slices/reviewScheduleWordsSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    profile: profileReducer, 
    wordsList: wordsListReducer,
    reviewSchedule: reviewScheduleReducer,
    todayReviewList: todayReviewListReducer,
    reviewScheduleWords: reviewScheduleWordsReducer,
    completedReviewSchedules: completedReviewSchedulesReducer,
    ifChina: ifChinaReducer,
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
