import { useEffect, useState, useRef } from "react";
import { router } from "expo-router";
import { Hub } from "@aws-amplify/core";
import { getCurrentUser } from "aws-amplify/auth";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../store/hooks";
import { AppState } from "react-native";
import {
  setWords,
  setSynced,
  setLoading,
  setError,
  cleanWords,
} from "../store/slices/wordsListSlice";
import {
  clearProfile,
  setProfile,
  setProfileLoading,
  cleanUserProfile,
} from "../store/slices/profileSlice";
import { clearUser, fetchUserInfo } from "../store/slices/userSlice";
import { setTodaySchedule, setAllSchedules } from "../store/slices/reviewScheduleSlice";
import { setTodayReviewList, clearTodayReviewList, fetchTodaySchedule } from "../store/slices/todayReviewListSlice";
import { client } from "../app/client";
import { useCheckChina } from "./useCheckChina";
import { getLocalDate } from "../util/utli";

export const useLaunchSequence = () => {
  const dispatch = useDispatch() as any;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [wordsSubscription, setWordsSubscription] = useState<any>(null);
  const [scheduleSubscription, setScheduleSubscription] = useState<any>(null);
  const [hubAuthFail, setHubAuthFail] = useState(false);

  
  const userProfile = useAppSelector((state) => state.profile.profile);
  
  // Track profile creation to prevent duplicates
  const profileCreationInProgress = useRef<{ [key: string]: boolean }>({});
  const profileCreationTimeout = useRef<{
    [key: string]: ReturnType<typeof setTimeout>;
  }>({});

  // 1. China check (happens automatically via hook)
  const { ifChina, isLoading: chinaCheckLoading } = useCheckChina();

  /**
   * Create a new user profile with related entities
   */
  const createUserProfile = async (userId: string): Promise<{ success: boolean; profileId?: string }> => {
    console.log('🔨 Creating new user profile for userId:', userId);
    try {
      // 1. Create UserProfile
      const newProfile = await (client as any).models.UserProfile.create({
        userId: userId,
        username: 'User', // Default username, can be updated later
        ifChineseUser: ifChina, // Use the China check result
      });

      console.log('✅ UserProfile created:', {
        profileId: newProfile.data.id,
        userId: newProfile.data.userId,
        ifChineseUser: newProfile.data.ifChineseUser,
      });

      // 2. Create WordsList for this profile
      const wordsList = await (client as any).models.WordsList.create({
        userProfileId: newProfile.data.id,
      });
      console.log('✅ WordsList created:', wordsList.data.id);

      // 3. Create SearchHistory for this profile
      const searchHistory = await (client as any).models.SearchHistory.create({
        userProfileId: newProfile.data.id,
        searchedWords: [],
      });
      console.log('✅ SearchHistory created:', searchHistory.data.id);

      // 4. Create BadgeList for this profile
      const badgeList = await (client as any).models.BadgeList.create({
        userProfileId: newProfile.data.id,
      });
      console.log('✅ BadgeList created:', badgeList.data.id);
      

      // Clean and set the profile
      const serializedProfile = await cleanUserProfile(newProfile.data);
      dispatch(setProfile(serializedProfile));

      console.log('✅ Profile setup complete with all related entities');
      return { success: true, profileId: newProfile.data.id };
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return { success: false };
    }
  };

  /**
   * Check if user has a profile
   */
  const checkUserProfile = async (userId: string): Promise<{ hasProfile: boolean; profileId?: string }> => {
    dispatch(setProfileLoading(true));
    console.log('🔍 Checking user profile for userId:', userId);
    try {
      const profileResult = await (client as any).models.UserProfile.list({
        filter: { userId: { eq: userId } },
      });

     

      if (profileResult.data && profileResult.data.length > 0) {
        const profile = profileResult.data[0];
        console.log('✅ Profile found:', {
          profileId: profile.id,
          userId: profile.userId,
          createdAt: profile.createdAt
        });

        // Clean the profile BEFORE dispatching
        const serializedProfile = await cleanUserProfile(profile);
        dispatch(setProfile(serializedProfile));

        if (profileCreationTimeout.current[userId]) {
          clearTimeout(profileCreationTimeout.current[userId]);
          delete profileCreationTimeout.current[userId];
        }

        delete profileCreationInProgress.current[userId];
        dispatch(setProfileLoading(false));
        console.log('✅ User profile found and loaded');
        return { hasProfile: true, profileId: profile.id };
      } else {
        console.log("⚠️ No profile found for userId:", userId);
        console.log("📋 Profile result data:", profileResult.data);

        if (profileCreationInProgress.current[userId]) {
          console.log("⏳ Profile creation already in progress for userId:", userId);
          dispatch(setProfileLoading(false));
          return { hasProfile: false };
        }

        console.log("🚀 Setting profile creation in progress flag for userId:", userId);
        profileCreationInProgress.current[userId] = true;

        profileCreationTimeout.current[userId] = setTimeout(() => {
          console.log("⏰ Profile creation timeout reached (30s) for userId:", userId);
          delete profileCreationInProgress.current[userId];
          delete profileCreationTimeout.current[userId];
        }, 30000);

        console.log("🔨 Attempting to create profile...");
        const createResult = await createUserProfile(userId);

        // Clear the creation tracking
        if (profileCreationTimeout.current[userId]) {
          clearTimeout(profileCreationTimeout.current[userId]);
          delete profileCreationTimeout.current[userId];
        }
        delete profileCreationInProgress.current[userId];

        dispatch(setProfileLoading(false));
        
        if (createResult.success && createResult.profileId) {
          console.log("✅ Profile created and loaded successfully");
          return { hasProfile: true, profileId: createResult.profileId };
        } else {
          console.log("❌ Profile creation failed");
          return { hasProfile: false };
        }
      }
    } catch (error) {
      console.error("❌ Error checking user profile for userId:", userId);
      console.error("❌ Error details:", error);
      console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      dispatch(setProfileLoading(false));
      return { hasProfile: false };
    }
  };

  /**
   * Start words subscription
   */
  const startWordsSubscription = () => {
    if (wordsSubscription) {
      console.log("📋 Words subscription already active");
      return;
    }

    console.log("  ├─ 📚 Starting words subscription...");

    const sub = (client.models as any).Word.observeQuery().subscribe({
      next: ({ items, isSynced }: any) => {
    
        
        const cleanedWords = cleanWords(items);

        console.log(
          `📋 Subscription update: ${cleanedWords.length} words, synced: ${isSynced}`
        );

        dispatch(setWords(cleanedWords));
        console.log('clean words: ', JSON.stringify(cleanedWords.map(w => { return { id: w.id, word: w.word }; })));


        dispatch(setSynced(isSynced));
      },
      error: (error: any) => {
        console.error("❌ Words subscription error:", error);
        dispatch(setError(error.message || "Failed to sync words"));
      },
    });

    setWordsSubscription(sub);
    console.log("  ├─ ✅ Words subscription active");
  };

  /**
   * Stop words subscription
   */
  const stopWordsSubscription = () => {
    if (wordsSubscription) {
      console.log("🛑 Stopping words subscription");
      wordsSubscription.unsubscribe?.();
      setWordsSubscription(null);

      dispatch(setWords([]));
      dispatch(setSynced(false));
    }
  };

  /**
   * 2.2 Fetch all-time schedules - load and log all review schedules
   * Called after successful authentication and profile load
   */
  const fetchAllSchedules = async (userProfileId: string) => {
   
    try {
      if (!userProfileId) {
        console.warn("⚠️ No user profile for fetching schedules");
        return;
      }
      console.log("  ├─ 🔄 Fetching review schedules...");

      const result = await (client.models as any).ReviewSchedule.list({
        filter: {
          userProfileId: { eq: userProfileId },
        },
      });

      if (result.data && result.data.length > 0) {
        const cleanedSchedules = result.data
          .map((schedule: any) => ({
            id: schedule.id,
            scheduleDate: schedule.scheduleDate,
            totalWords: schedule.totalWords || 0,
            toBeReviewedCount: schedule.toBeReviewedCount || 0,
            reviewedCount: schedule.reviewedCount || 0,
            successRate: schedule.successRate || 0,
            scheduleInfo: schedule.scheduleInfo || null,
            notificationId: schedule.notificationId || null,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
            userProfileId: schedule.userProfileId,
          }))
          .sort(
            (a: any, b: any) =>
              new Date(b.scheduleDate).getTime() -
              new Date(a.scheduleDate).getTime()
          );

        // Store in Redux global state
        dispatch(setAllSchedules(cleanedSchedules));
        
        
       
      } else {
        console.log("  └─ 📅 No schedules found");
        dispatch(setAllSchedules([]));
      }
    } catch (error) {
      console.error("  └─ ❌ Error fetching schedules:", error);
      dispatch(setAllSchedules([]));
    }
  };


  /**
   * 2. Handle successful authentication
   */
  const handleSuccessfulAuth = async (user: any) => {
    try {
      console.log("\n✅ Authentication successful");
      setIsAuthenticated(true);

      // Fetch user info and store in Redux
      const resultAction = await dispatch(fetchUserInfo());

      if (fetchUserInfo.fulfilled.match(resultAction)) {
        console.log('auth success and check profile...')
        const profileResult = await checkUserProfile(
          resultAction.payload.userId
        );

        if (profileResult.hasProfile && profileResult.profileId) {
          // Profile exists (found or created) - load user data
          console.log("  ├─ 📋 Profile ready - loading user data...");
          
          // 2.1 Start words subscription
          startWordsSubscription();
          
          // 2.2 Fetch all schedules BEFORE navigation 
          await fetchAllSchedules(profileResult.profileId);

          // 2.3 Fetch today's schedule (including past due)
          await dispatch(fetchTodaySchedule(profileResult.profileId));
          
          console.log("\n🏠 Navigating to home...\n");
          router.replace("/(home)");
        } else {
          // Profile creation failed
          console.log("❌ Profile check/creation failed - redirecting to auth");
          setIsAuthenticated(false);
          router.replace("/(auth)");
        }
      } else {
        handleAuthFailure();
      }
    } catch (error) {
      console.error("Error handling successful auth:", error);
      handleAuthFailure();
    } finally {
      dispatch(setLoading(false));
    }
  };

  /**
   * Handle authentication failure
   */
  const handleAuthFailure = () => {
    setHubAuthFail(true);
    console.log('set hub auth fail to true')
    setIsAuthenticated(false);
    stopWordsSubscription();
    dispatch(clearUser());
    dispatch(clearProfile());
    dispatch(setAllSchedules([]));
    dispatch(setTodaySchedule(null));
    dispatch(clearTodayReviewList());
    router.replace("/(auth)/sign-in");
  };


  /**
   * 2. Initial auth check on app launch
   */
  useEffect(() => {

   
    dispatch(setLoading(true));

    // Subscribe to Auth status changes
    const authListener = Hub.listen("auth", async (data) => {
      const { event } = data.payload;

      console.log("🔐 Auth event:", event);

      switch (event) {
        case "signInWithRedirect":
          console.log("✅ Sign in with redirect completed");
          try {
            const user = await getCurrentUser();
            await handleSuccessfulAuth(user);
          } catch (error) {
            console.error("❌ Failed after redirect:", error);
            handleAuthFailure();
          }
          break;

        case "signInWithRedirect_failure":
          console.log("❌ Sign in with redirect failed");
          handleAuthFailure();
          break;

        case "signedIn":
          console.log("✅ User signed in (email)");
          try {
            const user = await getCurrentUser();
            await handleSuccessfulAuth(user);
          } catch (error) {
            console.error("❌ Failed to get user after sign in:", error);
            handleAuthFailure();
          }
          break;

        case "signedOut":
          console.log("👋 User signed out");
          handleAuthFailure();
          break;

        default:
          break;
      }
    });

    // 2. Initial auth check (only once on app start)
    const checkInitialAuth = async () => {
      console.log('hub auth fail value when its called:', hubAuthFail)
      if(hubAuthFail) return;
      try {
        const user = await getCurrentUser();
        console.log("\n🔐 Checking authentication...");
        await handleSuccessfulAuth(user);
      } catch (error) {
        console.log("❌ Not authenticated - redirecting to login\n");
        setIsAuthenticated(false);
        dispatch(setLoading(false));
        router.replace("/(auth)/sign-in");
      }
    };

    // Small delay to ensure components are mounted before navigation
    const authCheckTimer = setTimeout(checkInitialAuth, 1000);

    return () => {
      authListener();
      clearTimeout(authCheckTimer);
      stopWordsSubscription();
    };
  }, [dispatch]);

  /**
   * 3. Refetch today's schedule when app comes to foreground
   */
  useEffect(() => {
    if (!isAuthenticated || !userProfile?.id) {
      return;
    }

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        console.log("📱 App returned to foreground - refetching today's schedule...");
        dispatch(fetchTodaySchedule(userProfile.id));
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [userProfile?.id, isAuthenticated, dispatch]);

  return {
    isAuthenticated,
    ifChina,
    chinaCheckLoading,
  };
};
