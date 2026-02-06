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
import  subscriptionSlice from "./slices/subscriptionSlice";

// 1. Combine all your reducers
const appReducer = combineReducers({
  user: userReducer,
  profile: profileReducer, 
  wordsList: wordsListReducer,
  reviewSchedule: reviewScheduleReducer,
  todayReviewList: todayReviewListReducer,
  reviewScheduleWords: reviewScheduleWordsReducer,
  completedReviewSchedules: completedReviewSchedulesReducer,
  aiSettings: aiSettingsReducer,
  subscription: subscriptionSlice
});


// 2. Define the Root Reducer to handle global actions
const rootReducer = (state: any, action: any) => {
  
  if (action.type === 'USER_LOGOUT') {
    console.log("──────────────────────────────────────────────────");
    console.log("🛑 [RootReducer] USER_LOGOUT action detected.");
    
  
    // 1. Wipe the state
    // Setting state to undefined forces all slices to return to their initialState
    state = undefined;

    // 2. Clean up physical storage
    console.log("🧹 [RootReducer] Clearing AsyncStorage 'persist:root'...");
    AsyncStorage.removeItem('persist:root')
      .then(() => console.log("✅ [RootReducer] AsyncStorage cleared successfully."))
      .catch((err) => console.error("❌ [RootReducer] Error clearing AsyncStorage:", err));

    console.log("✨ [RootReducer] State reset complete. User is now 'Guest'.");
    console.log("──────────────────────────────────────────────────");
  }

  return appReducer(state, action);
};

// 3. Configure persistence, i don't want to persist anything just yet
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // We only want to save specific things to disk. 
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