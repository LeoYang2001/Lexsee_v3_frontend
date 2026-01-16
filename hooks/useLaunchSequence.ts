import { useEffect, useState, useRef } from "react";
import { router } from "expo-router";
import { Hub } from "@aws-amplify/core";
import { getCurrentUser } from "aws-amplify/auth";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../store/hooks";
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
import { client } from "../app/client";
import { useCheckChina } from "./useCheckChina";

export const useLaunchSequence = () => {
  const dispatch = useDispatch() as any;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [wordsSubscription, setWordsSubscription] = useState<any>(null);
  const [scheduleSubscription, setScheduleSubscription] = useState<any>(null);
  
  const userProfile = useAppSelector((state) => state.profile.profile);
  
  // Track profile creation to prevent duplicates
  const profileCreationInProgress = useRef<{ [key: string]: boolean }>({});
  const profileCreationTimeout = useRef<{
    [key: string]: ReturnType<typeof setTimeout>;
  }>({});

  // 1. China check (happens automatically via hook)
  const { ifChina, isLoading: chinaCheckLoading } = useCheckChina();

  /**
   * Check if user has a profile
   */
  const checkUserProfile = async (userId: string): Promise<{ hasProfile: boolean; profileId?: string }> => {
    dispatch(setProfileLoading(true));

    try {
      const profileResult = await (client as any).models.UserProfile.list({
        filter: { userId: { eq: userId } },
      });

      if (profileResult.data && profileResult.data.length > 0) {
        const profile = profileResult.data[0];

        // Clean the profile BEFORE dispatching
        const serializedProfile = await cleanUserProfile(profile);
        dispatch(setProfile(serializedProfile));

        if (profileCreationTimeout.current[userId]) {
          clearTimeout(profileCreationTimeout.current[userId]);
          delete profileCreationTimeout.current[userId];
        }

        delete profileCreationInProgress.current[userId];
        dispatch(setProfileLoading(false));
        return { hasProfile: true, profileId: profile.id };
      } else {
        console.log("⚠️ No profile found, may need to create one");

        if (profileCreationInProgress.current[userId]) {
          console.log("⏳ Profile creation already in progress");
          dispatch(setProfileLoading(false));
          return { hasProfile: false };
        }

        profileCreationInProgress.current[userId] = true;

        profileCreationTimeout.current[userId] = setTimeout(() => {
          delete profileCreationInProgress.current[userId];
          delete profileCreationTimeout.current[userId];
        }, 30000);

        dispatch(setProfileLoading(false));
        return { hasProfile: false };
      }
    } catch (error) {
      console.error("❌ Error checking user profile:", error);
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
        
        
        console.log(
          `  ├─ ✅ Fetched ${JSON.stringify(cleanedSchedules)}`
        );
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
        const profileResult = await checkUserProfile(
          resultAction.payload.userId
        );

        if (profileResult.hasProfile && profileResult.profileId) {
          // Only start subscriptions and fetch data if profile exists
          console.log("  ├─ 📋 Profile found - loading user data...");
          
          // 2.1 Start words subscription
          startWordsSubscription();
          
          // 2.2 Fetch all schedules BEFORE navigation
          await fetchAllSchedules(profileResult.profileId);
          
          console.log("\n🏠 Navigating to home...\n");
          router.replace("/(home)");
        } else {
          // No profile found - don't fetch any data
          console.log("⚠️ No profile found - redirecting to auth (no data fetch)");
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
    setIsAuthenticated(false);
    stopWordsSubscription();
    dispatch(clearUser());
    dispatch(clearProfile());
    dispatch(setAllSchedules([]));
    dispatch(setTodaySchedule(null));
    router.replace("/(auth)/sign-in");
  };

  /**
   * Helper to clean schedule data
   */
  const cleanSchedule = (schedule: any) => ({
    id: schedule.id,
    userProfileId: schedule.userProfileId,
    scheduleDate: schedule.scheduleDate,
    notificationId: schedule.notificationId || null,
    successRate: schedule.successRate || null,
    totalWords: schedule.totalWords || null,
    reviewedCount: schedule.reviewedCount || null,
    toBeReviewedCount: schedule.toBeReviewedCount || null,
    scheduleInfo: schedule.scheduleInfo || null,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  });

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
    const authCheckTimer = setTimeout(checkInitialAuth, 500);

    return () => {
      authListener();
      clearTimeout(authCheckTimer);
      stopWordsSubscription();
    };
  }, [dispatch]);

  /**
   * 3. Subscribe to today's schedule (runs after profile is loaded)
   * Note: recoverMissedReviews is now called in handleSuccessfulAuth
   */
  useEffect(() => {
    // Don't subscribe if not authenticated or no profile
    if (!isAuthenticated || !userProfile?.id) {
      console.log("⚠️ No profile or not authenticated - skipping schedule subscription");
      return;
    }

    console.log("� Setting up today's schedule subscription...");

    const currentDate = new Date().toISOString().split("T")[0];

    const sub = (client.models as any).ReviewSchedule.observeQuery({
      filter: {
        and: [
          { userProfileId: { eq: userProfile.id } },
          { scheduleDate: { eq: currentDate } },
        ],
      },
    }).subscribe({
      next: ({ items, isSynced }: any) => {
        // Reduce log noise - only log when items exist
        if (items.length > 0 && isSynced) {
          console.log(`  ✅ Today's schedule loaded (${items.length} schedule(s))`);
        }

        if (items.length > 0) {
          const cleanedSchedule = cleanSchedule(items[0]);
          dispatch(setTodaySchedule(cleanedSchedule));
        } else {
          dispatch(setTodaySchedule(null));
        }
      },
      error: (error: any) => {
        console.error("❌ Schedule subscription error:", error);
      },
    });

    setScheduleSubscription(sub);

    return () => {
      if (sub) {
        sub.unsubscribe();
        console.log("🔕 Schedule subscription unsubscribed");
      }
    };
  }, [userProfile?.id, isAuthenticated, dispatch]);

  return {
    isAuthenticated,
    ifChina,
    chinaCheckLoading,
  };
};
