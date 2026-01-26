import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { 
  persistStore, 
  persistReducer, 
  FLUSH, 
  REHYDRATE, 
  PAUSE, 
  PERSIST, 
  PURGE, 
  REGISTER 
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import userReducer from "./slices/userSlice";
import todayReviewListReducer from "./slices/todayReviewListSlice";
import profileReducer from './slices/profileSlice';
import wordsListReducer from './slices/wordsListSlice';
import reviewScheduleReducer from './slices/reviewScheduleSlice';
import completedReviewSchedulesReducer from './slices/completedReviewScheduleSlice';
import reviewScheduleWordsReducer from './slices/reviewScheduleWordsSlice';
import aiSettingsReducer from './slices/aiSettingsSlice'; // Ensure this filename matches your slice

// 1. Combine all your reducers
const rootReducer = combineReducers({
  user: userReducer,
  profile: profileReducer, 
  wordsList: wordsListReducer,
  reviewSchedule: reviewScheduleReducer,
  todayReviewList: todayReviewListReducer,
  reviewScheduleWords: reviewScheduleWordsReducer,
  completedReviewSchedules: completedReviewSchedulesReducer,
  aiSettings: aiSettingsReducer,
});

// 2. Configure persistence
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // We only want to save specific things to disk. 
  // You definitely want aiSettings and profile here.
  whitelist: [''], 
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// 3. Configure the store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Redux Persist uses some non-serializable actions that we need to ignore
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// 4. Export the persistor
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;